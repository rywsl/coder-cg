package workspacessh

import (
	"bytes"
	"strconv"
	"strings"

	"github.com/kballard/go-shellquote"
	"golang.org/x/crypto/ssh"
	"mvdan.cc/sh/v3/syntax"
)

// This wrapper is emitted by ChatGPT Desktop 26.901.51231 on Linux. Keeping
// it exact prevents an arbitrary shell program from receiving the injected
// API key while still allowing the inner payload to evolve safely.
const desktopLoginShellWrapperV1 = `if [ -z "$SHELL" ] || [ ! -x "$SHELL" ]; then echo "Codex remote SSH requires SHELL to point to an executable login shell" >&2; exit 127; fi; CODEX_REMOTE_PAYLOAD="$1"; export CODEX_REMOTE_PAYLOAD; case "${SHELL##*/}" in csh|tcsh) exec "$SHELL" -i -c 'set loginsh=1; if ( -r /etc/csh.login ) source /etc/csh.login; if ( -r ~/.login ) source ~/.login; exec /bin/sh -c "$CODEX_REMOTE_PAYLOAD"' ;; nu) exec "$SHELL" -l -i -c 'exec /bin/sh -c $env.CODEX_REMOTE_PAYLOAD' ;; fish|xonsh) exec "$SHELL" -l -i -c 'exec /bin/sh -c "$CODEX_REMOTE_PAYLOAD"' ;; *) exec "$SHELL" -l -i -c 'CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"; export CODEX_HOME; exec /bin/sh -c "$CODEX_REMOTE_PAYLOAD"' ;; esac`

const desktopDaemonPayloadV1 = `printf '%b' '\146\200\115\255\154\052\316\021'; PATH="${CODEX_INSTALL_DIR:-$HOME/.local/bin}:$PATH"; export PATH; if [ "${CODEX_SSH_SKIP_APP_SERVER_BOOT:-}" = "true" ]; then exit 0; fi; (umask 077; mkdir -p -- "${CODEX_HOME:-$HOME/.codex}/app-server-control" && (pkill -9 -U "$(id -u)" -f 'codex.*[d]esktop-ssh-websocket-v0.sock' || true) && if [ -S "${SSH_AUTH_SOCK:-}" ]; then ln -sfn -- "$SSH_AUTH_SOCK" "${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock"; elif [ ! -S "${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock" ]; then rm -f -- "${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock"; fi && : >"${CODEX_HOME:-$HOME/.codex}/app-server-control/app-server.log") && SSH_AUTH_SOCK="${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock" nohup codex -c features.code_mode_host=true app-server --listen unix:// >"${CODEX_HOME:-$HOME/.codex}/app-server-control/app-server.log" 2>&1 &`

const desktopProxyPayloadV1 = `printf '%b' '\146\200\115\255\154\052\316\021'; PATH="${CODEX_INSTALL_DIR:-$HOME/.local/bin}:$PATH"; export PATH; if [ -S "${SSH_AUTH_SOCK:-}" ]; then ln -sfn -- "$SSH_AUTH_SOCK" "${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock"; elif [ ! -S "${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock" ]; then rm -f -- "${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock"; fi && exec codex app-server proxy`

// CodexConfig is injected only into recognized Codex app-server daemon exec
// requests.
type CodexConfig struct {
	Model     string
	BaseURL   string
	APIKey    string
	APIKeyEnv string
}

type codexCommandDecision int

const (
	codexCommandPass codexCommandDecision = iota
	codexCommandInject
	codexCommandReject
)

func (c CodexConfig) transformRequest(destination ssh.Channel) func(*ssh.Request) (bool, []byte, bool) {
	return func(request *ssh.Request) (bool, []byte, bool) {
		if request.Type != "exec" {
			return false, request.Payload, false
		}
		var execRequest struct{ Command string }
		if err := ssh.Unmarshal(request.Payload, &execRequest); err != nil {
			return false, request.Payload, false
		}
		if isZedProxyCommand(execRequest.Command) {
			for _, variable := range c.zedEnvironment() {
				accepted, err := destination.SendRequest("env", true, ssh.Marshal(variable))
				if err != nil || !accepted {
					return true, nil, false
				}
			}
			return false, request.Payload, false
		}
		command, decision := c.transformCommand(execRequest.Command)
		switch decision {
		case codexCommandPass:
			return false, request.Payload, false
		case codexCommandReject:
			return true, nil, false
		case codexCommandInject:
		default:
			return true, nil, false
		}
		envName := c.APIKeyEnv
		if envName == "" {
			envName = "CODER_CODEX_API_KEY"
		}
		envPayload := ssh.Marshal(struct {
			Name  string
			Value string
		}{Name: envName, Value: c.APIKey})
		accepted, err := destination.SendRequest("env", true, envPayload)
		if err != nil || !accepted {
			return true, nil, false
		}
		return false, ssh.Marshal(struct{ Command string }{Command: command}), false
	}
}

