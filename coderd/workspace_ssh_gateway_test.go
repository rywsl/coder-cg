package coderd //nolint:testpackage // Exercises package-private parsing and script generation.

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"database/sql"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"
	"mvdan.cc/sh/v3/syntax"

	"cdr.dev/slog/v3/sloggers/slogtest"
	"github.com/coder/coder/v2/coderd/audit"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbauthz"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/coderd/database/dbgen"
	"github.com/coder/coder/v2/coderd/database/dbtestutil"
	"github.com/coder/coder/v2/coderd/database/dbtime"
	"github.com/coder/coder/v2/coderd/workspacessh"
	"github.com/coder/coder/v2/codersdk"
)

func TestParseWorkspaceSSHAlias(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		value  string
		suffix string
		want   workspaceSSHAlias
		err    bool
	}{
		{
			name:   "Valid",
			value:  "agent.workspace.owner.coder",
			suffix: "coder",
			want: workspaceSSHAlias{
				Agent: "agent", Workspace: "workspace", Owner: "owner",
			},
		},
		{
			name:   "CaseInsensitiveSuffix",
			value:  "agent.workspace.owner.CODER",
			suffix: "coder",
			want: workspaceSSHAlias{
				Agent: "agent", Workspace: "workspace", Owner: "owner",
			},
		},
		{name: "MissingDelimiter", value: "agent.workspace.ownercoder", suffix: "coder", err: true},
		{name: "WrongSuffix", value: "agent.workspace.owner.encoder", suffix: "coder", err: true},
		{name: "MissingAgent", value: ".workspace.owner.coder", suffix: "coder", err: true},
		{name: "MissingWorkspace", value: "agent..owner.coder", suffix: "coder", err: true},
		{name: "MissingOwner", value: "agent.workspace..coder", suffix: "coder", err: true},
		{name: "ExtraSegment", value: "agent.workspace.extra.owner.coder", suffix: "coder", err: true},
		{name: "EmptySuffix", value: "agent.workspace.owner.coder", suffix: "", err: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			got, err := parseWorkspaceSSHAlias(test.value, test.suffix)
			if test.err {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.Equal(t, test.want, got)
		})
	}
}

func TestWorkspaceSSHSetupScripts(t *testing.T) {
	t.Parallel()
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	signer, err := ssh.NewSignerFromKey(privateKey)
	require.NoError(t, err)
	api := &API{
		DeploymentID: "test-deployment",
		Options: &Options{
			SSHConfig: codersdk.SSHConfigResponse{
				WorkspaceSSHGateway: &codersdk.WorkspaceSSHGatewayInfo{
					Enabled: true, Host: "ssh.coder.example.test", Port: 2222,
					HostPublicKey: strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey()))),
					AliasSuffix:   "ssh.coder",
				},
			},
		},
	}
	target := workspaceSSHDesktopTarget{
		Alias:       "dev.workspace.owner.ssh.coder",
		ProjectPath: "/home/coder/项目 path's",
		DeepLink:    "codex://settings/connections/ssh/add?name=dev.workspace.owner.ssh.coder&projectPath=%2Fhome%2Fcoder%2F%E9%A1%B9%E7%9B%AE%20path%27s&enabled=true",
	}

	bashScript := api.workspaceSSHBashScript("https://coder.example.test/enrollment/id", "test-token", "zh-CN", target)
	_, err = syntax.NewParser().Parse(strings.NewReader(bashScript), "workspace-ssh-bootstrap.sh")
	require.NoError(t, err)
	require.Contains(t, bashScript, "Host dev.workspace.owner.ssh.coder\n")
	require.Contains(t, bashScript, "Match host ssh.coder.example.test user "+target.Alias+"\n")
	require.Contains(t, bashScript, "  User "+target.Alias+"\n")
	require.NotContains(t, bashScript, "User %n")
	require.Contains(t, bashScript, "ProxyCommand none")
	require.Contains(t, bashScript, "[ssh.coder.example.test]:2222")
	require.Contains(t, bashScript, "请打开 ChatGPT Desktop 的连接设置")
	require.NotContains(t, bashScript, "StrictHostKeyChecking=no")
	require.Less(t, strings.Index(bashScript, "cat >\"${tmp_file}\""), strings.Index(bashScript, "awk -v begin="))

	powerShellScript := api.workspaceSSHPowerShellScript("https://coder.example.test/enrollment/id", "test-token", "zh-CN", target)
	require.Contains(t, powerShellScript, "'Host dev.workspace.owner.ssh.coder'")
	require.Contains(t, powerShellScript, "Match host ssh.coder.example.test user "+target.Alias+"\n")
	require.Contains(t, powerShellScript, "'  User "+target.Alias+"'")
	require.NotContains(t, powerShellScript, "User %n")
	require.Contains(t, powerShellScript, "'  ProxyCommand none'")
	require.Contains(t, powerShellScript, "-N '\"\"'")
	require.Contains(t, powerShellScript, "Start-Process 'codex://")
	require.Contains(t, powerShellScript, "ssh-keygen 执行失败")
	require.Contains(t, powerShellScript, "无法打开 ChatGPT Desktop")
	require.Contains(t, powerShellScript, "@($block) + @($kept)")
	require.Equal(t, "'O''Brien'", powershellQuote("O'Brien"))
}

