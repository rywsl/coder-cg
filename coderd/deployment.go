package coderd

import (
	"errors"
	"net/http"

	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/coderd/httpapi"
	"github.com/coder/coder/v2/coderd/rbac"
	"github.com/coder/coder/v2/coderd/rbac/policy"
	"github.com/coder/coder/v2/codersdk"
)

// @Summary Get deployment config
// @ID get-deployment-config
// @Security CoderSessionToken
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.DeploymentConfig
// @Router /api/v2/deployment/config [get]
func (api *API) deploymentValues(rw http.ResponseWriter, r *http.Request) {
	if !api.Authorize(r, policy.ActionRead, rbac.ResourceDeploymentConfig) {
		httpapi.Forbidden(rw)
		return
	}

	values, err := api.DeploymentValues.WithoutSecrets()
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}

	httpapi.Write(
		r.Context(), rw, http.StatusOK,
		codersdk.DeploymentConfig{
			Values:  values,
			Options: api.DeploymentOptions,
		},
	)
}

// @Summary Get deployment stats
// @ID get-deployment-stats
// @Security CoderSessionToken
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.DeploymentStats
// @Router /api/v2/deployment/stats [get]
func (api *API) deploymentStats(rw http.ResponseWriter, r *http.Request) {
	if !api.Authorize(r, policy.ActionRead, rbac.ResourceDeploymentStats) {
		httpapi.Forbidden(rw)
		return
	}

	stats, ok := api.metricsCache.DeploymentStats()
	if !ok {
		httpapi.Write(r.Context(), rw, http.StatusBadRequest, codersdk.Response{
			Message: "Deployment stats are still processing!",
		})
		return
	}

	httpapi.Write(r.Context(), rw, http.StatusOK, stats)
}

// @Summary Build info
// @ID build-info
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.BuildInfoResponse
// @Router /api/v2/buildinfo [get]
func buildInfoHandler(resp codersdk.BuildInfoResponse) http.HandlerFunc {
	// This is in a handler so that we can generate API docs info.
	return func(rw http.ResponseWriter, r *http.Request) {
		httpapi.Write(r.Context(), rw, http.StatusOK, resp)
	}
}

// @Summary SSH Config
// @ID ssh-config
// @Security CoderSessionToken
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.SSHConfigResponse
// @Router /api/v2/deployment/ssh [get]
func (api *API) sshConfig(rw http.ResponseWriter, r *http.Request) {
	config := api.SSHConfig
	config.WorkspaceSSHGateway = api.workspaceSSHGatewayInfo()
	httpapi.Write(r.Context(), rw, http.StatusOK, config)
}

// @Summary Get workspace SSH gateway
// @ID get-workspace-ssh-gateway
// @Security CoderSessionToken
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.WorkspaceSSHGatewayStatus
// @Router /api/v2/deployment/workspace-ssh-gateway [get]
func (api *API) workspaceSSHGatewayStatus(rw http.ResponseWriter, r *http.Request) {
	if !api.Authorize(r, policy.ActionRead, rbac.ResourceDeploymentConfig) {
		httpapi.Forbidden(rw)
		return
	}
	status, err := api.workspaceSSHGatewayManager.status(r.Context())
	if err != nil {
		httpapi.InternalServerError(rw, xerrors.New("read workspace SSH gateway status"))
		return
	}
	httpapi.Write(r.Context(), rw, http.StatusOK, status)
}

// @Summary Update workspace SSH gateway
// @ID update-workspace-ssh-gateway
// @Security CoderSessionToken
// @Accept json
// @Produce json
// @Tags General
// @Param request body codersdk.UpdateWorkspaceSSHGatewayRequest true "Workspace SSH gateway configuration"
// @Success 200 {object} codersdk.WorkspaceSSHGatewayStatus
// @Router /api/v2/deployment/workspace-ssh-gateway [put]
func (api *API) updateWorkspaceSSHGateway(rw http.ResponseWriter, r *http.Request) {
	if !api.Authorize(r, policy.ActionUpdate, rbac.ResourceDeploymentConfig) {
		httpapi.Forbidden(rw)
		return
	}
	var req codersdk.UpdateWorkspaceSSHGatewayRequest
	if !httpapi.Read(r.Context(), rw, r, &req) {
		return
	}
	if err := req.Config.Validate(); err != nil || (req.ClearCodexAPIKey && req.CodexAPIKey != "") {
		httpapi.Write(r.Context(), rw, http.StatusBadRequest, codersdk.Response{Message: "Workspace SSH gateway configuration is invalid."})
		return
	}
	if err := api.workspaceSSHGatewayManager.update(r.Context(), req); err != nil {
		if errors.Is(err, errWorkspaceSSHGatewayRunning) {
			httpapi.Write(r.Context(), rw, http.StatusConflict, codersdk.Response{Message: "Workspace SSH gateway must be stopped before updating configuration."})
			return
		}
		httpapi.InternalServerError(rw, xerrors.New("save workspace SSH gateway configuration"))
		return
	}
	api.writeWorkspaceSSHGatewayStatus(rw, r)
}

// @Summary Start workspace SSH gateway
// @ID start-workspace-ssh-gateway
// @Security CoderSessionToken
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.WorkspaceSSHGatewayStatus
// @Router /api/v2/deployment/workspace-ssh-gateway/start [post]
func (api *API) startWorkspaceSSHGateway(rw http.ResponseWriter, r *http.Request) {
	if !api.Authorize(r, policy.ActionUpdate, rbac.ResourceDeploymentConfig) {
		httpapi.Forbidden(rw)
		return
	}
	if err := api.workspaceSSHGatewayManager.start(r.Context()); err != nil {
		if errors.Is(err, errWorkspaceSSHGatewayCannotStart) {
			httpapi.Write(r.Context(), rw, http.StatusConflict, codersdk.Response{Message: "Workspace SSH gateway could not be started."})
			return
		}
		httpapi.InternalServerError(rw, xerrors.New("start workspace SSH gateway"))
		return
	}
	api.writeWorkspaceSSHGatewayStatus(rw, r)
}

// @Summary Stop workspace SSH gateway
// @ID stop-workspace-ssh-gateway
// @Security CoderSessionToken
// @Produce json
// @Tags General
// @Success 200 {object} codersdk.WorkspaceSSHGatewayStatus
// @Router /api/v2/deployment/workspace-ssh-gateway/stop [post]
func (api *API) stopWorkspaceSSHGateway(rw http.ResponseWriter, r *http.Request) {
	if !api.Authorize(r, policy.ActionUpdate, rbac.ResourceDeploymentConfig) {
		httpapi.Forbidden(rw)
		return
	}
	if err := api.workspaceSSHGatewayManager.stop(r.Context()); err != nil {
		httpapi.InternalServerError(rw, xerrors.New("stop workspace SSH gateway"))
		return
	}
	api.writeWorkspaceSSHGatewayStatus(rw, r)
}

func (api *API) writeWorkspaceSSHGatewayStatus(rw http.ResponseWriter, r *http.Request) {
	status, err := api.workspaceSSHGatewayManager.status(r.Context())
	if err != nil {
		httpapi.InternalServerError(rw, xerrors.New("read workspace SSH gateway status"))
		return
	}
	httpapi.Write(r.Context(), rw, http.StatusOK, status)
}