func (c CodexConfig) inject(command string) (string, bool) {
	transformed, decision := c.transformCommand(command)
	return transformed, decision == codexCommandInject
}

func (c CodexConfig) transformCommand(command string) (string, codexCommandDecision) {
	outer, ok := parseSingleLiteralCommand(command)
	if !ok {
		if resemblesCodexAppServer(command) {
			return "", codexCommandReject
		}
		return "", codexCommandPass
	}
	if outer[0] == "codex" {
		words, decision := c.injectCodexArguments(outer)
		if decision == codexCommandInject {
			return shellquote.Join(words...), decision
		}
		return "", decision
	}
	if len(outer) != 5 || outer[0] != "sh" || outer[1] != "-c" || outer[2] != desktopLoginShellWrapperV1 || outer[3] != "sh" {
		if resemblesCodexAppServer(command) {
			return "", codexCommandReject
		}
		return "", codexCommandPass
	}

	payload, err := syntax.NewParser().Parse(strings.NewReader(outer[4]), "")
	if err != nil || payload == nil {
		if resemblesCodexAppServer(outer[4]) {
			return "", codexCommandReject
		}
		return "", codexCommandPass
	}
	if matchesDesktopPayloadV1(payload, desktopProxyPayloadV1) {
		return "", codexCommandPass
	}
	if !matchesDesktopPayloadV1(payload, desktopDaemonPayloadV1) {
		if strings.Contains(outer[4], "app-server") {
			return "", codexCommandReject
		}
		return "", codexCommandPass
	}
	type match struct {
		call  *syntax.CallExpr
		words []string
	}
	var matches []match
	suspicious := false
	syntax.Walk(payload, func(node syntax.Node) bool {
		call, ok := node.(*syntax.CallExpr)
		if !ok || len(call.Args) == 0 {
			return true
		}
		words, literal := literalWords(call.Args)
		if !literal {
			return true
		}
		candidate := words
		var prefix string
		if len(candidate) > 0 && (candidate[0] == "nohup" || candidate[0] == "exec") {
			prefix = candidate[0]
			candidate = candidate[1:]
		}
		injected, decision := c.injectCodexArguments(candidate)
		switch decision {
		case codexCommandInject:
			if prefix != "" {
				injected = append([]string{prefix}, injected...)
			}
			matches = append(matches, match{call: call, words: injected})
		case codexCommandReject:
			suspicious = true
		}
		return true
	})
	if suspicious || len(matches) > 1 {
		return "", codexCommandReject
	}
	if len(matches) == 0 {
		return "", codexCommandPass
	}
	args, ok := parseLiteralArgs(shellquote.Join(matches[0].words...))
	if !ok {
		return "", codexCommandReject
	}
	matches[0].call.Args = args
	var transformedPayload bytes.Buffer
	if err := syntax.NewPrinter().Print(&transformedPayload, payload); err != nil {
		return "", codexCommandReject
	}
	return shellquote.Join("sh", "-c", outer[2], "sh", transformedPayload.String()), codexCommandInject
}

func (c CodexConfig) injectCodexArguments(words []string) ([]string, codexCommandDecision) {
	if len(words) == 0 || words[0] != "codex" {
		if containsAppServer(words) {
			return nil, codexCommandReject
		}
		return nil, codexCommandPass
	}
	appServerIndex := -1
	for index := 1; index < len(words); {
		switch {
		case words[index] == "app-server":
			appServerIndex = index
			index = len(words)
		case words[index] == "-c" || words[index] == "--config":
			if index+1 >= len(words) {
				return nil, codexCommandReject
			}
			index += 2
		case strings.HasPrefix(words[index], "-c=") || strings.HasPrefix(words[index], "--config="):
			index++
		default:
			if containsAppServer(words[index:]) {
				return nil, codexCommandReject
			}
			return nil, codexCommandPass
		}
	}
	if appServerIndex == -1 {
		return nil, codexCommandPass
	}
	if appServerIndex+1 < len(words) && words[appServerIndex+1] == "proxy" {
		return nil, codexCommandPass
	}
	envName := c.APIKeyEnv
	if envName == "" {
		envName = "CODER_CODEX_API_KEY"
	}
	overrides := []string{
		"-c", "model=" + strconv.Quote(c.Model),
		"-c", `model_provider="sub2"`,
		"-c", `model_providers.sub2.name="Sub2"`,
		"-c", "model_providers.sub2.base_url=" + strconv.Quote(c.BaseURL),
		"-c", "model_providers.sub2.env_key=" + strconv.Quote(envName),
		"-c", `model_providers.sub2.wire_api="responses"`,
		"-c", "model_providers.sub2.supports_websockets=false",
	}
	result := make([]string, 0, len(words)+len(overrides))
	result = append(result, words[:appServerIndex]...)
	result = append(result, overrides...)
	result = append(result, words[appServerIndex:]...)
	return result, codexCommandInject
}

