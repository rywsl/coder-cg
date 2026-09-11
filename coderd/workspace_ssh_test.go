package coderd_test

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3"
	"cdr.dev/slog/v3/sloggers/sloghuman"
	agentpkg "github.com/coder/coder/v2/agent"
	"github.com/coder/coder/v2/agent/agenttest"
	"github.com/coder/coder/v2/coderd/audit"
	"github.com/coder/coder/v2/coderd/coderdtest"
	"github.com/coder/coder/v2/coderd/connectionlog"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbauthz"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/coderd/database/dbgen"
	"github.com/coder/coder/v2/coderd/database/dbtime"
	"github.com/coder/coder/v2/coderd/httpmw"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/provisionersdk/proto"
	"github.com/coder/coder/v2/testutil"
)

//nolint:paralleltest,tparallel // The subtests intentionally share one gateway and database.
func TestWorkspaceSSHGatewayAPI(t *testing.T) {
	t.Parallel()

	listenAddress := reserveWorkspaceSSHAddress(t)
	hostSigner, hostKeyFile := workspaceSSHHostKey(t)
	deploymentValues := coderdtest.DeploymentValues(t)
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.Enabled.Set("true"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.ListenAddress.Set(listenAddress))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.AdvertiseHost.Set("ssh.coder.example.test"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.AdvertisePort.Set("2222"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.HostKeyFile.Set(hostKeyFile))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.CodexBaseURL.Set("https://responses.example.test/v1"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.CodexAPIKey.Set("test-only-codex-api-key"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.CodexModel.Set("gpt-test"))
	accessURL := &url.URL{Scheme: "https", Host: "coder.example.test"}
	auditor := audit.NewMock()
	connectionLogger := connectionlog.NewFake()
	logOutput := &synchronizedBuffer{}
	logger := slog.Make(sloghuman.Sink(logOutput)).Leveled(slog.LevelDebug)
	adminClient, _, api := coderdtest.NewWithAPI(t, &coderdtest.Options{
		AccessURL:        accessURL,
		Auditor:          auditor,
		ConnectionLogger: connectionLogger,
		DeploymentValues: deploymentValues,
		Logger:           &logger,
	})
	db := api.Database
	admin := coderdtest.CreateFirstUser(t, adminClient)
	ownerClient, owner := coderdtest.CreateAnotherUser(t, adminClient, admin.OrganizationID)
	sharedClient, shared := coderdtest.CreateAnotherUser(t, adminClient, admin.OrganizationID)
	deniedClient, _ := coderdtest.CreateAnotherUser(t, adminClient, admin.OrganizationID)

	workspaceBuild := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{
		OrganizationID: admin.OrganizationID,
		OwnerID:        owner.ID,
		Name:           "remote-project",
	}).WithAgent(func(agents []*proto.Agent) []*proto.Agent {
		agents[0].Name = "dev"
		agents[0].OperatingSystem = "linux"
		agents[0].Directory = "/home/coder/workspace"
		return agents
	}).Do()
	agent := workspaceBuild.Agents[0]
	fakeCodexDirectory := t.TempDir()
	fakeCodexArgumentsFile := filepath.Join(fakeCodexDirectory, "arguments")
	fakeCodexAPIKeyFile := filepath.Join(fakeCodexDirectory, "api-key")
	fakeCodexPath := filepath.Join(fakeCodexDirectory, "codex")
	require.NoError(t, os.WriteFile(fakeCodexPath, []byte(`#!/bin/sh
set -eu
printf '%s\n' "$@" > "$FAKE_CODEX_ARGUMENTS_FILE"
printf '%s' "$CODER_CODEX_API_KEY" > "$FAKE_CODEX_API_KEY_FILE"
`), 0o600))
	require.NoError(t, os.Chmod(fakeCodexPath, 0o700))
	_ = agenttest.New(t, adminClient.URL, workspaceBuild.AgentToken, func(options *agentpkg.Options) {
		options.EnvironmentVariables = map[string]string{
			"PATH":                      fakeCodexDirectory + string(os.PathListSeparator) + os.Getenv("PATH"),
			"FAKE_CODEX_ARGUMENTS_FILE": fakeCodexArgumentsFile,
			"FAKE_CODEX_API_KEY_FILE":   fakeCodexAPIKeyFile,
		}
	})
	coderdtest.NewWorkspaceAgentWaiter(t, ownerClient, workspaceBuild.Workspace.ID).WaitFor(coderdtest.AgentsReady)
	projectPath := "/home/coder/项目 工作区"
	setWorkspaceSSHAgentState(t, db, agent.ID, projectPath, workspaceSSHAgentState{ready: true, connected: true})

	ctx := testutil.Context(t, testutil.WaitLong)
	proxy, proxyToken := dbgen.WorkspaceProxy(t, db, database.WorkspaceProxy{})
	proxyResponse, err := ownerClient.RequestWithoutSessionToken(
		ctx,
		http.MethodPost,
		fmt.Sprintf("/api/v2/workspaceagents/%s/workspace-ssh-bootstrap", agent.ID),
		nil,
		func(request *http.Request) {
			request.Header.Set(httpmw.WorkspaceProxyAuthTokenHeader, fmt.Sprintf("%s:%s", proxy.ID, proxyToken))
		},
	)
	require.NoError(t, err)
	defer proxyResponse.Body.Close()
	require.Equal(t, http.StatusUnauthorized, proxyResponse.StatusCode)

	otherOrganization := dbgen.Organization(t, db, database.Organization{Name: "workspace-ssh-other"})
	_, err = deniedClient.CreateWorkspaceSSHKey(ctx, otherOrganization.ID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
		DeviceName: "cross-organization-device",
		PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(newWorkspaceSSHClientSigner(t).PublicKey()))),
	})
	var organizationError *codersdk.Error
	require.ErrorAs(t, err, &organizationError)
	require.Equal(t, http.StatusNotFound, organizationError.StatusCode())

	require.NoError(t, ownerClient.UpdateWorkspaceACL(ctx, workspaceBuild.Workspace.ID, codersdk.UpdateWorkspaceACL{
		UserRoles: map[string]codersdk.WorkspaceRole{
			shared.ID.String(): codersdk.WorkspaceRoleUse,
		},
	}))

	ownerKey := newWorkspaceSSHClientSigner(t)
	sharedKey := newWorkspaceSSHClientSigner(t)
	deniedKey := newWorkspaceSSHClientSigner(t)
	for _, registration := range []struct {
		client *codersdk.Client
		name   string
		signer ssh.Signer
	}{
		{client: ownerClient, name: "owner-device", signer: ownerKey},
		{client: sharedClient, name: "shared-device", signer: sharedKey},
		{client: deniedClient, name: "denied-device", signer: deniedKey},
	} {
		_, err := registration.client.CreateWorkspaceSSHKey(ctx, admin.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
			DeviceName: registration.name,
			PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(registration.signer.PublicKey()))),
		})
		require.NoError(t, err)
	}

	ownerKeys, err := ownerClient.WorkspaceSSHKeys(ctx, admin.OrganizationID.String())
	require.NoError(t, err)
	require.Len(t, ownerKeys, 1)
	err = deniedClient.DeleteWorkspaceSSHKey(ctx, admin.OrganizationID.String(), ownerKeys[0].ID)
	var deleteError *codersdk.Error
	require.ErrorAs(t, err, &deleteError)
	require.Equal(t, http.StatusNotFound, deleteError.StatusCode())

	_, err = sharedClient.CreateWorkspaceSSHKey(ctx, admin.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
		DeviceName: "conflicting-device",
		PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(ownerKey.PublicKey()))),
	})
	var conflictError *codersdk.Error
	require.ErrorAs(t, err, &conflictError)
	require.Equal(t, http.StatusConflict, conflictError.StatusCode())

	alias := strings.Join([]string{agent.Name, workspaceBuild.Workspace.Name, owner.Username, "ssh.coder"}, ".")
	for _, allowed := range []struct {
		name   string
		signer ssh.Signer
	}{
		{name: "Owner", signer: ownerKey},
		{name: "SharedMember", signer: sharedKey},
	} {
		t.Run(allowed.name, func(t *testing.T) {
			client, err := dialWorkspaceSSHGateway(listenAddress, alias, allowed.signer, hostSigner.PublicKey())
			require.NoError(t, err)
			require.NoError(t, client.Close())
		})
	}

	t.Run("CodexInjectionThroughAgent", func(t *testing.T) {
		client, err := dialWorkspaceSSHGateway(listenAddress, alias, ownerKey, hostSigner.PublicKey())
		require.NoError(t, err)
		defer client.Close()

		session, err := client.NewSession()
		require.NoError(t, err)
		require.NoError(t, session.Run("codex app-server --listen stdio"))

		arguments, err := os.ReadFile(fakeCodexArgumentsFile)
		require.NoError(t, err)
		argumentLines := strings.Split(strings.TrimSpace(string(arguments)), "\n")
		require.Contains(t, argumentLines, "app-server")
		require.Contains(t, argumentLines, "--listen")
		require.Contains(t, argumentLines, "stdio")
		require.Contains(t, argumentLines, `model="gpt-test"`)
		require.Contains(t, argumentLines, `model_provider="sub2"`)
		require.Contains(t, argumentLines, `model_providers.sub2.base_url="https://responses.example.test/v1"`)
		require.Contains(t, argumentLines, `model_providers.sub2.env_key="CODER_CODEX_API_KEY"`)
		require.Contains(t, argumentLines, `model_providers.sub2.wire_api="responses"`)
		require.Contains(t, argumentLines, "model_providers.sub2.supports_websockets=false")
		require.NotContains(t, string(arguments), "test-only-codex-api-key")

		apiKey, err := os.ReadFile(fakeCodexAPIKeyFile)
		require.NoError(t, err)
		require.Equal(t, "test-only-codex-api-key", string(apiKey))
	})

	t.Run("NoWorkspaceSSHPermission", func(t *testing.T) {
		_, err := dialWorkspaceSSHGateway(listenAddress, alias, deniedKey, hostSigner.PublicKey())
		require.Error(t, err)
	})

	t.Run("UnregisteredKey", func(t *testing.T) {
		_, err := dialWorkspaceSSHGateway(listenAddress, alias, newWorkspaceSSHClientSigner(t), hostSigner.PublicKey())
		require.Error(t, err)
	})

	t.Run("UnsignedPublicKeyProbeDoesNotUpdateLastUsedAt", func(t *testing.T) {
		probeSigner := newWorkspaceSSHClientSigner(t)
		probeKey, err := ownerClient.CreateWorkspaceSSHKey(ctx, admin.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
			DeviceName: "probe-device",
			PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(probeSigner.PublicKey()))),
		})
		require.NoError(t, err)
		stored, err := db.GetWorkspaceSSHKeyByID(dbauthz.AsSystemRestricted(ctx), probeKey.ID)
		require.NoError(t, err)
		require.False(t, stored.LastUsedAt.Valid)

		_, err = dialWorkspaceSSHGateway(listenAddress, alias, failingSSHSigner{publicKey: probeSigner.PublicKey()}, hostSigner.PublicKey())
		require.Error(t, err)
		stored, err = db.GetWorkspaceSSHKeyByID(dbauthz.AsSystemRestricted(ctx), probeKey.ID)
		require.NoError(t, err)
		require.False(t, stored.LastUsedAt.Valid)

		client, err := dialWorkspaceSSHGateway(listenAddress, alias, probeSigner, hostSigner.PublicKey())
		require.NoError(t, err)
		require.NoError(t, client.Close())
		stored, err = db.GetWorkspaceSSHKeyByID(dbauthz.AsSystemRestricted(ctx), probeKey.ID)
		require.NoError(t, err)
		require.True(t, stored.LastUsedAt.Valid)
	})

	t.Run("SuspendedUser", func(t *testing.T) {
		_, err := adminClient.UpdateUserStatus(ctx, shared.ID.String(), codersdk.UserStatusSuspended)
		require.NoError(t, err)
		_, err = dialWorkspaceSSHGateway(listenAddress, alias, sharedKey, hostSigner.PublicKey())
		require.Error(t, err)
	})

	for _, unavailable := range []struct {
		name  string
		state database.WorkspaceAgentLifecycleState
	}{
		{name: "AgentNotReady", state: database.WorkspaceAgentLifecycleStateStarting},
		{name: "WorkspaceStopped", state: database.WorkspaceAgentLifecycleStateOff},
	} {
		t.Run(unavailable.name, func(t *testing.T) {
			require.NoError(t, db.UpdateWorkspaceAgentLifecycleStateByID(dbauthz.AsSystemRestricted(ctx), database.UpdateWorkspaceAgentLifecycleStateByIDParams{
				ID:             agent.ID,
				LifecycleState: unavailable.state,
			}))
			t.Cleanup(func() {
				setWorkspaceSSHAgentState(t, db, agent.ID, projectPath, workspaceSSHAgentState{ready: true, connected: true})
			})
			_, err := dialWorkspaceSSHGateway(listenAddress, alias, ownerKey, hostSigner.PublicKey())
			require.Error(t, err)
			setWorkspaceSSHAgentState(t, db, agent.ID, projectPath, workspaceSSHAgentState{ready: true, connected: true})
		})
	}

	t.Run("BrowserOnlyDynamic", func(t *testing.T) {
		browserOnly := func(http.ResponseWriter) bool { return true }
		api.WorkspaceClientCoordinateOverride.Store(&browserOnly)
		_, err := dialWorkspaceSSHGateway(listenAddress, alias, ownerKey, hostSigner.PublicKey())
		require.Error(t, err)
		_, err = ownerClient.WorkspaceSSHBootstrap(ctx, agent.ID)
		var sdkErr *codersdk.Error
		require.ErrorAs(t, err, &sdkErr)
		require.Equal(t, http.StatusConflict, sdkErr.StatusCode())

		api.WorkspaceClientCoordinateOverride.Store(nil)
		client, err := dialWorkspaceSSHGateway(listenAddress, alias, ownerKey, hostSigner.PublicKey())
		require.NoError(t, err)
		require.NoError(t, client.Close())
	})

	// Complete an owner session even when only a child test is selected.
	auditClient, err := dialWorkspaceSSHGateway(listenAddress, alias, ownerKey, hostSigner.PublicKey())
	require.NoError(t, err)
	defer auditClient.Close()
	auditSession, err := auditClient.NewSession()
	require.NoError(t, err)
	require.NoError(t, auditSession.Run("true"))
	require.NoError(t, auditClient.Close())

	require.Eventually(t, func() bool {
		return connectionLogger.Contains(t, database.UpsertConnectionLogParams{
			OrganizationID:   admin.OrganizationID,
			WorkspaceOwnerID: owner.ID,
			WorkspaceID:      workspaceBuild.Workspace.ID,
			WorkspaceName:    workspaceBuild.Workspace.Name,
			AgentName:        agent.Name,
			Type:             database.ConnectionTypeSsh,
			ConnectionStatus: database.ConnectionStatusDisconnected,
		})
	}, testutil.WaitMedium, testutil.IntervalFast)
	require.Eventually(t, func() bool {
		return auditor.Contains(t, database.AuditLog{
			UserID:         owner.ID,
			OrganizationID: admin.OrganizationID,
			ResourceType:   database.ResourceTypeWorkspace,
			ResourceID:     workspaceBuild.Workspace.ID,
			Action:         database.AuditActionConnect,
			StatusCode:     http.StatusOK,
		})
	}, testutil.WaitMedium, testutil.IntervalFast)

	t.Run("BootstrapEnrollmentAndRevocation", func(t *testing.T) {
		auditor.ResetLogs()
		bootstrap, err := ownerClient.WorkspaceSSHBootstrap(ctx, agent.ID)
		require.NoError(t, err)
		require.NotEqual(t, uuid.Nil, bootstrap.EnrollmentID)
		require.Equal(t, alias, bootstrap.Alias)
		require.Equal(t, projectPath, bootstrap.ProjectPath)
		require.Contains(t, bootstrap.DeepLink, "projectPath=%2Fhome%2Fcoder%2F%E9%A1%B9%E7%9B%AE%20%E5%B7%A5%E4%BD%9C%E5%8C%BA")
		require.NotContains(t, bootstrap.BashCommand, "test-only-codex-api-key")
		require.NotContains(t, bootstrap.PowerShellCommand, "test-only-codex-api-key")
		pending, err := ownerClient.WorkspaceSSHEnrollmentStatus(ctx, bootstrap.EnrollmentID)
		require.NoError(t, err)
		require.Equal(t, codersdk.WorkspaceSSHEnrollmentStatusPending, pending.Status)
		require.Nil(t, pending.WorkspaceSSHKeyID)

		tokenMatch := regexp.MustCompile(`Authorization: Bearer ([A-Za-z0-9_-]+)`).FindStringSubmatch(bootstrap.BashCommand)
		require.Len(t, tokenMatch, 2)
		token := tokenMatch[1]
		enrollmentPath := "/api/v2/workspace-ssh/enrollments/" + bootstrap.EnrollmentID.String()
		require.NotContains(t, enrollmentPath, token)

		bashScript := workspaceSSHEnrollmentScript(ctx, t, ownerClient, enrollmentPath+"/script?platform=bash", token)
		require.Contains(t, bashScript, "Host "+alias+" *.ssh.coder")
		require.Contains(t, bashScript, "StrictHostKeyChecking yes")
		require.Contains(t, bashScript, "ProxyCommand none")
		require.Contains(t, bashScript, "coder_chatgpt_known_hosts_")
		require.Contains(t, bashScript, "coder_chatgpt_ed25519_")
		require.NotContains(t, bashScript, "StrictHostKeyChecking=no")
		require.NotContains(t, bashScript, "test-only-codex-api-key")

		powerShellScript := workspaceSSHEnrollmentScript(ctx, t, ownerClient, enrollmentPath+"/script?platform=powershell", token)
		require.Contains(t, powerShellScript, "Host "+alias+" *.ssh.coder")
		require.Contains(t, powerShellScript, "StrictHostKeyChecking yes")
		require.Contains(t, powerShellScript, "ProxyCommand none")
		require.NotContains(t, powerShellScript, "test-only-codex-api-key")

		enrollmentSigner := newWorkspaceSSHClientSigner(t)
		request := codersdk.EnrollWorkspaceSSHKeyRequest{
			DeviceName: "enrolled-device",
			PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(enrollmentSigner.PublicKey()))),
		}
		response, err := ownerClient.RequestWithoutSessionToken(ctx, http.MethodPost, enrollmentPath, request, func(request *http.Request) {
			request.Header.Set("Authorization", "Bearer "+token)
		})
		require.NoError(t, err)
		defer response.Body.Close()
		require.Equal(t, http.StatusCreated, response.StatusCode)
		var enrollment codersdk.WorkspaceSSHEnrollmentResponse
		require.NoError(t, json.NewDecoder(response.Body).Decode(&enrollment))
		require.Equal(t, alias, enrollment.Alias)
		require.Equal(t, projectPath, enrollment.ProjectPath)
		status, err := ownerClient.WorkspaceSSHEnrollmentStatus(ctx, bootstrap.EnrollmentID)
		require.NoError(t, err)
		require.Equal(t, codersdk.WorkspaceSSHEnrollmentStatusComplete, status.Status)
		require.Equal(t, enrollment.Key.ID, *status.WorkspaceSSHKeyID)
		require.NotContains(t, logOutput.String(), token)
		require.NotContains(t, logOutput.String(), "params_token")

		reused, err := ownerClient.RequestWithoutSessionToken(ctx, http.MethodPost, enrollmentPath, request, func(request *http.Request) {
			request.Header.Set("Authorization", "Bearer "+token)
		})
		require.NoError(t, err)
		defer reused.Body.Close()
		require.Equal(t, http.StatusNotFound, reused.StatusCode)

		keys, err := ownerClient.WorkspaceSSHKeys(ctx, admin.OrganizationID.String())
		require.NoError(t, err)
		require.Len(t, keys, 3)
		require.True(t, auditor.Contains(t, database.AuditLog{
			Action:         database.AuditActionCreate,
			ResourceType:   database.ResourceTypeWorkspaceSshKey,
			ResourceID:     enrollment.Key.ID,
			OrganizationID: admin.OrganizationID,
			UserID:         owner.ID,
		}))

		secondBootstrap, err := ownerClient.WorkspaceSSHBootstrap(ctx, agent.ID)
		require.NoError(t, err)
		secondToken := workspaceSSHEnrollmentToken(t, secondBootstrap)
		secondPath := "/api/v2/workspace-ssh/enrollments/" + secondBootstrap.EnrollmentID.String()
		secondResponse, err := ownerClient.RequestWithoutSessionToken(ctx, http.MethodPost, secondPath, request, func(request *http.Request) {
			request.Header.Set("Authorization", "Bearer "+secondToken)
		})
		require.NoError(t, err)
		defer secondResponse.Body.Close()
		require.Equal(t, http.StatusCreated, secondResponse.StatusCode)
		var secondEnrollment codersdk.WorkspaceSSHEnrollmentResponse
		require.NoError(t, json.NewDecoder(secondResponse.Body).Decode(&secondEnrollment))
		require.Equal(t, enrollment.Key.ID, secondEnrollment.Key.ID)
		secondStatus, err := ownerClient.WorkspaceSSHEnrollmentStatus(ctx, secondBootstrap.EnrollmentID)
		require.NoError(t, err)
		require.Equal(t, enrollment.Key.ID, *secondStatus.WorkspaceSSHKeyID)

		auditor.ResetLogs()
		require.NoError(t, ownerClient.DeleteWorkspaceSSHKey(ctx, admin.OrganizationID.String(), enrollment.Key.ID))
		require.True(t, auditor.Contains(t, database.AuditLog{
			Action:         database.AuditActionDelete,
			ResourceType:   database.ResourceTypeWorkspaceSshKey,
			ResourceID:     enrollment.Key.ID,
			OrganizationID: admin.OrganizationID,
			UserID:         owner.ID,
		}))
	})

	t.Run("EnrollmentErrorsUseBootstrapLocale", func(t *testing.T) {
		response, err := ownerClient.Request(
			ctx,
			http.MethodPost,
			fmt.Sprintf("/api/v2/workspaceagents/%s/workspace-ssh-bootstrap", agent.ID),
			nil,
			func(request *http.Request) {
				request.Header.Set("Accept-Language", "zh-CN")
			},
		)
		require.NoError(t, err)
		defer response.Body.Close()
		require.Equal(t, http.StatusCreated, response.StatusCode)
		var bootstrap codersdk.WorkspaceSSHBootstrapResponse
		require.NoError(t, json.NewDecoder(response.Body).Decode(&bootstrap))

		token := workspaceSSHEnrollmentToken(t, bootstrap)
		path := "/api/v2/workspace-ssh/enrollments/" + bootstrap.EnrollmentID.String()
		response, err = ownerClient.RequestWithoutSessionToken(
			ctx,
			http.MethodPost,
			path,
			codersdk.EnrollWorkspaceSSHKeyRequest{
				DeviceName: "Linux 设备",
				PublicKey:  "not-an-openssh-public-key",
			},
			func(request *http.Request) {
				request.Header.Set("Authorization", "Bearer "+token)
			},
		)
		require.NoError(t, err)
		defer response.Body.Close()
		require.Equal(t, http.StatusBadRequest, response.StatusCode)
		require.Equal(t, "zh-CN", response.Header.Get("Content-Language"))
		var apiError codersdk.Response
		require.NoError(t, json.NewDecoder(response.Body).Decode(&apiError))
		require.Equal(t, "公钥必须是一个有效的 OpenSSH 公钥。", apiError.Message)
	})

	t.Run("ExpiredEnrollmentStatus", func(t *testing.T) {
		expiredID := uuid.New()
		expiredHash := make([]byte, 32)
		expiredHash[0] = 1
		now := dbtime.Now()
		_, err := db.InsertWorkspaceSSHKeyEnrollment(dbauthz.AsSystemRestricted(ctx), database.InsertWorkspaceSSHKeyEnrollmentParams{
			ID:               expiredID,
			TokenHash:        expiredHash,
			UserID:           owner.ID,
			OrganizationID:   admin.OrganizationID,
			WorkspaceAgentID: agent.ID,
			Locale:           "zh-CN",
			CreatedAt:        now.Add(-2 * time.Minute),
			ExpiresAt:        now.Add(-time.Minute),
		})
		require.NoError(t, err)
		expired, err := ownerClient.WorkspaceSSHEnrollmentStatus(ctx, expiredID)
		require.NoError(t, err)
		require.Equal(t, codersdk.WorkspaceSSHEnrollmentStatusExpired, expired.Status)
		require.Nil(t, expired.WorkspaceSSHKeyID)
	})

	t.Run("ConcurrentEnrollmentsKeepExactKeyAssociation", func(t *testing.T) {
		bootstraps := make([]codersdk.WorkspaceSSHBootstrapResponse, 2)
		requests := make([]codersdk.EnrollWorkspaceSSHKeyRequest, 2)
		for index := range bootstraps {
			var err error
			bootstraps[index], err = ownerClient.WorkspaceSSHBootstrap(ctx, agent.ID)
			require.NoError(t, err)
			signer := newWorkspaceSSHClientSigner(t)
			requests[index] = codersdk.EnrollWorkspaceSSHKeyRequest{
				DeviceName: fmt.Sprintf("concurrent-device-%d", index),
				PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey()))),
			}
			status, err := ownerClient.WorkspaceSSHEnrollmentStatus(ctx, bootstraps[index].EnrollmentID)
			require.NoError(t, err)
			require.Equal(t, codersdk.WorkspaceSSHEnrollmentStatusPending, status.Status)
			require.Nil(t, status.WorkspaceSSHKeyID)
		}

		responses := make([]codersdk.WorkspaceSSHEnrollmentResponse, len(bootstraps))
		errs := make([]error, len(bootstraps))
		var wg sync.WaitGroup
		wg.Add(len(bootstraps))
		for index := range bootstraps {
			go func() {
				defer wg.Done()
				token := workspaceSSHEnrollmentToken(t, bootstraps[index])
				path := "/api/v2/workspace-ssh/enrollments/" + bootstraps[index].EnrollmentID.String()
				response, err := ownerClient.RequestWithoutSessionToken(ctx, http.MethodPost, path, requests[index], func(request *http.Request) {
					request.Header.Set("Authorization", "Bearer "+token)
				})
				if err != nil {
					errs[index] = err
					return
				}
				defer response.Body.Close()
				if response.StatusCode != http.StatusCreated {
					errs[index] = xerrors.Errorf("unexpected enrollment status %d", response.StatusCode)
					return
				}
				errs[index] = json.NewDecoder(response.Body).Decode(&responses[index])
			}()
		}
		wg.Wait()
		for index := range bootstraps {
			require.NoError(t, errs[index])
			status, err := ownerClient.WorkspaceSSHEnrollmentStatus(ctx, bootstraps[index].EnrollmentID)
			require.NoError(t, err)
			require.Equal(t, responses[index].Key.ID, *status.WorkspaceSSHKeyID)
		}
		require.NotEqual(t, responses[0].Key.ID, responses[1].Key.ID)
	})
}

