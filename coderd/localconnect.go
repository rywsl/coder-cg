package coderd

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/coderd/audit"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbauthz"
	"github.com/coder/coder/v2/coderd/database/dbtime"
	"github.com/coder/coder/v2/coderd/httpapi"
	"github.com/coder/coder/v2/coderd/httpmw"
	"github.com/coder/coder/v2/coderd/rbac"
	"github.com/coder/coder/v2/coderd/rbac/policy"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/codersdk/workspacesdk"
)

// @Summary Create local connector enrollment
// @ID create-local-connector-enrollment
// @Security CoderSessionToken
// @Tags SSH
// @Produce json
// @Param workspaceagent path string true "Agent ID" format(uuid)
// @Success 201 {object} codersdk.LocalConnectorEnrollment
// @Router /api/v2/workspaceagents/{workspaceagent}/local-connect-bootstrap [post]
func (api *API) localConnectorBootstrap(rw http.ResponseWriter, r *http.Request) {
	api.createWorkspaceSSHEnrollment(rw, r, "connector")
}

// @Summary Register local connector
// @ID register-local-connector
// @Security Authorization
// @Tags SSH
// @Accept json
// @Produce json
// @Param enrollment path string true "Enrollment ID" format(uuid)
// @Param request body codersdk.LocalConnectorRegister true "Device registration"
// @Success 201 {object} codersdk.LocalConnectorRegistration
// @Router /api/v2/local-connect/enrollments/{enrollment} [post]
func (api *API) registerLocalConnector(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !api.workspaceSSHGatewayEnabled(rw, r) {
		return
	}
	if api.workspaceSSHBrowserOnly() {
		httpapi.ResourceNotFound(rw)
		return
	}
	gateway := api.workspaceSSHGatewayInfo()
	if gateway == nil || !gateway.Enabled {
		httpapi.ResourceNotFound(rw)
		return
	}
	r.Body = http.MaxBytesReader(rw, r.Body, 16<<10)
	var req codersdk.LocalConnectorRegister
	if !httpapi.Read(ctx, rw, r, &req) {
		return
	}
	enrollmentID, hash, _, ok := workspaceSSHEnrollmentCredentials(r)
	secret, err := base64.RawURLEncoding.DecodeString(req.Token)
	if !ok || err != nil || len(secret) != 32 {
		httpapi.ResourceNotFound(rw)
		return
	}
	tokenHash := sha256.Sum256(secret)
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // Single-use enrollment supplies the identity.
	var device database.WorkspaceLocalConnector
	var key database.WorkspaceSshKey
	err = api.Database.InTx(func(tx database.Store) error {
		enrollment, err := tx.GetWorkspaceSSHKeyEnrollmentForUpdate(systemCtx, database.GetWorkspaceSSHKeyEnrollmentForUpdateParams{ID: enrollmentID, TokenHash: hash, Now: dbtime.Now()})
		if err != nil {
			return err
		}
		subject, status, err := httpmw.UserRBACSubject(systemCtx, tx, enrollment.UserID, rbac.ScopeAll)
		if err != nil || status != database.UserStatusActive {
			return sql.ErrNoRows
		}
		target, err := tx.GetWorkspaceSSHBootstrapTargetByAgentID(systemCtx, enrollment.WorkspaceAgentID)
		if err != nil || target.WorkspaceTable.OrganizationID != enrollment.OrganizationID {
			return sql.ErrNoRows
		}
		if err := api.Authorizer.Authorize(ctx, subject, policy.ActionSSH, target.WorkspaceTable.RBACObject()); err != nil {
			return sql.ErrNoRows
		}
		if workspaceSSHAgentUnavailableReason(target.WorkspaceAgent, api.AgentInactiveDisconnectTimeout) != "" {
			return sql.ErrNoRows
		}
		key, _, err = insertWorkspaceSSHKey(systemCtx, tx, enrollment.UserID, enrollment.OrganizationID, codersdk.CreateWorkspaceSSHKeyRequest{DeviceName: req.DeviceName, PublicKey: req.PublicKey})
		if err != nil {
			return err
		}
		device, err = tx.InsertWorkspaceLocalConnector(systemCtx, database.InsertWorkspaceLocalConnectorParams{ID: uuid.New(), OrganizationID: enrollment.OrganizationID, UserID: enrollment.UserID, WorkspaceSshKeyID: key.ID, TokenHash: tokenHash[:], Name: req.DeviceName})
		if err != nil {
			return err
		}
		_, err = tx.CompleteWorkspaceSSHKeyEnrollment(systemCtx, database.CompleteWorkspaceSSHKeyEnrollmentParams{ID: enrollmentID, ConsumedAt: sql.NullTime{Time: dbtime.Now(), Valid: true}, WorkspaceSshKeyID: uuid.NullUUID{UUID: key.ID, Valid: true}})
		return err
	}, nil)
	if xerrors.Is(err, sql.ErrNoRows) {
		httpapi.ResourceNotFound(rw)
		return
	}
	if err != nil {
		writeWorkspaceSSHKeyError(ctx, rw, err)
		return
	}
	aReq, commit := audit.InitRequest[database.WorkspaceSshKey](rw, &audit.RequestParams{Audit: api.workspaceSSHAuditor(), Log: api.Logger, Request: r, Action: database.AuditActionCreate, OrganizationID: device.OrganizationID})
	aReq.UserID, aReq.New = device.UserID, key
	defer commit()
	httpapi.Write(ctx, rw, http.StatusCreated, codersdk.LocalConnectorRegistration{Device: localConnectorSDK(device), Gateway: *gateway})
}

