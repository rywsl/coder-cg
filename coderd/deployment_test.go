package coderd_test

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/url"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/coderd/coderdtest"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbtestutil"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/testutil"
)

func TestDeploymentValues(t *testing.T) {
	t.Parallel()
	hi := "hi"
	ctx, cancel := context.WithTimeout(context.Background(), testutil.WaitLong)
	defer cancel()
	cfg := coderdtest.DeploymentValues(t)
	// values should be returned
	cfg.BrowserOnly = true
	// values should not be returned
	cfg.OAuth2.Github.ClientSecret.Set(hi)
	cfg.OIDC.ClientSecret.Set(hi)
	cfg.OIDC.AuthURLParams.Set(`{"foo":"bar"}`)
	cfg.OIDC.EmailField.Set("some_random_field_you_never_expected")
	cfg.PostgresURL.Set(hi)
	cfg.SCIMAPIKey.Set(hi)
	cfg.ExternalTokenEncryptionKeys.Set("the_random_key_we_never_expected,an_other_key_we_never_unexpected")
	cfg.Provisioner.DaemonPSK = "provisionersftw"

	client := coderdtest.New(t, &coderdtest.Options{
		DeploymentValues: cfg,
	})
	_ = coderdtest.CreateFirstUser(t, client)
	scrubbed, err := client.DeploymentConfig(ctx)
	require.NoError(t, err)
	// ensure normal values pass through
	require.EqualValues(t, true, scrubbed.Values.BrowserOnly.Value())
	require.NotEmpty(t, cfg.OIDC.AuthURLParams)
	require.EqualValues(t, cfg.OIDC.AuthURLParams, scrubbed.Values.OIDC.AuthURLParams)
	require.NotEmpty(t, cfg.OIDC.EmailField)
	require.EqualValues(t, cfg.OIDC.EmailField, scrubbed.Values.OIDC.EmailField)
	// ensure secrets are removed
	require.Empty(t, scrubbed.Values.OAuth2.Github.ClientSecret.Value())
	require.Empty(t, scrubbed.Values.OIDC.ClientSecret.Value())
	require.Empty(t, scrubbed.Values.PostgresURL.Value())
	require.Empty(t, scrubbed.Values.SCIMAPIKey.Value())
	require.Empty(t, scrubbed.Values.ExternalTokenEncryptionKeys.Value())
	require.Empty(t, scrubbed.Values.Provisioner.DaemonPSK.Value())
}

func TestDeploymentStats(t *testing.T) {
	t.Parallel()
	t.Log("This test is time-sensitive. It may fail if the deployment is not ready in time.")
	ctx, cancel := context.WithTimeout(context.Background(), testutil.WaitLong)
	defer cancel()
	client := coderdtest.New(t, &coderdtest.Options{})
	_ = coderdtest.CreateFirstUser(t, client)
	assert.True(t, testutil.Eventually(ctx, t, func(tctx context.Context) bool {
		_, err := client.DeploymentStats(tctx)
		return err == nil
	}, testutil.IntervalMedium), "failed to get deployment stats in time")
}