func TestWorkspaceSSHBashScriptIsIdempotentWithLegacySSHConfig(t *testing.T) {
	t.Parallel()
	sshPath, err := exec.LookPath("ssh")
	if err != nil {
		t.Skip("OpenSSH client is not installed")
	}
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	signer, err := ssh.NewSignerFromKey(privateKey)
	require.NoError(t, err)
	api := &API{
		DeploymentID: "coexistence-test",
		Options: &Options{SSHConfig: codersdk.SSHConfigResponse{
			WorkspaceSSHGateway: &codersdk.WorkspaceSSHGatewayInfo{
				Enabled:       true,
				Host:          "ssh.coder.example.test",
				Port:          2222,
				HostPublicKey: strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey()))),
				AliasSuffix:   "ssh.coder",
			},
		}},
	}
	target := workspaceSSHDesktopTarget{
		Alias:       "dev.workspace.owner.ssh.coder",
		ProjectPath: "/home/coder/项目 path",
		DeepLink:    "codex://settings/connections/ssh/add?name=dev.workspace.owner.ssh.coder",
	}
	script := api.workspaceSSHBashScript("https://coder.example.test/enrollment/id", "test-token", "zh-CN", target)

	home := t.TempDir()
	sshDirectory := filepath.Join(home, ".ssh")
	require.NoError(t, os.MkdirAll(sshDirectory, 0o700))
	configPath := filepath.Join(sshDirectory, "config")
	require.NoError(t, os.WriteFile(configPath, []byte("# BEGIN CODER CHATGPT DESKTOP coexistence-test\nHost *.ssh.coder\n  User %n\n# END CODER CHATGPT DESKTOP coexistence-test\nHost *.coder\n  ProxyCommand coder dial --stdio %h\n"), 0o600))
	fakeBin := t.TempDir()
	for _, command := range []string{"curl", "open", "xdg-open"} {
		require.NoError(t, os.WriteFile(filepath.Join(fakeBin, command), []byte("#!/bin/sh\nexit 0\n"), 0o700)) //nolint:gosec // Test helpers must be executable.
	}
	run := func() {
		command := exec.Command("bash", "-c", script)
		command.Env = append(os.Environ(), "HOME="+home, "PATH="+fakeBin+string(os.PathListSeparator)+os.Getenv("PATH"))
		output, err := command.CombinedOutput()
		require.NoError(t, err, string(output))
	}
	run()
	keyPath := filepath.Join(sshDirectory, "coder_chatgpt_ed25519_coexistence-test")
	firstKey, err := os.ReadFile(keyPath)
	require.NoError(t, err)
	run()
	secondKey, err := os.ReadFile(keyPath)
	require.NoError(t, err)
	require.Equal(t, firstKey, secondKey)
	config, err := os.ReadFile(configPath)
	require.NoError(t, err)
	require.Equal(t, 1, strings.Count(string(config), "# BEGIN CODER CHATGPT DESKTOP coexistence-test"))
	require.Contains(t, string(config), "ProxyCommand none")
	require.Contains(t, string(config), "ProxyCommand coder dial --stdio %h")

	command := exec.Command(sshPath, "-G", "-F", configPath, target.Alias)
	command.Env = append(os.Environ(), "HOME="+home)
	resolved, err := command.CombinedOutput()
	require.NoError(t, err, string(resolved))
	configuration := strings.ToLower(string(resolved))
	require.Contains(t, configuration, "hostname ssh.coder.example.test")
	require.Contains(t, configuration, "port 2222")
	require.Contains(t, configuration, "user "+target.Alias)
	require.Contains(t, configuration, "identityfile ~/.ssh/coder_chatgpt_ed25519_coexistence-test")
	require.Contains(t, configuration, "userknownhostsfile ")
	require.Contains(t, configuration, "/.ssh/coder_chatgpt_known_hosts_coexistence-test")
	require.NotContains(t, configuration, "proxycommand coder dial")

	otherTarget := target
	otherTarget.Alias = "main.other.owner.ssh.coder"
	script = api.workspaceSSHBashScript("https://coder.example.test/enrollment/id", "test-token", "zh-CN", otherTarget)
	run()
	run()
	config, err = os.ReadFile(configPath)
	require.NoError(t, err)
	require.Equal(t, 2, strings.Count(string(config), "# BEGIN CODER CHATGPT DESKTOP coexistence-test"))
	require.NotContains(t, string(config), "User %n")
	for _, alias := range []string{target.Alias, otherTarget.Alias} {
		resolved, err := exec.Command(sshPath, "-G", "-F", configPath, alias).CombinedOutput()
		require.NoError(t, err, string(resolved))
		require.Contains(t, string(resolved), "user "+alias+"\n")
		require.Contains(t, string(resolved), "hostname ssh.coder.example.test\n")
		require.NotContains(t, string(resolved), "proxycommand coder dial")
	}
}

