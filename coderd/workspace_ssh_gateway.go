package coderd

import (
	"context"
	"database/sql"
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3"
	"github.com/coder/coder/v2/coderd/audit"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbauthz"
	"github.com/coder/coder/v2/coderd/database/dbtime"
	"github.com/coder/coder/v2/coderd/httpmw"
	"github.com/coder/coder/v2/coderd/rbac"
	"github.com/coder/coder/v2/coderd/rbac/policy"
	"github.com/coder/coder/v2/coderd/workspacessh"
	"github.com/coder/coder/v2/codersdk"
)

func (api *API) startWorkspaceSSHGateway() error {
	values := api.DeploymentValues.WorkspaceSSHGateway
	aliasSuffix := "ssh." + api.DeploymentValues.WorkspaceHostnameSuffix.Value()
	api.SSHConfig.WorkspaceSSHGateway = &codersdk.WorkspaceSSHGatewayInfo{
		Enabled:     values.Enabled.Value(),
		AliasSuffix: aliasSuffix,
	}
	if !values.Enabled.Value() {
		return nil
	}
	if api.AccessURL == nil || api.AccessURL.Scheme != "https" {
		return xerrors.New("workspace SSH gateway requires an HTTPS access URL")
	}
	signer, err := workspacessh.LoadHostSigner(values.HostKeyFile.Value())
	if err != nil {
		return err
	}
	publicKey := strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey())))
	api.SSHConfig.WorkspaceSSHGateway = &codersdk.WorkspaceSSHGatewayInfo{
		Enabled:                 true,
		Host:                    values.AdvertiseHost.Value(),
		Port:                    values.AdvertisePort.Value(),
		HostPublicKey:           publicKey,
		HostKeyFingerprint:      ssh.FingerprintSHA256(signer.PublicKey()),
		AliasSuffix:             aliasSuffix,
		ChatGPTDesktopAvailable: true,
	}
	if err := api.SSHConfig.Validate(); err != nil {
		return xerrors.Errorf("validate advertised workspace SSH gateway configuration: %w", err)
	}
	gateway, err := workspacessh.New(workspacessh.Config{
		ListenAddress: values.ListenAddress.Value(),
		HostSigner:    signer,
		Logger:        api.Logger.Named("workspace-ssh-gateway"),
		Registerer:    api.PrometheusRegistry,
		Codex: workspacessh.CodexConfig{
			Model:     values.CodexModel.Value(),
			BaseURL:   values.CodexBaseURL.Value(),
			APIKey:    values.CodexAPIKey.Value(),
			APIKeyEnv: "CODER_CODEX_API_KEY",
		},
		Limits: workspacessh.Limits{
			MaxConnections:             int(values.MaxConnections.Value()),
			MaxPendingConnections:      int(values.MaxPendingConnections.Value()),
			MaxPendingConnectionsPerIP: int(values.MaxPendingConnectionsPerIP.Value()),
			MaxConnectionsPerUser:      int(values.MaxConnectionsPerUser.Value()),
			MaxChannelsPerConnection:   int(values.MaxChannelsPerConnection.Value()),
			AuthAttemptsPerMinute:      int(values.AuthAttemptsPerMinute.Value()),
			AuthAttemptsBurst:          int(values.AuthAttemptsBurst.Value()),
		},
		Authenticate: api.authenticateWorkspaceSSH,
		Verified:     api.verifiedWorkspaceSSHKey,
		DialAgent:    api.dialWorkspaceSSHAgent,
		Record:       api.recordWorkspaceSSHConnection,
	})
	if err != nil {
		return err
	}
	api.workspaceSSHGateway = gateway
	api.Logger.Info(context.Background(), "workspace SSH gateway listening",
		slog.F("listen_address", gateway.Addr().String()),
		slog.F("advertise_host", values.AdvertiseHost.Value()),
		slog.F("advertise_port", values.AdvertisePort.Value()),
	)
	return nil
}

