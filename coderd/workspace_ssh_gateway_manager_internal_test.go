package coderd

import (
	"context"
	"net"
	"net/url"
	"testing"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/stretchr/testify/require"

	"cdr.dev/slog/v3/sloggers/slogtest"
	"github.com/coder/coder/v2/coderd/database/dbtestutil"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/testutil"
)

func TestWorkspaceSSHGatewayReconcileConfiguration(t *testing.T) {
	t.Parallel()
	ctx := testutil.Context(t, testutil.WaitLong)
	db, _ := dbtestutil.NewDB(t)
	newManager := func() *workspaceSSHGatewayManager {
		m, err := newWorkspaceSSHGatewayManager(&API{Options: &Options{
			Database: db, DeploymentValues: &codersdk.DeploymentValues{},
			AccessURL: &url.URL{Scheme: "https", Host: "coder.example.test"},
			Logger:    slogtest.Make(t, nil), PrometheusRegistry: prometheus.NewRegistry(),
		}})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, m.close(context.Background())) })
		return m
	}
	first, second := newManager(), newManager()
	config := codersdk.WorkspaceSSHGatewayRuntimeConfig{
		ListenAddress: "127.0.0.1:0", AdvertiseHost: "ssh.example.test", AdvertisePort: 2222,
		CodexBaseURL: "https://responses.example.test/v1", CodexModel: "test-model",
		MaxConnections: 1024, MaxPendingConnections: 128, MaxPendingConnectionsPerIP: 16,
		MaxConnectionsPerUser: 32, MaxChannelsPerConnection: 64,
		AuthAttemptsPerMinute: 120, AuthAttemptsBurst: 20,
	}
	require.NoError(t, first.update(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: config, CodexAPIKey: "first-key"}))
	require.NoError(t, first.start(ctx))
	require.NoError(t, second.reconcile(ctx))
	previous := second.gateway

	// A replica may miss both the stop and the edit notification.
	require.NoError(t, first.stop(ctx))
	config.AdvertiseHost = "new-ssh.example.test"
	require.NoError(t, first.update(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: config, CodexAPIKey: "second-key"}))
	require.NoError(t, first.start(ctx))
	require.NoError(t, second.reconcile(ctx))
	require.Equal(t, config.AdvertiseHost, second.currentInfo().Host)
	require.NotSame(t, previous, second.gateway)
	previous = second.gateway
	require.NoError(t, second.reconcile(ctx))
	require.Same(t, previous, second.gateway, "unchanged configuration must preserve connections")

	// Secret-only edits also require replacement without exposing the secret.
	require.NoError(t, first.stop(ctx))
	require.NoError(t, first.update(ctx, codersdk.UpdateWorkspaceSSHGatewayRequest{Config: config, CodexAPIKey: "third-key"}))
	require.NoError(t, first.start(ctx))
	require.NoError(t, second.reconcile(ctx))
	require.NotSame(t, previous, second.gateway)

	address := second.gateway.Addr().String()
	require.NoError(t, second.close(ctx))
	require.Error(t, second.start(ctx), "a closed manager must never reopen its listener")
	listener, err := net.Listen("tcp", address)
	require.NoError(t, err)
	require.NoError(t, listener.Close())
}
