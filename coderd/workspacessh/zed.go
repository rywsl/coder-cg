package workspacessh

import (
	"encoding/json"
	"regexp"
	"strings"

	"mvdan.cc/sh/v3/syntax"
)

var zedProxyBinary = regexp.MustCompile(`^\.zed_server/zed-remote-server-(stable|preview|nightly)-[a-zA-Z0-9.+-]+$`)
var zedWorkspaceIdentifier = regexp.MustCompile(`^workspace-[0-9]+$`)

// isZedProxyCommand recognizes the Linux launch command emitted by Zed 1.19.2.
// Only literal arguments and Zed's three diagnostic variables are accepted.
func isZedProxyCommand(command string) bool {
	file, err := syntax.NewParser().Parse(strings.NewReader(command), "")
	if err != nil || len(file.Stmts) != 2 {
		return false
	}
	var calls [][]string
	for _, stmt := range file.Stmts {
		call, ok := stmt.Cmd.(*syntax.CallExpr)
		if !ok || stmt.Background || stmt.Negated || stmt.Coprocess || stmt.Disown || len(stmt.Redirs) != 0 || len(call.Assigns) != 0 {
			return false
		}
		words, ok := literalWords(call.Args)
		if !ok {
			return false
		}
		calls = append(calls, words)
	}
	if len(calls[0]) != 1 || calls[0][0] != "cd" || len(calls[1]) < 5 || calls[1][0] != "env" {
		return false
	}
	args := calls[1][1:]
	for len(args) > 0 {
		name, _, assignment := strings.Cut(args[0], "=")
		if !assignment {
			break
		}
		if name != "RUST_LOG" && name != "RUST_BACKTRACE" && name != "ZED_GENERATE_MINIDUMPS" {
			return false
		}
		args = args[1:]
	}
	if len(args) != 4 && len(args) != 5 {
		return false
	}
	return zedProxyBinary.MatchString(args[0]) && args[1] == "proxy" && args[2] == "--identifier" && zedWorkspaceIdentifier.MatchString(args[3]) && (len(args) == 4 || args[4] == "--reconnect")
}

type sshEnvironment struct {
	Name  string
	Value string
}

func (c CodexConfig) zedEnvironment() []sshEnvironment {
	args, _ := c.injectCodexArguments([]string{"codex", "app-server"})
	// The wrapper supplies the subcommand; only forward the configuration flags.
	overrides, _ := json.Marshal(args[1 : len(args)-1])
	config, _ := json.Marshal(map[string]string{"model": c.Model, "model_provider": "sub2"})
	envName := c.APIKeyEnv
	if envName == "" {
		envName = "CODER_CODEX_API_KEY"
	}
	return []sshEnvironment{
		{Name: envName, Value: c.APIKey},
		{Name: "OPENAI_API_KEY", Value: c.APIKey},
		{Name: "CODEX_PATH", Value: "/opt/codex/bin/coder-zed-codex"},
		{Name: "CODER_CODEX_ARGS", Value: string(overrides)},
		{Name: "CODEX_CONFIG", Value: string(config)},
		{Name: "MODEL_PROVIDER", Value: "sub2"},
	}
}