func TestWorkspaceSSHCommunityAuditPersistence(t *testing.T) {
	t.Parallel()
	client, db := coderdtest.NewWithDatabase(t, nil)
	user := coderdtest.CreateFirstUser(t, client)
	ctx := testutil.Context(t, testutil.WaitMedium)
	key, err := client.CreateWorkspaceSSHKey(ctx, user.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
		DeviceName: "community-audit-device",
		PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(newWorkspaceSSHClientSigner(t).PublicKey()))),
	})
	require.NoError(t, err)
	require.NoError(t, client.DeleteWorkspaceSSHKey(ctx, user.OrganizationID.String(), key.ID))

	logs, err := db.GetAuditLogsOffset(dbauthz.AsSystemRestricted(ctx), database.GetAuditLogsOffsetParams{LimitOpt: 100})
	require.NoError(t, err)
	var created, deleted bool
	for _, log := range logs {
		if log.AuditLog.ResourceType != database.ResourceTypeWorkspaceSshKey || log.AuditLog.ResourceID != key.ID {
			continue
		}
		created = created || log.AuditLog.Action == database.AuditActionCreate
		deleted = deleted || log.AuditLog.Action == database.AuditActionDelete
	}
	require.True(t, created)
	require.True(t, deleted)
}

func TestWorkspaceSSHDeviceNameCharacterLimit(t *testing.T) {
	t.Parallel()
	client, _ := coderdtest.NewWithDatabase(t, nil)
	user := coderdtest.CreateFirstUser(t, client)
	ctx := testutil.Context(t, testutil.WaitMedium)
	_, err := client.CreateWorkspaceSSHKey(ctx, user.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
		DeviceName: strings.Repeat("设", 255),
		PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(newWorkspaceSSHClientSigner(t).PublicKey()))),
	})
	require.NoError(t, err)
	_, err = client.CreateWorkspaceSSHKey(ctx, user.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
		DeviceName: strings.Repeat("设", 256),
		PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(newWorkspaceSSHClientSigner(t).PublicKey()))),
	})
	var sdkErr *codersdk.Error
	require.ErrorAs(t, err, &sdkErr)
	require.Equal(t, http.StatusBadRequest, sdkErr.StatusCode())
}