func TestWorkspaceSSHAgentUnavailableReason(t *testing.T) {
	t.Parallel()
	now := dbtime.Now()
	connected := database.WorkspaceAgent{
		OperatingSystem:          "linux",
		LifecycleState:           database.WorkspaceAgentLifecycleStateReady,
		FirstConnectedAt:         sql.NullTime{Time: now, Valid: true},
		LastConnectedAt:          sql.NullTime{Time: now, Valid: true},
		ConnectionTimeoutSeconds: 60,
	}

	tests := []struct {
		name   string
		mutate func(*database.WorkspaceAgent)
		want   string
	}{
		{name: "Connected", mutate: func(*database.WorkspaceAgent) {}, want: ""},
		{name: "NonLinux", mutate: func(agent *database.WorkspaceAgent) {
			agent.OperatingSystem = "windows"
		}, want: "agent_not_linux"},
		{name: "Stopped", mutate: func(agent *database.WorkspaceAgent) {
			agent.LifecycleState = database.WorkspaceAgentLifecycleStateOff
		}, want: "workspace_stopped"},
		{name: "NotReady", mutate: func(agent *database.WorkspaceAgent) {
			agent.LifecycleState = database.WorkspaceAgentLifecycleStateStarting
		}, want: "agent_not_ready"},
		{name: "Disconnected", mutate: func(agent *database.WorkspaceAgent) {
			agent.DisconnectedAt = sql.NullTime{Time: now, Valid: true}
		}, want: "agent_disconnected"},
		{name: "Inactive", mutate: func(agent *database.WorkspaceAgent) {
			agent.LastConnectedAt = sql.NullTime{Time: now.Add(-2 * time.Hour), Valid: true}
		}, want: "agent_disconnected"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			agent := connected
			test.mutate(&agent)
			require.Equal(t, test.want, workspaceSSHAgentUnavailableReason(agent, time.Hour))
		})
	}
}