func parseSingleLiteralCommand(command string) ([]string, bool) {
	file, err := syntax.NewParser().Parse(strings.NewReader(command), "")
	if err != nil || file == nil || len(file.Stmts) != 1 {
		return nil, false
	}
	statement := file.Stmts[0]
	call, ok := statement.Cmd.(*syntax.CallExpr)
	if !ok || statement.Negated || statement.Background || statement.Coprocess || statement.Disown || len(statement.Redirs) != 0 || len(call.Assigns) != 0 {
		return nil, false
	}
	return literalWords(call.Args)
}

func parseLiteralArgs(command string) ([]*syntax.Word, bool) {
	file, err := syntax.NewParser().Parse(strings.NewReader(command), "")
	if err != nil || file == nil || len(file.Stmts) != 1 {
		return nil, false
	}
	call, ok := file.Stmts[0].Cmd.(*syntax.CallExpr)
	if !ok || len(call.Assigns) != 0 {
		return nil, false
	}
	return call.Args, true
}

func literalWords(words []*syntax.Word) ([]string, bool) {
	result := make([]string, 0, len(words))
	for _, word := range words {
		value, ok := literalWord(word)
		if !ok {
			return nil, false
		}
		result = append(result, value)
	}
	return result, true
}

func literalWord(word *syntax.Word) (string, bool) {
	for _, part := range word.Parts {
		switch part := part.(type) {
		case *syntax.Lit, *syntax.SglQuoted:
		case *syntax.DblQuoted:
			for _, inner := range part.Parts {
				if _, ok := inner.(*syntax.Lit); !ok {
					return "", false
				}
			}
		default:
			return "", false
		}
	}
	values, err := shellquote.Split(nodeText(word))
	if err != nil || len(values) != 1 {
		return "", false
	}
	return values[0], true
}

func containsAppServer(words []string) bool {
	for _, word := range words {
		if word == "app-server" {
			return true
		}
	}
	return false
}

func resemblesCodexAppServer(command string) bool {
	return containsShellToken(command, "codex") && containsShellToken(command, "app-server")
}

func containsShellToken(command, token string) bool {
	command = strings.ToLower(command)
	for offset := 0; offset < len(command); {
		index := strings.Index(command[offset:], token)
		if index == -1 {
			return false
		}
		index += offset
		end := index + len(token)
		if (index == 0 || isShellTokenBoundary(command[index-1])) &&
			(end == len(command) || isShellTokenBoundary(command[end])) {
			return true
		}
		offset = index + 1
	}
	return false
}

func isShellTokenBoundary(character byte) bool {
	return character == ' ' || character == '\t' || character == '\r' || character == '\n' ||
		strings.ContainsRune("'\"\\`;|&()<>/${}", rune(character))
}

func matchesDesktopPayloadV1(file *syntax.File, expectedPayload string) bool {
	expected, err := syntax.NewParser().Parse(strings.NewReader(expectedPayload), "")
	if err != nil || len(file.Stmts) < 2 || len(expected.Stmts) < 2 || !isDesktopHandshakeMarker(file.Stmts[0]) {
		return false
	}
	actualTail := *file
	actualTail.Stmts = actualTail.Stmts[1:]
	expectedTail := *expected
	expectedTail.Stmts = expectedTail.Stmts[1:]
	return nodeText(&actualTail) == nodeText(&expectedTail)
}

func isDesktopHandshakeMarker(statement *syntax.Stmt) bool {
	call, ok := statement.Cmd.(*syntax.CallExpr)
	if !ok || statement.Negated || statement.Background || statement.Coprocess || statement.Disown || len(statement.Redirs) != 0 || len(call.Assigns) != 0 {
		return false
	}
	words, ok := literalWords(call.Args)
	if !ok || len(words) != 3 || words[0] != "printf" || words[1] != "%b" || len(words[2]) != 32 {
		return false
	}
	for offset := 0; offset < len(words[2]); offset += 4 {
		if words[2][offset] != '\\' {
			return false
		}
		for digit := offset + 1; digit < offset+4; digit++ {
			if words[2][digit] < '0' || words[2][digit] > '7' {
				return false
			}
		}
	}
	return true
}

func nodeText(node syntax.Node) string {
	var output bytes.Buffer
	if err := syntax.NewPrinter().Print(&output, node); err != nil {
		return ""
	}
	return output.String()
}
