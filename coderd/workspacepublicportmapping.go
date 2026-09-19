package coderd

import (
	"context"
	"database/sql"
	"errors"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"
	"golang.org/x/xerrors"

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

const (
	publicPortFirst int32 = 18000
	publicPortLast  int32 = 18099
)

var (
	errPublicPortPoolExhausted = xerrors.New("public port pool exhausted")
	errPublicPortDuplicate     = xerrors.New("port already public")
	errPublicPortIngress       = xerrors.New("public ingress unavailable")
)

// @Summary List public workspace port mappings
// @ID list-workspace-public-port-mappings
// @Security CoderSessionToken
// @Produce json
// @Tags PortSharing
// @Param workspace path string true "Workspace ID" format(uuid)
// @Success 200 {object} codersdk.WorkspacePublicPortMappings
// @Router /api/v2/workspaces/{workspace}/public-port-mappings [get]
func (api *API) listWorkspacePublicPortMappings(rw http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	workspace := httpmw.WorkspaceParam(r)
	if !api.Authorize(r, policy.ActionRead, workspace.RBACObject()) {
		httpapi.Forbidden(rw)
		return
	}
	rows, err := api.Database.ListWorkspacePublicPortMappings(ctx, workspace.ID)
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	out := make([]codersdk.WorkspacePublicPortMapping, len(rows))
	var group errgroup.Group
	group.SetLimit(8)
	for index, row := range rows {
		group.Go(func() error { out[index] = api.convertWorkspacePublicPortMapping(ctx, row); return nil })
	}
	_ = group.Wait()
	httpapi.Write(r.Context(), rw, http.StatusOK, codersdk.WorkspacePublicPortMappings{Enabled: api.publicPortManager != nil, Mappings: out})
}

// @Summary Create public workspace port mapping
// @ID create-workspace-public-port-mapping
// @Security CoderSessionToken
// @Accept json
// @Produce json
// @Tags PortSharing
// @Param workspace path string true "Workspace ID" format(uuid)
// @Param request body codersdk.CreateWorkspacePublicPortMappingRequest true "Public port mapping"
// @Success 200 {object} codersdk.WorkspacePublicPortMapping
// @Router /api/v2/workspaces/{workspace}/public-port-mappings [post]
func (api *API) createWorkspacePublicPortMapping(rw http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	workspace := httpmw.WorkspaceParam(r)
	if !api.Authorize(r, policy.ActionApplicationConnect, workspace.RBACObject()) && !api.Authorize(r, policy.ActionSSH, workspace.RBACObject()) {
		httpapi.Forbidden(rw)
		return
	}
	if api.publicPortManager == nil || api.workspaceSSHBrowserOnly() || api.DeploymentValues.DisableWorkspaceSharing.Value() {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "部署尚未启用公网端口访问，或已限制工作区分享。"})
		return
	}
	var req codersdk.CreateWorkspacePublicPortMappingRequest
	if !httpapi.Read(ctx, rw, r, &req) {
		return
	}
	if !validWorkspacePublicPort(req.RemotePort) || (req.Protocol != "http" && req.Protocol != "https") || req.AgentName == "" || req.ShareLevel != "public" {
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "端口、Agent 和协议无效。"})
		return
	}
	template, err := api.Database.GetTemplateByID(ctx, workspace.TemplateID)
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	if (*api.PortSharer.Load()).AuthorizedLevel(template, codersdk.WorkspaceAgentPortShareLevelPublic) != nil {
		httpapi.Write(ctx, rw, http.StatusForbidden, codersdk.Response{Message: "工作区模板不允许公开分享端口。"})
		return
	}
	build, err := api.Database.GetLatestWorkspaceBuildByWorkspaceID(ctx, workspace.ID)
	if err != nil || build.Transition != database.WorkspaceTransitionStart || workspace.Deleted {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "工作区已停止，无法公开端口。"})
		return
	}
	agents, err := api.Database.GetWorkspaceAgentsInLatestBuildByWorkspaceID(ctx, workspace.ID)
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	var agent database.WorkspaceAgent
	for _, candidate := range agents {
		if candidate.Name == req.AgentName {
			agent = candidate
			break
		}
	}
	if agent.ID == uuid.Nil || workspacePublicAgentUnavailable(agent, api.AgentInactiveDisconnectTimeout) {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "工作区 Agent 未就绪，暂时无法公开访问。"})
		return
	}
	conn, release, err := api.agentProvider.AgentConn(ctx, agent.ID)
	if err != nil {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "工作区 Agent 当前不可达。"})
		return
	}
	ports, err := conn.ListeningPorts(ctx)
	release()
	if err != nil || !workspaceAgentHasPort(ports, req.RemotePort) {
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "远端端口未在工作区监听。"})
		return
	}
	if err := api.publicPortManager.probe(ctx, database.WorkspacePublicPortMapping{WorkspaceAgentID: agent.ID, RemotePort: req.RemotePort, Protocol: req.Protocol}); err != nil {
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "端口未响应所选 Web 协议，或 HTTPS 证书校验失败。"})
		return
	}
	api.publicPortManager.operations.Lock()
	defer api.publicPortManager.operations.Unlock()
	if _, err := api.Database.GetWorkspacePublicPortMappingByWorkspaceAgentPort(ctx, database.GetWorkspacePublicPortMappingByWorkspaceAgentPortParams{WorkspaceID: workspace.ID, AgentName: req.AgentName, RemotePort: req.RemotePort}); err == nil {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "该工作区端口已经公开。"})
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		httpapi.InternalServerError(rw, err)
		return
	}
	userID := httpmw.APIKey(r).UserID
	row, err := reserveWorkspacePublicPort(ctx, api.Database, database.InsertWorkspacePublicPortMappingParams{
		OrganizationID: workspace.OrganizationID, WorkspaceID: workspace.ID, WorkspaceAgentID: agent.ID,
		AgentName: req.AgentName, RemotePort: req.RemotePort, PublicPort: 0, Protocol: req.Protocol, CreatedBy: userID,
	}, func(row database.WorkspacePublicPortMapping) error {
		if err := api.publicPortManager.Add(ctx, row); err != nil {
			return errPublicPortIngress
		}
		if err := api.publicPortManager.probeIngress(ctx, row); err != nil {
			return errPublicPortIngress
		}
		return nil
	})
	if err != nil && row.ID != uuid.Nil {
		api.publicPortManager.Remove(row.PublicPort)
	}
	if errors.Is(err, errPublicPortDuplicate) {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "该工作区端口已经公开。"})
		return
	}
	if errors.Is(err, errPublicPortPoolExhausted) {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "公网端口池已耗尽，请先删除不用的公开映射。"})
		return
	}
	if errors.Is(err, errPublicPortIngress) {
		httpapi.Write(ctx, rw, http.StatusBadGateway, codersdk.Response{Message: "公网 HTTPS 或 FRP 接入不可用，请检查证书、端口转发和代理监听。"})
		return
	}
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	httpapi.Write(ctx, rw, http.StatusOK, api.convertWorkspacePublicPortMapping(ctx, row))
}