func TestWorkspaceSSHGatewayTargetUnavailableReason(t *testing.T) {
	t.Parallel()

	now := dbtime.Now()
	target := database.GetWorkspaceSSHGatewayTargetRow{
		WorkspaceAgent: database.WorkspaceAgent{
			OperatingSystem:          "linux",
			LifecycleState:           database.WorkspaceAgentLifecycleStateReady,
			FirstConnectedAt:         sql.NullTime{Time: now, Valid: true},
			LastConnectedAt:          sql.NullTime{Time: now, Valid: true},
			ConnectionTimeoutSeconds: 60,
		},
		LatestBuildNumber:     2,
		LatestBuildTransition: database.WorkspaceTransitionStart,
		AgentBuildNumber:      2,
	}
	require.Empty(t, workspaceSSHGatewayTargetUnavailableReason(target, time.Hour))

	stopped := target
	stopped.LatestBuildTransition = database.WorkspaceTransitionStop
	stopped.AgentBuildNumber = 1
	require.Equal(t, "workspace_stopped", workspaceSSHGatewayTargetUnavailableReason(stopped, time.Hour))

	stale := target
	stale.AgentBuildNumber = 1
	require.Equal(t, "agent_not_ready", workspaceSSHGatewayTargetUnavailableReason(stale, time.Hour))
}

func TestRecordWorkspaceSSHConnectionCommunityAudit(t *testing.T) {
	t.Parallel()
	db, _ := dbtestutil.NewDB(t)
	organization := dbgen.Organization(t, db, database.Organization{})
	user := dbgen.User(t, db, database.User{})
	build := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{
		OrganizationID: organization.ID,
		OwnerID:        user.ID,
	}).WithAgent().Do()
	logger := slogtest.Make(t, nil)
	api := &API{Options: &Options{Database: db, Logger: logger}}
	nop := audit.NewNop()
	api.Auditor.Store(&nop)
	connectionID := uuid.New()
	api.recordWorkspaceSSHConnection(context.Background(), workspacessh.ConnectionEvent{
		ConnectionID: connectionID,
		Target: workspacessh.Target{
			UserID:            user.ID,
			Username:          user.Username,
			OrganizationID:    organization.ID,
			OrganizationName:  organization.Name,
			WorkspaceOwnerID:  user.ID,
			WorkspaceID:       build.Workspace.ID,
			WorkspaceName:     build.Workspace.Name,
			AgentID:           build.Agents[0].ID,
			AgentName:         build.Agents[0].Name,
			ExpandedDirectory: build.Agents[0].ExpandedDirectory,
		},
		RemoteAddr:  &net.TCPAddr{IP: net.ParseIP("192.0.2.10"), Port: 54321},
		ConnectedAt: dbtime.Now(),
		Result:      "connected",
	})

	logs, err := db.GetAuditLogsOffset(dbauthz.AsSystemRestricted(context.Background()), database.GetAuditLogsOffsetParams{
		ResourceType:   string(database.ResourceTypeWorkspace),
		ResourceID:     build.Workspace.ID,
		OrganizationID: organization.ID,
		RequestID:      connectionID,
		LimitOpt:       1,
	})
	require.NoError(t, err)
	require.Len(t, logs, 1)
	require.Equal(t, database.AuditActionConnect, logs[0].AuditLog.Action)
	require.Equal(t, user.ID, logs[0].AuditLog.UserID)
}
