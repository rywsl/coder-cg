package main

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPublicPortConfiguration(t *testing.T) {
	t.Parallel()
	client, err := configuration("frpc", "212.64.22.217")
	require.NoError(t, err)
	require.Equal(t, 100, strings.Count(client, "[[proxies]]"))
	require.Contains(t, client, "localPort = 18000\nremotePort = 28000")
	require.Contains(t, client, "localPort = 18099\nremotePort = 28099")
	require.NotContains(t, client, "18100")
	require.NotContains(t, client, "token")
	again, err := configuration("frpc", "212.64.22.217")
	require.NoError(t, err)
	require.Equal(t, client, again)
	ingress, err := configuration("nginx", "212.64.22.217")
	require.NoError(t, err)
	require.Equal(t, 100, strings.Count(ingress, "listen "))
	require.Contains(t, ingress, "ssl_certificate /etc/letsencrypt/live/coder-public-ip/fullchain.pem;")
	require.Contains(t, ingress, "proxy_pass http://127.0.0.1:$coder_public_backend;")
	require.Contains(t, ingress, "proxy_set_header Upgrade $http_upgrade;")
	require.Contains(t, ingress, "18099 28099;")
	for _, bad := range []string{"host;return 200;", "http://212.64.22.217", "212.64.22.217:443"} {
		_, err := configuration("nginx", bad)
		require.Error(t, err)
	}
}