func (api *API) authenticateWorkspaceSSH(ctx context.Context, metadata ssh.ConnMetadata, publicKey ssh.PublicKey) (workspacessh.Target, error) {
	if api.workspaceSSHBrowserOnly() {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	alias, err := parseWorkspaceSSHAlias(metadata.User(), api.SSHConfig.WorkspaceSSHGateway.AliasSuffix)
	if err != nil {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	// Authentication has no user context until the registered key is resolved.
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	target, err := api.Database.GetWorkspaceSSHGatewayTarget(systemCtx, database.GetWorkspaceSSHGatewayTargetParams{
		OwnerUsername: alias.Owner,
		WorkspaceName: alias.Workspace,
		AgentName:     alias.Agent,
	})
	if xerrors.Is(err, sql.ErrNoRows) {
		return workspacessh.Target{}, &workspacessh.TargetUnavailableError{Reason: "not_found"}
	}
	if err != nil {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	if reason := workspaceSSHGatewayTargetUnavailableReason(target, api.AgentInactiveDisconnectTimeout); reason != "" {
		return workspacessh.Target{}, &workspacessh.TargetUnavailableError{Reason: reason}
	}
	key, err := api.Database.GetWorkspaceSSHKeyByOrganizationAndFingerprint(systemCtx, database.GetWorkspaceSSHKeyByOrganizationAndFingerprintParams{
		OrganizationID: target.WorkspaceTable.OrganizationID,
		Fingerprint:    ssh.FingerprintSHA256(publicKey),
	})
	if err != nil {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	subject, status, err := httpmw.UserRBACSubject(systemCtx, api.Database, key.UserID, rbac.ScopeAll)
	if err != nil || status != database.UserStatusActive {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	if err := api.Authorizer.Authorize(ctx, subject, policy.ActionSSH, target.WorkspaceTable.RBACObject()); err != nil {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	organization, err := api.Database.GetOrganizationByID(systemCtx, target.WorkspaceTable.OrganizationID)
	if err != nil {
		return workspacessh.Target{}, xerrors.New("public key authentication failed")
	}
	return workspacessh.Target{
		WorkspaceSSHKeyID: key.ID,
		UserID:            key.UserID,
		Username:          subject.FriendlyName,
		OrganizationID:    target.WorkspaceTable.OrganizationID,
		OrganizationName:  organization.Name,
		WorkspaceOwnerID:  target.WorkspaceTable.OwnerID,
		WorkspaceID:       target.WorkspaceTable.ID,
		WorkspaceName:     target.WorkspaceTable.Name,
		AgentID:           target.WorkspaceAgent.ID,
		AgentName:         target.WorkspaceAgent.Name,
		ExpandedDirectory: target.WorkspaceAgent.ExpandedDirectory,
	}, nil
}

func (api *API) verifiedWorkspaceSSHKey(ctx context.Context, target workspacessh.Target) error {
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	if err := api.Database.UpdateWorkspaceSSHKeyLastUsedAt(systemCtx, database.UpdateWorkspaceSSHKeyLastUsedAtParams{
		ID:         target.WorkspaceSSHKeyID,
		LastUsedAt: sql.NullTime{Time: dbtime.Now(), Valid: true},
	}); err != nil {
		return xerrors.Errorf("update workspace SSH key last used time: %w", err)
	}
	return nil
}

func (api *API) workspaceSSHBrowserOnly() bool {
	override := api.WorkspaceClientCoordinateOverride.Load()
	return override != nil && *override != nil
}

func (api *API) dialWorkspaceSSHAgent(ctx context.Context, target workspacessh.Target) (net.Conn, func(), error) {
	agentConn, release, err := api.agentProvider.AgentConn(ctx, target.AgentID)
	if err != nil {
		return nil, func() {}, err
	}
	conn, err := agentConn.SSH(ctx)
	if err != nil {
		release()
		return nil, func() {}, err
	}
	return conn, release, nil
}

func (api *API) recordWorkspaceSSHConnection(ctx context.Context, event workspacessh.ConnectionEvent) {
	ip := ""
	if event.RemoteAddr != nil {
		ip, _, _ = net.SplitHostPort(event.RemoteAddr.String())
	}
	if event.Result == "connected" {
		workspace := database.WorkspaceTable{
			ID:             event.Target.WorkspaceID,
			OwnerID:        event.Target.WorkspaceOwnerID,
			OrganizationID: event.Target.OrganizationID,
			Name:           event.Target.WorkspaceName,
		}
		additionalFields, err := json.Marshal(map[string]string{
			"agent_id":      event.Target.AgentID.String(),
			"agent_name":    event.Target.AgentName,
			"connection_id": event.ConnectionID.String(),
			"result":        event.Result,
		})
		if err != nil {
			api.Logger.Error(ctx, "marshal workspace SSH gateway audit fields", slog.Error(err))
		} else {
			auditor := api.workspaceSSHAuditor()
			audit.BackgroundAudit(ctx, &audit.BackgroundAuditParams[database.WorkspaceTable]{
				Audit:            auditor,
				Log:              api.Logger,
				UserID:           event.Target.UserID,
				RequestID:        event.ConnectionID,
				Time:             event.ConnectedAt,
				Status:           http.StatusOK,
				Action:           database.AuditActionConnect,
				OrganizationID:   event.Target.OrganizationID,
				IP:               ip,
				AdditionalFields: additionalFields,
				New:              workspace,
				Old:              workspace,
			})
		}
	}

	logger := api.ConnectionLogger.Load()
	if logger == nil {
		return
	}
	status := database.ConnectionStatusConnected
	eventTime := event.ConnectedAt
	disconnectReason := sql.NullString{}
	if !event.DisconnectedAt.IsZero() {
		status = database.ConnectionStatusDisconnected
		eventTime = event.DisconnectedAt
		disconnectReason = sql.NullString{String: event.Result, Valid: event.Result != "completed"}
	}
	err := (*logger).Upsert(ctx, database.UpsertConnectionLogParams{
		ID:               uuid.New(),
		Time:             eventTime,
		OrganizationID:   event.Target.OrganizationID,
		WorkspaceOwnerID: event.Target.WorkspaceOwnerID,
		WorkspaceID:      event.Target.WorkspaceID,
		WorkspaceName:    event.Target.WorkspaceName,
		AgentName:        event.Target.AgentName,
		Type:             database.ConnectionTypeSsh,
		IP:               database.ParseIP(ip),
		Code:             sql.NullInt32{},
		UserAgent:        sql.NullString{},
		UserID:           uuid.NullUUID{UUID: event.Target.UserID, Valid: true},
		SlugOrPort:       sql.NullString{},
		ConnectionID:     uuid.NullUUID{UUID: event.ConnectionID, Valid: true},
		DisconnectReason: disconnectReason,
		ConnectionStatus: status,
	})
	if err != nil {
		api.Logger.Error(ctx, "record workspace SSH gateway connection",
			slog.F("connection_id", event.ConnectionID),
			slog.F("workspace_id", event.Target.WorkspaceID),
			slog.F("agent_id", event.Target.AgentID),
			slog.F("result", event.Result),
			slog.Error(err),
		)
	}
}

func (api *API) workspaceSSHAuditor() audit.Auditor {
	current := api.Auditor.Load()
	if current == nil {
		nop := audit.NewNop()
		current = &nop
	}
	return audit.WorkspaceSSHCommunityAuditor(*current, func(ctx context.Context, log database.AuditLog) error {
		auditCtx := dbauthz.AsWorkspaceSSHAuditor(ctx) //nolint:gocritic // This role can only insert Workspace SSH audit rows.
		_, err := api.Database.InsertAuditLog(auditCtx, database.InsertAuditLogParams(log))
		return err
	})
}

type workspaceSSHAlias struct {
	Agent     string
	Workspace string
	Owner     string
}

func parseWorkspaceSSHAlias(value, suffix string) (workspaceSSHAlias, error) {
	delimitedSuffix := "." + suffix
	if suffix == "" || len(value) <= len(delimitedSuffix) || !strings.EqualFold(value[len(value)-len(delimitedSuffix):], delimitedSuffix) {
		return workspaceSSHAlias{}, xerrors.New("invalid workspace SSH alias suffix")
	}
	parts := strings.Split(value[:len(value)-len(delimitedSuffix)], ".")
	if len(parts) != 3 || parts[0] == "" || parts[1] == "" || parts[2] == "" {
		return workspaceSSHAlias{}, xerrors.New("workspace SSH alias must contain agent, workspace, and owner")
	}
	return workspaceSSHAlias{Agent: parts[0], Workspace: parts[1], Owner: parts[2]}, nil
}

func workspaceSSHAgentUnavailableReason(agent database.WorkspaceAgent, inactiveTimeout time.Duration) string {
	if !strings.EqualFold(agent.OperatingSystem, "linux") {
		return "agent_not_linux"
	}
	if agent.LifecycleState == database.WorkspaceAgentLifecycleStateOff {
		return "workspace_stopped"
	}
	if agent.LifecycleState != database.WorkspaceAgentLifecycleStateReady {
		return "agent_not_ready"
	}
	if agent.Status(dbtime.Now(), inactiveTimeout).Status != database.WorkspaceAgentStatusConnected {
		return "agent_disconnected"
	}
	return ""
}

func workspaceSSHGatewayTargetUnavailableReason(target database.GetWorkspaceSSHGatewayTargetRow, inactiveTimeout time.Duration) string {
	if target.LatestBuildTransition == database.WorkspaceTransitionStop {
		return "workspace_stopped"
	}
	if target.AgentBuildNumber != target.LatestBuildNumber {
		return "agent_not_ready"
	}
	return workspaceSSHAgentUnavailableReason(target.WorkspaceAgent, inactiveTimeout)
}