func TestWorkspaceSSHGatewayManagement(t *testing.T) {
	t.Parallel()

	ctx := testutil.Context(t, testutil.WaitLong)
	client := coderdtest.New(t, &coderdtest.Options{
		AccessURL: &url.URL{Scheme: "https", Host: "coder.example.test"},
	})
	admin := coderdtest.CreateFirstUser(t, client)
	memberClient, _ := coderdtest.CreateAnotherUser(t, client, admin.OrganizationID)

	_, err := memberClient.WorkspaceSSHGateway(ctx)
	var forbidden *codersdk.Error
	require.ErrorAs(t, err, &forbidden)
	require.Equal(t, http.StatusForbidden, forbidden.StatusCode())
	for _, operation := range []func(context.Context) (codersdk.WorkspaceSSHGatewayStatus, error){
		memberClient.StartWorkspaceSSHGateway,
		memberClient.StopWorkspaceSSHGateway,
		func(ctx context.Context) (codersdk.WorkspaceSSHGatewayStatus, error) {
			return memberClient.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{
				Config: testWorkspaceSSHGatewayRuntimeConfig("127.0.0.1:0"),
			})
		},
	} {
		_, err := operation(ctx)
		require.ErrorAs(t, err, &forbidden)
		require.Equal(t, http.StatusForbidden, forbidden.StatusCode())
	}

	status, err := client.WorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.False(t, status.Configured)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateStopped, status.State)

	config := testWorkspaceSSHGatewayRuntimeConfig("127.0.0.1:0")
	apiKey := uuid.NewString()
	status, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{
		Config:      config,
		CodexAPIKey: apiKey,
	})
	require.NoError(t, err)
	require.True(t, status.Configured)
	require.True(t, status.APIKeyConfigured)
	require.NotEmpty(t, status.HostPublicKey)
	require.NotEmpty(t, status.HostKeyFingerprint)
	encoded, err := json.Marshal(status)
	require.NoError(t, err)
	require.NotContains(t, string(encoded), apiKey)
	require.NotContains(t, string(encoded), "PRIVATE KEY")

	config.CodexModel = "gpt-updated"
	status, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: config})
	require.NoError(t, err)
	require.True(t, status.APIKeyConfigured, "an empty API key must preserve the stored secret")
	require.Equal(t, "gpt-updated", status.Config.CodexModel)

	_, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{
		Config:           config,
		ClearCodexAPIKey: true,
	})
	var invalid *codersdk.Error
	require.ErrorAs(t, err, &invalid)
	require.Equal(t, http.StatusBadRequest, invalid.StatusCode())
	sshOnly := config
	sshOnly.CodexBaseURL, sshOnly.CodexModel = "", ""
	status, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: sshOnly, ClearCodexAPIKey: true})
	require.NoError(t, err)
	require.False(t, status.APIKeyConfigured)
	status, err = client.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateRunning, status.State)
	_, err = client.StopWorkspaceSSHGateway(ctx)
	require.NoError(t, err)

	status, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{
		Config:      config,
		CodexAPIKey: apiKey,
	})
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateStopped, status.State)

	status, err = client.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.True(t, status.DesiredEnabled)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateRunning, status.State)
	require.NotEmpty(t, status.BoundAddress)

	secondStart, err := client.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, status.BoundAddress, secondStart.BoundAddress)

	_, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: config})
	var conflict *codersdk.Error
	require.ErrorAs(t, err, &conflict)
	require.Equal(t, http.StatusConflict, conflict.StatusCode())

	status, err = client.StopWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.False(t, status.DesiredEnabled)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateStopped, status.State)
	status, err = client.StopWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateStopped, status.State)

	occupied, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	occupiedAddress := occupied.Addr().String()
	config.ListenAddress = occupiedAddress
	_, err = client.UpdateWorkspaceSSHGateway(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: config})
	require.NoError(t, err)
	_, err = client.StartWorkspaceSSHGateway(ctx)
	require.Error(t, err)
	var listenErr *codersdk.Error
	require.ErrorAs(t, err, &listenErr)
	require.Equal(t, http.StatusConflict, listenErr.StatusCode())
	status, err = client.WorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateError, status.State)
	require.Equal(t, "listen_failed", status.ErrorCode)
	require.NoError(t, occupied.Close())

	status, err = client.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateRunning, status.State)
	require.Equal(t, occupiedAddress, status.BoundAddress)
	_, err = client.StopWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
}

func TestWorkspaceSSHGatewayReplicaSync(t *testing.T) {
	t.Parallel()

	db, replicaPubsub := dbtestutil.NewDB(t)
	accessURL := &url.URL{Scheme: "https", Host: "coder.example.test"}
	newReplica := func() *codersdk.Client {
		client, _, _ := coderdtest.NewWithAPI(t, &coderdtest.Options{
			AccessURL:         accessURL,
			Database:          db,
			Pubsub:            replicaPubsub,
			ReplicaSyncPubsub: replicaPubsub,
		})
		return client
	}

	firstClient := newReplica()
	_ = coderdtest.CreateFirstUser(t, firstClient)
	secondClient := newReplica()
	secondClient.SetSessionToken(firstClient.SessionToken())

	config := testWorkspaceSSHGatewayRuntimeConfig("127.0.0.1:0")
	apiKey := uuid.NewString()
	statuses := make([]codersdk.WorkspaceSSHGatewayStatus, 2)
	registrationErrors := make([]error, 2)
	var waitGroup sync.WaitGroup
	for index, client := range []*codersdk.Client{firstClient, secondClient} {
		waitGroup.Add(1)
		go func() {
			defer waitGroup.Done()
			statuses[index], registrationErrors[index] = client.UpdateWorkspaceSSHGateway(
				testutil.Context(t, testutil.WaitLong),
				codersdk.UpdateWorkspaceSSHGatewayRequest{
					Config:      config,
					CodexAPIKey: apiKey,
				},
			)
		}()
	}
	waitGroup.Wait()
	for _, err := range registrationErrors {
		require.NoError(t, err)
	}
	require.NotEmpty(t, statuses[0].HostKeyFingerprint)
	require.Equal(t, statuses[0].HostKeyFingerprint, statuses[1].HostKeyFingerprint)

	ctx := testutil.Context(t, testutil.WaitLong)
	firstStatus, err := firstClient.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateRunning, firstStatus.State)
	require.True(t, testutil.Eventually(ctx, t, func(checkCtx context.Context) bool {
		status, err := secondClient.WorkspaceSSHGateway(checkCtx)
		return err == nil && status.State == codersdk.WorkspaceSSHGatewayStateRunning
	}, testutil.IntervalFast))

	thirdClient := newReplica()
	thirdClient.SetSessionToken(firstClient.SessionToken())
	require.True(t, testutil.Eventually(ctx, t, func(checkCtx context.Context) bool {
		status, err := thirdClient.WorkspaceSSHGateway(checkCtx)
		return err == nil &&
			status.DesiredEnabled &&
			status.State == codersdk.WorkspaceSSHGatewayStateRunning &&
			status.HostKeyFingerprint == firstStatus.HostKeyFingerprint
	}, testutil.IntervalFast))

	_, err = secondClient.StopWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	for _, client := range []*codersdk.Client{firstClient, thirdClient} {
		require.True(t, testutil.Eventually(ctx, t, func(checkCtx context.Context) bool {
			status, err := client.WorkspaceSSHGateway(checkCtx)
			return err == nil &&
				!status.DesiredEnabled &&
				status.State == codersdk.WorkspaceSSHGatewayStateStopped
		}, testutil.IntervalFast))
	}
}