func reserveWorkspacePublicPort(ctx context.Context, store database.Store, params database.InsertWorkspacePublicPortMappingParams, publish func(database.WorkspacePublicPortMapping) error) (database.WorkspacePublicPortMapping, error) {
	var row database.WorkspacePublicPortMapping
	err := store.InTx(func(tx database.Store) error {
		// The transaction lock covers allocation across all Coder replicas.
		if err := tx.AcquireLock(ctx, database.GenLockID("workspace-public-port-pool")); err != nil {
			return err
		}
		_, err := tx.GetWorkspacePublicPortMappingByWorkspaceAgentPort(ctx, database.GetWorkspacePublicPortMappingByWorkspaceAgentPortParams{WorkspaceID: params.WorkspaceID, AgentName: params.AgentName, RemotePort: params.RemotePort})
		if err == nil {
			return errPublicPortDuplicate
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		used, err := tx.ListWorkspacePublicPortMappingsAll(dbauthz.AsSystemRestricted(ctx)) //nolint:gocritic // Only the allocator sees deployment-wide occupancy.
		if err != nil {
			return err
		}
		port, ok := allocateWorkspacePublicPort(used)
		if !ok {
			return errPublicPortPoolExhausted
		}
		params.PublicPort = port
		row, err = tx.InsertWorkspacePublicPortMapping(ctx, params)
		if err != nil {
			return err
		}
		// Requests cannot access the uncommitted mapping. Failed ingress checks
		// roll back publication without relying on a later cleanup query.
		if publish != nil {
			return publish(row)
		}
		return nil
	}, nil)
	return row, err
}

func allocateWorkspacePublicPort(rows []database.WorkspacePublicPortMapping) (int32, bool) {
	used := make(map[int32]struct{}, len(rows))
	for _, row := range rows {
		used[row.PublicPort] = struct{}{}
	}
	for port := publicPortFirst; port <= publicPortLast; port++ {
		if _, ok := used[port]; !ok {
			return port, true
		}
	}
	return 0, false
}

// @Summary Delete public workspace port mapping
// @ID delete-workspace-public-port-mapping
// @Security CoderSessionToken
// @Tags PortSharing
// @Param workspace path string true "Workspace ID" format(uuid)
// @Param mapping path string true "Mapping ID" format(uuid)
// @Success 200
// @Router /api/v2/workspaces/{workspace}/public-port-mappings/{mapping} [delete]
func (api *API) deleteWorkspacePublicPortMapping(rw http.ResponseWriter, r *http.Request) {
	workspace := httpmw.WorkspaceParam(r)
	if !api.Authorize(r, policy.ActionApplicationConnect, workspace.RBACObject()) && !api.Authorize(r, policy.ActionSSH, workspace.RBACObject()) {
		httpapi.Forbidden(rw)
		return
	}
	if api.publicPortManager != nil {
		api.publicPortManager.operations.Lock()
		defer api.publicPortManager.operations.Unlock()
	}
	mappingID, err := uuid.Parse(chi.URLParam(r, "mapping"))
	if err != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	row, err := api.Database.GetWorkspacePublicPortMapping(r.Context(), mappingID)
	if err != nil || row.WorkspaceID != workspace.ID {
		httpapi.ResourceNotFound(rw)
		return
	}
	if err := api.Database.DeleteWorkspacePublicPortMapping(r.Context(), mappingID); err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	if api.publicPortManager != nil {
		api.publicPortManager.Remove(row.PublicPort)
	}
	rw.WriteHeader(http.StatusOK)
}

func workspacePublicAgentUnavailable(agent database.WorkspaceAgent, inactiveTimeout time.Duration) bool {
	return agent.Deleted || agent.OperatingSystem != "linux" || agent.LifecycleState != database.WorkspaceAgentLifecycleStateReady || agent.Status(dbtime.Now(), inactiveTimeout).Status != database.WorkspaceAgentStatusConnected
}

func (api *API) validateWorkspacePublicPortMapping(ctx context.Context, mapping database.WorkspacePublicPortMapping) error {
	if api.workspaceSSHBrowserOnly() || api.DeploymentValues.DisableWorkspaceSharing.Value() {
		return xerrors.New("sharing disabled")
	}
	ctx = dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // Validate the target of an explicitly public mapping.
	current, err := api.Database.GetWorkspacePublicPortMapping(ctx, mapping.ID)
	if err != nil || current.WorkspaceAgentID != mapping.WorkspaceAgentID || current.WorkspaceID != mapping.WorkspaceID || current.RemotePort != mapping.RemotePort || current.PublicPort != mapping.PublicPort || current.Protocol != mapping.Protocol || current.ShareLevel != "public" {
		return xerrors.New("mapping unavailable")
	}
	workspace, err := api.Database.GetWorkspaceByID(ctx, mapping.WorkspaceID)
	if err != nil || workspace.Deleted || workspace.OrganizationID != mapping.OrganizationID {
		return xerrors.New("workspace unavailable")
	}
	subject, status, err := httpmw.UserRBACSubject(ctx, api.Database, mapping.CreatedBy, rbac.ScopeAll)
	if err != nil || status != database.UserStatusActive {
		return xerrors.New("creator unavailable")
	}
	if api.Authorizer.Authorize(ctx, subject, policy.ActionSSH, workspace.RBACObject()) != nil && api.Authorizer.Authorize(ctx, subject, policy.ActionApplicationConnect, workspace.RBACObject()) != nil {
		return xerrors.New("sharing permission revoked")
	}
	template, err := api.Database.GetTemplateByID(ctx, workspace.TemplateID)
	if err != nil || (*api.PortSharer.Load()).AuthorizedLevel(template, codersdk.WorkspaceAgentPortShareLevelPublic) != nil {
		return xerrors.New("template sharing disabled")
	}
	build, err := api.Database.GetLatestWorkspaceBuildByWorkspaceID(ctx, mapping.WorkspaceID)
	if err != nil || build.Transition != database.WorkspaceTransitionStart {
		return xerrors.New("workspace stopped")
	}
	agents, err := api.Database.GetWorkspaceAgentsInLatestBuildByWorkspaceID(ctx, mapping.WorkspaceID)
	if err != nil {
		return err
	}
	for _, agent := range agents {
		if agent.ID == mapping.WorkspaceAgentID && !workspacePublicAgentUnavailable(agent, api.AgentInactiveDisconnectTimeout) {
			return nil
		}
	}
	return xerrors.New("agent unavailable")
}

func workspaceAgentHasPort(ports codersdk.WorkspaceAgentListeningPortsResponse, port int32) bool {
	for _, p := range ports.Ports {
		if int32(p.Port) == port {
			return true
		}
	}
	return false
}

func (api *API) convertWorkspacePublicPortMapping(ctx context.Context, row database.WorkspacePublicPortMapping) codersdk.WorkspacePublicPortMapping {
	u := *api.AccessURL
	u.Scheme = "https"
	u.Path = ""
	u.RawPath = ""
	u.RawQuery, u.Fragment, u.User = "", "", nil
	u.Host = net.JoinHostPort(u.Hostname(), strconv.Itoa(int(row.PublicPort)))
	state := "disabled"
	if api.publicPortManager != nil {
		state = "unavailable"
		if api.validateWorkspacePublicPortMapping(ctx, row) == nil {
			state = "proxy_error"
			if api.publicPortManager.Running(row) {
				state = "ready"
				if api.publicPortManager.probeIngress(ctx, row) != nil {
					state = "ingress_error"
				}
			}
		}
	}
	return codersdk.WorkspacePublicPortMapping{ID: row.ID, OrganizationID: row.OrganizationID, WorkspaceID: row.WorkspaceID, WorkspaceAgentID: row.WorkspaceAgentID, AgentName: row.AgentName, RemotePort: row.RemotePort, PublicPort: row.PublicPort, Protocol: row.Protocol, URL: u.String(), ShareLevel: "public", State: state, CreatedBy: row.CreatedBy, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt}
}

func validWorkspacePublicPort(port int32) bool {
	if port < workspacesdk.AgentMinimumListeningPort || port > 65535 || port == 22 || port == 2222 {
		return false
	}
	_, internal := workspacesdk.AgentIgnoredListeningPorts[uint16(port)]
	return !internal
}
