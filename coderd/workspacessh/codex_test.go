package workspacessh //nolint:testpackage // Exercises strict package-private command parsing.

import (
	"slices"
	"strings"
	"testing"

	"github.com/kballard/go-shellquote"
	"github.com/stretchr/testify/require"
	"mvdan.cc/sh/v3/syntax"
)

func TestCodexConfigInject(t *testing.T) {
	t.Parallel()
	config := CodexConfig{
		Model:     "gpt-5.2 codex",
		BaseURL:   "https://api.example.test/v1?mode=a b",
		APIKey:    "must-not-appear",
		APIKeyEnv: "TEST_CODEX_KEY",
	}
	desktopPathProbe := shellquote.Join(
		"sh", "-c", desktopLoginShellWrapperV1, "sh",
		`printf '%b' '\371\276\172\232\173\345\004\023'; PATH="${CODEX_INSTALL_DIR:-$HOME/.local/bin}:$PATH"; export PATH; if command -v codex >/dev/null 2>&1; then exit 0; fi`,
	)
	desktopVersionProbe := shellquote.Join(
		"sh", "-c", desktopLoginShellWrapperV1, "sh",
		`printf '%b' '\001\226\155\254\132\222\224\043'; PATH="${CODEX_INSTALL_DIR:-$HOME/.local/bin}:$PATH"; export PATH; codex --version`,
	)
	desktopProxy := shellquote.Join("sh", "-c", desktopLoginShellWrapperV1, "sh", desktopProxyPayloadV1)

	tests := []struct {
		name     string
		command  string
		inject   bool
		decision codexCommandDecision
	}{
		{name: "Direct", command: "codex app-server", inject: true, decision: codexCommandInject},
		{name: "Arguments", command: `codex app-server --listen "stdio mode"`, inject: true, decision: codexCommandInject},
		{name: "GlobalConfig", command: `codex -c features.code_mode_host=true app-server --listen unix://`, inject: true, decision: codexCommandInject},
		{name: "Proxy", command: `codex app-server proxy`, decision: codexCommandPass},
		{name: "DesktopProxy", command: desktopProxy, decision: codexCommandPass},
		{name: "Version", command: `codex --version`, decision: codexCommandPass},
		{name: "DesktopPathProbe", command: desktopPathProbe, decision: codexCommandPass},
		{name: "DesktopVersionProbe", command: desktopVersionProbe, decision: codexCommandPass},
		{name: "Ordinary", command: `printf hello`, decision: codexCommandPass},
		{name: "AppServerLog", command: `cat .codex/app-server-control/app-server.log`, decision: codexCommandPass},
		{name: "SimilarWords", command: `printf '%s' codex-app-server`, decision: codexCommandPass},
		{name: "Path", command: "/usr/bin/codex app-server", decision: codexCommandReject},
		{name: "Shell", command: "sh -c 'codex app-server'", decision: codexCommandReject},
		{name: "Sequence", command: "codex app-server; touch /tmp/injected", decision: codexCommandReject},
		{name: "And", command: "codex app-server && touch /tmp/injected", decision: codexCommandReject},
		{name: "Expansion", command: "codex app-server $(touch /tmp/injected)", decision: codexCommandReject},
		{name: "Backtick", command: "codex app-server `touch /tmp/injected`", decision: codexCommandReject},
		{name: "EnvironmentPrefix", command: "FOO=bar codex app-server", decision: codexCommandReject},
	}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			_, decision := config.transformCommand(test.command)
			require.Equal(t, test.decision, decision)
			command, ok := config.inject(test.command)
			require.Equal(t, test.inject, ok)
			if !ok {
				require.Empty(t, command)
				return
			}
			require.NotContains(t, command, config.APIKey)
			words, err := shellquote.Split(command)
			require.NoError(t, err)
			require.Equal(t, "codex", words[0])
			require.Contains(t, words, "app-server")
			require.True(t, slices.Contains(words, `model="gpt-5.2 codex"`))
			require.True(t, slices.Contains(words, `model_provider="sub2"`))
			require.True(t, slices.Contains(words, `model_providers.sub2.name="Sub2"`))
			require.True(t, slices.Contains(words, `model_providers.sub2.base_url="https://api.example.test/v1?mode=a b"`))
			require.True(t, slices.Contains(words, `model_providers.sub2.env_key="TEST_CODEX_KEY"`))
			require.True(t, slices.Contains(words, `model_providers.sub2.wire_api="responses"`))
			require.True(t, slices.Contains(words, "model_providers.sub2.supports_websockets=false"))
			require.False(t, strings.Contains(command, "\n"))
		})
	}
}

func TestCodexConfigInjectDesktopLoginShell(t *testing.T) {
	t.Parallel()
	config := CodexConfig{
		Model:     `model ' " $() ;`,
		BaseURL:   `https://api.example.test/v1?value=' " $() ;`,
		APIKey:    "must-not-appear",
		APIKeyEnv: "TEST_CODEX_KEY",
	}
	command := shellquote.Join("sh", "-c", desktopLoginShellWrapperV1, "sh", desktopDaemonPayloadV1)
	outer, ok := parseSingleLiteralCommand(command)
	require.True(t, ok)
	require.Equal(t, desktopDaemonPayloadV1, outer[4])
	payload, err := syntax.NewParser().Parse(strings.NewReader(outer[4]), "")
	require.NoError(t, err)
	require.True(t, matchesDesktopPayloadV1(payload, desktopDaemonPayloadV1))

	transformed, decision := config.transformCommand(command)
	require.Equal(t, codexCommandInject, decision)
	require.NotContains(t, transformed, config.APIKey)
	outer, ok = parseSingleLiteralCommand(transformed)
	require.True(t, ok)
	require.Len(t, outer, 5)
	require.Contains(t, outer[4], `model_provider=\"sub2\"`)
	require.Contains(t, outer[4], `model_providers.sub2.name=\"Sub2\"`)
	require.Contains(t, outer[4], `model_providers.sub2.wire_api=\"responses\"`)
	require.NotContains(t, outer[4], "touch /tmp")

	otherMarker := strings.Replace(desktopDaemonPayloadV1, `\146\200\115\255\154\052\316\021`, `\325\365\204\134\362\272\203\244`, 1)
	transformed, decision = config.transformCommand(shellquote.Join("sh", "-c", desktopLoginShellWrapperV1, "sh", otherMarker))
	require.Equal(t, codexCommandInject, decision)
	require.NotContains(t, transformed, config.APIKey)
}

func TestCodexConfigDesktopLoginShellRejectsUnsafePayload(t *testing.T) {
	t.Parallel()
	config := CodexConfig{Model: "model", BaseURL: "https://api.example.test", APIKey: "secret"}
	tests := []string{
		`codex app-server; env >/tmp/leak`,
		`wrapper codex app-server`,
		`nohup codex app-server & codex app-server`,
		`nohup "$CODEX" app-server`,
		strings.Replace(desktopProxyPayloadV1, "exec codex app-server proxy", "exec codex app-server proxy; touch /tmp/leak", 1),
		strings.Replace(desktopProxyPayloadV1, "exec codex app-server proxy", "exec env codex app-server proxy", 1),
	}
	for _, payload := range tests {
		payload := payload
		t.Run(payload, func(t *testing.T) {
			t.Parallel()
			command := shellquote.Join("sh", "-c", desktopLoginShellWrapperV1, "sh", payload)
			transformed, decision := config.transformCommand(command)
			require.Empty(t, transformed)
			require.Equal(t, codexCommandReject, decision)
		})
	}
}