func TestWorkspaceSSHBootstrapAgentAvailability(t *testing.T) {
	t.Parallel()
	client, _, api := coderdtest.NewWithAPI(t, &coderdtest.Options{
		AccessURL: &url.URL{Scheme: "https", Host: "coder.example.test"},
	})
	user := coderdtest.CreateFirstUser(t, client)
	ctx := testutil.Context(t, testutil.WaitLong)
	_, err := client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{
		Config: testWorkspaceSSHGatewayRuntimeConfig("127.0.0.1:0"), CodexAPIKey: "test-key",
	})
	require.NoError(t, err)
	_, err = client.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	db := api.Database

	tests := []struct {
		name      string
		operating string
		ready     bool
		connected bool
	}{
		{name: "NotReady", operating: "linux", connected: true},
		{name: "Disconnected", operating: "linux", ready: true},
		{name: "NonLinux", operating: "windows", ready: true, connected: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			ctx := testutil.Context(t, testutil.WaitMedium)
			build := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{
				OrganizationID: user.OrganizationID,
				OwnerID:        user.UserID,
			}).WithAgent(func(agents []*proto.Agent) []*proto.Agent {
				agents[0].OperatingSystem = test.operating
				return agents
			}).Do()
			setWorkspaceSSHAgentState(t, db, build.Agents[0].ID, "/workspace", workspaceSSHAgentState{ready: test.ready, connected: test.connected})
			_, err := client.WorkspaceSSHBootstrap(ctx, build.Agents[0].ID)
			var sdkErr *codersdk.Error
			require.ErrorAs(t, err, &sdkErr)
			require.Equal(t, http.StatusConflict, sdkErr.StatusCode())
		})
	}

	t.Run("NotLatestBuild", func(t *testing.T) {
		t.Parallel()
		ctx := testutil.Context(t, testutil.WaitMedium)
		build := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{
			OrganizationID: user.OrganizationID,
			OwnerID:        user.UserID,
		}).WithAgent().Do()
		setWorkspaceSSHAgentState(t, db, build.Agents[0].ID, "/workspace", workspaceSSHAgentState{ready: true, connected: true})
		stopBuild := dbfake.WorkspaceBuild(t, db, build.Workspace).
			Seed(database.WorkspaceBuild{
				BuildNumber: build.Build.BuildNumber + 1,
				Transition:  database.WorkspaceTransitionStop,
			}).
			Do()
		require.NoError(t, db.SoftDeletePriorWorkspaceAgents(dbauthz.AsSystemRestricted(ctx), database.SoftDeletePriorWorkspaceAgentsParams{
			WorkspaceID:    build.Workspace.ID,
			CurrentBuildID: stopBuild.Build.ID,
		}))
		_, err := client.WorkspaceSSHBootstrap(ctx, build.Agents[0].ID)
		var sdkErr *codersdk.Error
		require.ErrorAs(t, err, &sdkErr)
		require.Equal(t, http.StatusNotFound, sdkErr.StatusCode())
	})
}