func TestWorkspaceSSHGatewayStartPersistenceFailure(t *testing.T) {
	t.Parallel()

	db, replicaPubsub := dbtestutil.NewDB(t)
	failConfigWrite := &atomic.Bool{}
	store := &failWorkspaceSSHGatewayConfigStore{
		Store: db,
		fail:  failConfigWrite,
	}
	client := coderdtest.New(t, &coderdtest.Options{
		AccessURL:         &url.URL{Scheme: "https", Host: "coder.example.test"},
		Database:          store,
		Pubsub:            replicaPubsub,
		ReplicaSyncPubsub: replicaPubsub,
	})
	_ = coderdtest.CreateFirstUser(t, client)

	listenAddress := reserveWorkspaceSSHAddress(t)
	config := testWorkspaceSSHGatewayRuntimeConfig(listenAddress)
	_, err := client.UpdateWorkspaceSSHGateway(
		testutil.Context(t, testutil.WaitLong),
		codersdk.UpdateWorkspaceSSHGatewayRequest{
			Config:      config,
			CodexAPIKey: "workspace-ssh-persistence-secret",
		},
	)
	require.NoError(t, err)

	failConfigWrite.Store(true)
	ctx := testutil.Context(t, testutil.WaitLong)
	_, err = client.StartWorkspaceSSHGateway(ctx)
	require.Error(t, err)
	var persistenceErr *codersdk.Error
	require.ErrorAs(t, err, &persistenceErr)
	require.Equal(t, http.StatusInternalServerError, persistenceErr.StatusCode())
	status, err := client.WorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.False(t, status.DesiredEnabled)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateError, status.State)
	require.Equal(t, "persistence_failed", status.ErrorCode)
	require.Empty(t, status.BoundAddress)

	listener, err := net.Listen("tcp", listenAddress)
	require.NoError(t, err, "failed start must release its listener")
	require.NoError(t, listener.Close())

	status, err = client.StartWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
	require.Equal(t, codersdk.WorkspaceSSHGatewayStateRunning, status.State)
	_, err = client.StopWorkspaceSSHGateway(ctx)
	require.NoError(t, err)
}

type failWorkspaceSSHGatewayConfigStore struct {
	database.Store
	fail *atomic.Bool
}

func (s *failWorkspaceSSHGatewayConfigStore) InTx(fn func(database.Store) error, opts *database.TxOptions) error {
	return s.Store.InTx(func(tx database.Store) error {
		return fn(&failWorkspaceSSHGatewayConfigStore{Store: tx, fail: s.fail})
	}, opts)
}

func (s *failWorkspaceSSHGatewayConfigStore) UpsertWorkspaceSSHGatewayConfig(ctx context.Context, config string) error {
	if s.fail.CompareAndSwap(true, false) {
		return xerrors.New("test workspace SSH gateway config write failure")
	}
	return s.Store.UpsertWorkspaceSSHGatewayConfig(ctx, config)
}

func testWorkspaceSSHGatewayRuntimeConfig(listenAddress string) codersdk.WorkspaceSSHGatewayRuntimeConfig {
	return codersdk.WorkspaceSSHGatewayRuntimeConfig{
		ListenAddress:              listenAddress,
		AdvertiseHost:              "ssh.coder.example.test",
		AdvertisePort:              2222,
		CodexBaseURL:               "https://responses.example.test/v1",
		CodexModel:                 "gpt-test",
		MaxConnections:             1024,
		MaxPendingConnections:      128,
		MaxPendingConnectionsPerIP: 16,
		MaxConnectionsPerUser:      32,
		MaxChannelsPerConnection:   64,
		AuthAttemptsPerMinute:      120,
		AuthAttemptsBurst:          20,
	}
}
