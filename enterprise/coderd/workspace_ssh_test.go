package coderd_test

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/pem"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"

	agentpkg "github.com/coder/coder/v2/agent"
	"github.com/coder/coder/v2/agent/agenttest"
	"github.com/coder/coder/v2/coderd/coderdtest"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/enterprise/coderd/coderdenttest"
	"github.com/coder/coder/v2/enterprise/coderd/license"
	"github.com/coder/coder/v2/provisionersdk/proto"
	"github.com/coder/coder/v2/testutil"
)

func TestWorkspaceSSHGatewayClosesBeforeConnectionLogger(t *testing.T) {
	t.Parallel()

	listenAddress := reserveEnterpriseWorkspaceSSHAddress(t)
	hostSigner, hostKeyFile := enterpriseWorkspaceSSHHostKey(t)
	deploymentValues := coderdtest.DeploymentValues(t)
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.Enabled.Set("true"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.ListenAddress.Set(listenAddress))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.AdvertiseHost.Set("ssh.coder.example.test"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.AdvertisePort.Set("2222"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.HostKeyFile.Set(hostKeyFile))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.CodexBaseURL.Set("https://responses.example.test/v1"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.CodexAPIKey.Set("test-only-codex-api-key"))
	require.NoError(t, deploymentValues.WorkspaceSSHGateway.CodexModel.Set("gpt-test"))
	connectionLogger := newLifecycleConnectionLogger()
	client, _, api, user := coderdenttest.NewWithAPI(t, &coderdenttest.Options{
		ConnectionLogging: true,
		LicenseOptions: &coderdenttest.LicenseOptions{Features: license.Features{
			codersdk.FeatureConnectionLog: 1,
		}},
		Options: &coderdtest.Options{
			AccessURL:        &url.URL{Scheme: "https", Host: "coder.example.test"},
			ConnectionLogger: connectionLogger,
			DeploymentValues: deploymentValues,
		},
	})
	db := api.Database
	build := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{
		OrganizationID: user.OrganizationID,
		OwnerID:        user.UserID,
		Name:           "shutdown-workspace",
	}).WithAgent(func(agents []*proto.Agent) []*proto.Agent {
		agents[0].Name = "dev"
		agents[0].OperatingSystem = "linux"
		return agents
	}).Do()
	agent := agenttest.New(t, client.URL, build.AgentToken, func(options *agentpkg.Options) {
		options.EnvironmentVariables = map[string]string{"PATH": os.Getenv("PATH")}
	})
	_ = coderdtest.NewWorkspaceAgentWaiter(t, client, build.Workspace.ID).Wait()

	ctx := testutil.Context(t, testutil.WaitLong)
	signer := enterpriseWorkspaceSSHClientSigner(t)
	_, err := client.CreateWorkspaceSSHKey(ctx, user.OrganizationID.String(), codersdk.CreateWorkspaceSSHKeyRequest{
		DeviceName: "enterprise-shutdown-device",
		PublicKey:  strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey()))),
	})
	require.NoError(t, err)
	alias := strings.Join([]string{build.Agents[0].Name, build.Workspace.Name, coderdtest.FirstUserParams.Username, "ssh.coder"}, ".")
	sshClient, err := ssh.Dial("tcp", listenAddress, &ssh.ClientConfig{
		User:            alias,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.FixedHostKey(hostSigner.PublicKey()),
	})
	require.NoError(t, err)
	select {
	case <-connectionLogger.connected:
	case <-time.After(testutil.WaitLong):
		require.FailNow(t, "workspace SSH connected event was not recorded")
	}

	closeResult := make(chan error, 1)
	go func() { closeResult <- api.Close() }()
	require.Eventually(t, func() bool {
		conn, err := net.Dial("tcp", listenAddress)
		if err == nil {
			_ = conn.Close()
		}
		return err != nil
	}, testutil.WaitMedium, testutil.IntervalFast)
	require.NoError(t, sshClient.Close())
	require.NoError(t, agent.Close())
	require.NoError(t, <-closeResult)
	require.True(t, connectionLogger.wasDisconnectedBeforeClose())
}

func reserveEnterpriseWorkspaceSSHAddress(t *testing.T) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	address := listener.Addr().String()
	require.NoError(t, listener.Close())
	return address
}

func enterpriseWorkspaceSSHHostKey(t *testing.T) (ssh.Signer, string) {
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

func enterpriseWorkspaceSSHClientSigner(t *testing.T) ssh.Signer {
	t.Helper()
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	signer, err := ssh.NewSignerFromKey(privateKey)
	require.NoError(t, err)
	return signer
}

type lifecycleConnectionLogger struct {
	mutex                   sync.Mutex
	connected               chan struct{}
	connectedOnce           sync.Once
	closed                  bool
	disconnectedBeforeClose bool
}

func newLifecycleConnectionLogger() *lifecycleConnectionLogger {
	return &lifecycleConnectionLogger{connected: make(chan struct{})}
}

func (l *lifecycleConnectionLogger) Upsert(_ context.Context, event database.UpsertConnectionLogParams) error {
	l.mutex.Lock()
	defer l.mutex.Unlock()
	if event.ConnectionStatus == database.ConnectionStatusConnected {
		l.connectedOnce.Do(func() { close(l.connected) })
	}
	if event.ConnectionStatus == database.ConnectionStatusDisconnected {
		l.disconnectedBeforeClose = !l.closed
	}
	return nil
}

func (l *lifecycleConnectionLogger) Close() error {
	l.mutex.Lock()
	defer l.mutex.Unlock()
	l.closed = true
	return nil
}

func (l *lifecycleConnectionLogger) wasDisconnectedBeforeClose() bool {
	l.mutex.Lock()
	defer l.mutex.Unlock()
	return l.closed && l.disconnectedBeforeClose
}