func reserveWorkspaceSSHAddress(t *testing.T) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	address := listener.Addr().String()
	require.NoError(t, listener.Close())
	return address
}

func workspaceSSHHostKey(t *testing.T) (ssh.Signer, string) {
	t.Helper()
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	block, err := ssh.MarshalPrivateKey(privateKey, "")
	require.NoError(t, err)
	path := filepath.Join(t.TempDir(), "workspace_ssh_host_key")
	require.NoError(t, os.WriteFile(path, pem.EncodeToMemory(block), 0o600))
	signer, err := ssh.NewSignerFromKey(privateKey)
	require.NoError(t, err)
	return signer, path
}

func newWorkspaceSSHClientSigner(t *testing.T) ssh.Signer {
	t.Helper()
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	signer, err := ssh.NewSignerFromKey(privateKey)
	require.NoError(t, err)
	return signer
}

type workspaceSSHAgentState struct {
	ready     bool
	connected bool
}

func setWorkspaceSSHAgentState(t *testing.T, db database.Store, agentID uuid.UUID, expandedDirectory string, state workspaceSSHAgentState) {
	t.Helper()
	ctx := dbauthz.AsSystemRestricted(context.Background())
	require.NoError(t, db.UpdateWorkspaceAgentStartupByID(ctx, database.UpdateWorkspaceAgentStartupByIDParams{
		ID: agentID, Version: "test", ExpandedDirectory: expandedDirectory,
	}))
	now := dbtime.Now()
	if state.ready {
		require.NoError(t, db.UpdateWorkspaceAgentLifecycleStateByID(ctx, database.UpdateWorkspaceAgentLifecycleStateByIDParams{
			ID: agentID, LifecycleState: database.WorkspaceAgentLifecycleStateReady,
			StartedAt: sql.NullTime{Time: now, Valid: true}, ReadyAt: sql.NullTime{Time: now, Valid: true},
		}))
	}
	if state.connected {
		require.NoError(t, db.UpdateWorkspaceAgentConnectionByID(ctx, database.UpdateWorkspaceAgentConnectionByIDParams{
			ID: agentID, FirstConnectedAt: sql.NullTime{Time: now, Valid: true},
			LastConnectedAt: sql.NullTime{Time: now, Valid: true}, UpdatedAt: now,
		}))
	}
}

