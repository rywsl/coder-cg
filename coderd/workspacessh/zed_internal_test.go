package workspacessh

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"
)

func TestZedProxyCommand(t *testing.T) {
	t.Parallel()
	const launch = `cd; env .zed_server/zed-remote-server-stable-1.19.2+stable.356.df181c6f proxy --identifier workspace-14`
	for _, command := range []string{launch, launch + " --reconnect", strings.Replace(launch, "env ", "env RUST_LOG=info ", 1)} {
		require.True(t, isZedProxyCommand(command), command)
	}
	for _, command := range []string{
		launch + "; echo leaked", launch + " > /tmp/log", launch + " &",
		strings.Replace(launch, "cd;", "cd /tmp;", 1),
		strings.Replace(launch, "env ", "env LD_PRELOAD=/tmp/inject.so ", 1),
		strings.Replace(launch, "workspace-14", "$(id)", 1),
		strings.Replace(launch, ".zed_server/", "/tmp/", 1),
		strings.Replace(launch, "proxy", "--version", 1),
		"codex app-server", "ls", "cd; env",
	} {
		require.False(t, isZedProxyCommand(command), command)
	}
}

type zedEnvironmentChannel struct {
	ssh.Channel
	variables []sshEnvironment
	reject    bool
}

func (c *zedEnvironmentChannel) SendRequest(name string, wantReply bool, payload []byte) (bool, error) {
	var variable sshEnvironment
	if name != "env" || !wantReply || ssh.Unmarshal(payload, &variable) != nil {
		return false, nil
	}
	c.variables = append(c.variables, variable)
	return !c.reject, nil
}

func TestZedSSHEnvironmentRequests(t *testing.T) {
	t.Parallel()
	const command = "cd; env .zed_server/zed-remote-server-stable-1.19.2 proxy --identifier workspace-14"
	request := &ssh.Request{Type: "exec", Payload: ssh.Marshal(struct{ Command string }{command})}
	config := CodexConfig{Model: "model", BaseURL: "https://example.test/v1", APIKey: "secret"}
	channel := &zedEnvironmentChannel{}
	handled, payload, _ := config.transformRequest(channel)(request)
	require.False(t, handled)
	require.Equal(t, request.Payload, payload)
	require.NotContains(t, string(payload), config.APIKey)
	require.Equal(t, config.zedEnvironment(), channel.variables)
	channel = &zedEnvironmentChannel{reject: true}
	handled, payload, accepted := config.transformRequest(channel)(request)
	require.True(t, handled)
	require.Nil(t, payload)
	require.False(t, accepted)
}

func TestZedEnvironment(t *testing.T) {
	t.Parallel()
	c := CodexConfig{APIKey: "secret-key", Model: `model ' " $(id)`, BaseURL: `https://example.test/v1?x="`, APIKeyEnv: "CUSTOM_KEY"}
	env := make(map[string]string)
	for _, variable := range c.zedEnvironment() {
		env[variable.Name] = variable.Value
		if variable.Name != "CUSTOM_KEY" && variable.Name != "OPENAI_API_KEY" {
			require.NotContains(t, variable.Value, c.APIKey)
		}
	}
	require.Equal(t, c.APIKey, env["CUSTOM_KEY"])
	require.Equal(t, c.APIKey, env["OPENAI_API_KEY"])
	var args []string
	require.NoError(t, json.Unmarshal([]byte(env["CODER_CODEX_ARGS"]), &args))
	expected, _ := c.injectCodexArguments([]string{"codex", "app-server"})
	require.Equal(t, expected[1:len(expected)-1], args)
	require.NotContains(t, args, "app-server")
	var config map[string]string
	require.NoError(t, json.Unmarshal([]byte(env["CODEX_CONFIG"]), &config))
	require.Equal(t, c.Model, config["model"])
	require.Equal(t, "sub2", config["model_provider"])
}