func localConnectorSDK(row database.WorkspaceLocalConnector) codersdk.LocalConnector {
	device := codersdk.LocalConnector{ID: row.ID, OrganizationID: row.OrganizationID, WorkspaceSSHKeyID: row.WorkspaceSshKeyID, Name: row.Name, Revision: row.Revision, Online: row.LastSeenAt.Valid && dbtime.Now().Sub(row.LastSeenAt.Time) < 30*time.Second, Desired: []codersdk.LocalConnectorWorkspace{}, Reported: []codersdk.LocalConnectorPort{}}
	_ = json.Unmarshal(row.Desired, &device.Desired)
	_ = json.Unmarshal(row.Reported, &device.Reported)
	if device.Desired == nil {
		device.Desired = []codersdk.LocalConnectorWorkspace{}
	}
	if device.Reported == nil {
		device.Reported = []codersdk.LocalConnectorPort{}
	}
	return device
}

// @Summary List current user's local connectors
// @ID list-current-users-local-connectors
// @Security CoderSessionToken
// @Tags SSH
// @Produce json
// @Param organization path string true "Organization" format(uuid)
// @Success 200 {array} codersdk.LocalConnector
// @Router /api/v2/organizations/{organization}/local-connectors [get]
func (api *API) localConnectors(rw http.ResponseWriter, r *http.Request) {
	org := httpmw.OrganizationParam(r)
	if !api.Authorize(r, policy.ActionRead, org.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	ctx := dbauthz.AsSystemRestricted(r.Context()) //nolint:gocritic // The query is restricted to the authenticated owner and organization.
	rows, err := api.Database.GetWorkspaceLocalConnectorsByOwner(ctx, database.GetWorkspaceLocalConnectorsByOwnerParams{UserID: httpmw.APIKey(r).UserID, OrganizationID: org.ID})
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	result := make([]codersdk.LocalConnector, 0, len(rows))
	for _, row := range rows {
		result = append(result, localConnectorSDK(row))
	}
	httpapi.Write(r.Context(), rw, http.StatusOK, result)
}

// @Summary Update local connector forwarding
// @ID update-local-connector-forwarding
// @Security CoderSessionToken
// @Tags SSH
// @Accept json
// @Produce json
// @Param organization path string true "Organization" format(uuid)
// @Param connector path string true "Connector" format(uuid)
// @Param request body codersdk.LocalConnectorUpdate true "Desired forwarding"
// @Success 200 {object} codersdk.LocalConnector
// @Router /api/v2/organizations/{organization}/local-connectors/{connector} [put]
func (api *API) updateLocalConnector(rw http.ResponseWriter, r *http.Request) {
	id, ok := httpmw.ParseUUIDParam(rw, r, "connector")
	if !ok {
		return
	}
	ctx := dbauthz.AsSystemRestricted(r.Context()) //nolint:gocritic // Ownership is checked before accessing or changing the device.
	row, err := api.Database.GetWorkspaceLocalConnectorByID(ctx, id)
	org := httpmw.OrganizationParam(r)
	if err != nil || row.UserID != httpmw.APIKey(r).UserID || row.OrganizationID != org.ID || !api.Authorize(r, policy.ActionRead, org.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	r.Body = http.MaxBytesReader(rw, r.Body, 32<<10)
	var req codersdk.LocalConnectorUpdate
	if !httpapi.Read(r.Context(), rw, r, &req) {
		return
	}
	if len(req.Desired) > 16 || req.Desired == nil {
		httpapi.Write(r.Context(), rw, http.StatusBadRequest, codersdk.Response{Message: "最多连接 16 个工作区。"})
		return
	}
	seen := make(map[string]bool, len(req.Desired))
	for _, desired := range req.Desired {
		ws, err := api.Database.GetWorkspaceByID(ctx, desired.WorkspaceID)
		if err != nil || ws.Deleted || ws.OrganizationID != org.ID || !api.Authorize(r, policy.ActionSSH, ws.RBACObject()) {
			httpapi.ResourceNotFound(rw)
			return
		}
		key := desired.WorkspaceID.String() + "/" + desired.AgentName
		if api.workspaceSSHBrowserOnly() || len(desired.Ports) > 64 || slices.Contains(desired.Ports, 0) || strings.TrimSpace(desired.AgentName) == "" || seen[key] {
			httpapi.Write(r.Context(), rw, http.StatusBadRequest, codersdk.Response{Message: "端口配置无效或部署禁止非浏览器连接。"})
			return
		}
		seen[key] = true
	}
	encoded, err := json.Marshal(req.Desired)
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	row, err = api.Database.UpdateWorkspaceLocalConnectorDesired(ctx, database.UpdateWorkspaceLocalConnectorDesiredParams{ID: id, Revision: req.Revision, Desired: encoded})
	if xerrors.Is(err, sql.ErrNoRows) {
		httpapi.Write(r.Context(), rw, http.StatusConflict, codersdk.Response{Message: "设备配置已变化，请刷新后重试。"})
		return
	}
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	httpapi.Write(r.Context(), rw, http.StatusOK, localConnectorSDK(row))
}

// @Summary Synchronize local connector lease and status
// @ID synchronize-local-connector-lease-and-status
// @Security Authorization
// @Tags SSH
// @Accept json
// @Produce json
// @Param connector path string true "Connector" format(uuid)
// @Param request body codersdk.LocalConnectorSyncRequest true "Reported status"
// @Success 200 {object} codersdk.LocalConnectorSync
// @Router /api/v2/local-connect/devices/{connector}/sync [post]
func (api *API) syncLocalConnector(rw http.ResponseWriter, r *http.Request) {
	id, ok := httpmw.ParseUUIDParam(rw, r, "connector")
	if !ok {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // This endpoint accepts only the device's narrow credential.
	row, err := api.Database.GetWorkspaceLocalConnectorByID(systemCtx, id)
	fields := strings.Fields(r.Header.Get("Authorization"))
	if err != nil || len(fields) != 2 || !strings.EqualFold(fields[0], "Bearer") {
		httpapi.ResourceNotFound(rw)
		return
	}
	secret, err := base64.RawURLEncoding.DecodeString(fields[1])
	hash := sha256.Sum256(secret)
	if err != nil || len(secret) != 32 || subtle.ConstantTimeCompare(hash[:], row.TokenHash) != 1 {
		httpapi.ResourceNotFound(rw)
		return
	}
	subject, status, err := httpmw.UserRBACSubject(systemCtx, api.Database, row.UserID, rbac.ScopeAll)
	if err != nil || status != database.UserStatusActive || api.workspaceSSHBrowserOnly() {
		httpapi.ResourceNotFound(rw)
		return
	}
	org, err := api.Database.GetOrganizationByID(systemCtx, row.OrganizationID)
	if err != nil || api.Authorizer.Authorize(ctx, subject, policy.ActionRead, org.RBACObject()) != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	r.Body = http.MaxBytesReader(rw, r.Body, 64<<10)
	var req codersdk.LocalConnectorSyncRequest
	if !httpapi.Read(ctx, rw, r, &req) {
		return
	}
	if len(req.Reported) > 256 {
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "端口数量超过限制。"})
		return
	}
	for _, port := range req.Reported {
		if port.RemotePort == 0 || !slices.Contains([]string{"http", "https", "tcp"}, port.Protocol) || !slices.Contains([]string{"", "listen_failed", "capacity"}, port.ErrorCode) {
			httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "端口状态无效。"})
			return
		}
	}
	reported, err := json.Marshal(req.Reported)
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	row, err = api.Database.UpdateWorkspaceLocalConnectorReported(systemCtx, database.UpdateWorkspaceLocalConnectorReportedParams{ID: id, Reported: reported, ReportedRevision: req.Revision, LastSeenAt: sql.NullTime{Time: dbtime.Now(), Valid: true}})
	if err != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	response := codersdk.LocalConnectorSync{Revision: row.Revision, Targets: []codersdk.LocalConnectorTarget{}, LeaseSeconds: 30}
	if gateway := api.workspaceSSHGatewayInfo(); gateway != nil {
		response.Gateway = *gateway
	}
	if response.Gateway.Enabled {
		for _, desired := range localConnectorSDK(row).Desired {
			ws, err := api.Database.GetWorkspaceByID(systemCtx, desired.WorkspaceID)
			if err != nil || ws.OrganizationID != row.OrganizationID || api.Authorizer.Authorize(ctx, subject, policy.ActionSSH, ws.RBACObject()) != nil {
				continue
			}
			owner, err := api.Database.GetUserByID(systemCtx, ws.OwnerID)
			if err != nil {
				continue
			}
			target, err := api.Database.GetWorkspaceSSHGatewayTarget(systemCtx, database.GetWorkspaceSSHGatewayTargetParams{OwnerUsername: owner.Username, WorkspaceName: ws.Name, AgentName: desired.AgentName})
			if err != nil || target.WorkspaceTable.ID != ws.ID || workspaceSSHGatewayTargetUnavailableReason(target, api.AgentInactiveDisconnectTimeout) != "" {
				continue
			}
			resolved := codersdk.LocalConnectorTarget{LocalConnectorWorkspace: desired, AgentID: target.WorkspaceAgent.ID, Alias: desired.AgentName + "." + ws.Name + "." + owner.Username + "." + response.Gateway.AliasSuffix, Candidates: []uint16{}}
			if desired.Automatic {
				resolved.Candidates = api.localConnectorCandidates(ctx, target.WorkspaceAgent.ID)
			}
			response.Targets = append(response.Targets, resolved)
		}
	}
	rw.Header().Set("Cache-Control", "no-store")
	httpapi.Write(ctx, rw, http.StatusOK, response)
}

func (api *API) localConnectorCandidates(ctx context.Context, agentID uuid.UUID) []uint16 {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	conn, release, err := api.agentProvider.AgentConn(ctx, agentID)
	if err != nil {
		return nil
	}
	defer release()
	ports, err := conn.ListeningPorts(ctx)
	if err != nil {
		return nil
	}
	result := []uint16{}
	for _, port := range ports.Ports {
		if _, ignored := workspacesdk.AgentIgnoredListeningPorts[port.Port]; ignored || port.Port < workspacesdk.AgentMinimumListeningPort {
			continue
		}
		if len(result) >= 64 {
			break
		}
		result = append(result, port.Port)
	}
	return result
}