func dialWorkspaceSSHGateway(address, alias string, signer ssh.Signer, hostKey ssh.PublicKey) (*ssh.Client, error) {
	return ssh.Dial("tcp", address, &ssh.ClientConfig{
		User: alias, Auth: []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.FixedHostKey(hostKey), Timeout: 5 * time.Second,
	})
}

func workspaceSSHEnrollmentScript(ctx context.Context, t *testing.T, client *codersdk.Client, path, token string) string {
	t.Helper()
	response, err := client.RequestWithoutSessionToken(ctx, http.MethodGet, path, nil, func(request *http.Request) {
		request.Header.Set("Authorization", "Bearer "+token)
	})
	require.NoError(t, err)
	defer response.Body.Close()
	require.Equal(t, http.StatusOK, response.StatusCode)
	body, err := io.ReadAll(response.Body)
	require.NoError(t, err)
	return string(body)
}

func workspaceSSHEnrollmentToken(t *testing.T, bootstrap codersdk.WorkspaceSSHBootstrapResponse) string {
	t.Helper()
	tokenMatch := regexp.MustCompile(`Authorization: Bearer ([A-Za-z0-9_-]+)`).FindStringSubmatch(bootstrap.BashCommand)
	require.Len(t, tokenMatch, 2)
	return tokenMatch[1]
}

type failingSSHSigner struct {
	publicKey ssh.PublicKey
}

func (s failingSSHSigner) PublicKey() ssh.PublicKey { return s.publicKey }

func (failingSSHSigner) Sign(io.Reader, []byte) (*ssh.Signature, error) {
	return nil, xerrors.New("signing intentionally disabled")
}

type synchronizedBuffer struct {
	mutex sync.Mutex
	bytes.Buffer
}

func (b *synchronizedBuffer) Write(data []byte) (int, error) {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	return b.Buffer.Write(data)
}

func (b *synchronizedBuffer) String() string {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	return b.Buffer.String()
}
