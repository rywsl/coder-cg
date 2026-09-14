package coderd

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/kballard/go-shellquote"
	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3"
	"github.com/coder/coder/v2/coderd/audit"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbauthz"
	"github.com/coder/coder/v2/coderd/database/dbtime"
	"github.com/coder/coder/v2/coderd/httpapi"
	"github.com/coder/coder/v2/coderd/httpmw"
	"github.com/coder/coder/v2/coderd/httpmw/loggermw"
	"github.com/coder/coder/v2/coderd/i18n"
	"github.com/coder/coder/v2/coderd/rbac/policy"
	"github.com/coder/coder/v2/codersdk"
)

const workspaceSSHEnrollmentLifetime = 10 * time.Minute

// @Summary List workspace SSH keys
// @ID list-workspace-ssh-keys
// @Security CoderSessionToken
// @Produce json
// @Tags SSH
// @Param organization path string true "Organization ID or name"
// @Success 200 {array} codersdk.WorkspaceSSHKey
// @Router /api/v2/organizations/{organization}/workspace-ssh-keys [get]
func (api *API) workspaceSSHKeys(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	organization := httpmw.OrganizationParam(r)
	if !api.Authorize(r, policy.ActionRead, organization.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	userID := httpmw.APIKey(r).UserID
	keys, err := api.Database.GetWorkspaceSSHKeysByUserAndOrganization(ctx, database.GetWorkspaceSSHKeysByUserAndOrganizationParams{
		UserID:         userID,
		OrganizationID: organization.ID,
	})
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	response := make([]codersdk.WorkspaceSSHKey, 0, len(keys))
	for _, key := range keys {
		response = append(response, workspaceSSHKey(key))
	}
	httpapi.Write(ctx, rw, http.StatusOK, response)
}

// @Summary Create workspace SSH key
// @ID create-workspace-ssh-key
// @Security CoderSessionToken
// @Accept json
// @Produce json
// @Tags SSH
// @Param organization path string true "Organization ID or name"
// @Param request body codersdk.CreateWorkspaceSSHKeyRequest true "Key registration"
// @Success 201 {object} codersdk.WorkspaceSSHKey
// @Router /api/v2/organizations/{organization}/workspace-ssh-keys [post]
func (api *API) createWorkspaceSSHKey(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	organization := httpmw.OrganizationParam(r)
	if !api.Authorize(r, policy.ActionRead, organization.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	userID := httpmw.APIKey(r).UserID
	var request codersdk.CreateWorkspaceSSHKeyRequest
	if !httpapi.Read(ctx, rw, r, &request) {
		return
	}
	key, created, err := insertWorkspaceSSHKey(ctx, api.Database, userID, organization.ID, request)
	if err != nil {
		writeWorkspaceSSHKeyError(ctx, rw, err)
		return
	}

	auditor := api.workspaceSSHAuditor()
	aReq, commitAudit := audit.InitRequest[database.WorkspaceSshKey](rw, &audit.RequestParams{
		Audit:          auditor,
		Log:            api.Logger,
		Request:        r,
		Action:         database.AuditActionCreate,
		OrganizationID: organization.ID,
	})
	defer commitAudit()
	if created {
		aReq.New = key
	}
	httpapi.Write(ctx, rw, http.StatusCreated, workspaceSSHKey(key))
}

// @Summary Delete workspace SSH key
// @ID delete-workspace-ssh-key
// @Security CoderSessionToken
// @Tags SSH
// @Param organization path string true "Organization ID or name"
// @Param key path string true "Workspace SSH key ID" format(uuid)
// @Success 204
// @Router /api/v2/organizations/{organization}/workspace-ssh-keys/{key} [delete]
func (api *API) deleteWorkspaceSSHKey(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	organization := httpmw.OrganizationParam(r)
	if !api.Authorize(r, policy.ActionRead, organization.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	userID := httpmw.APIKey(r).UserID
	keyID, err := uuid.Parse(chi.URLParam(r, "key"))
	if err != nil {
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "Workspace SSH key ID must be a UUID."})
		return
	}
	auditor := api.workspaceSSHAuditor()
	aReq, commitAudit := audit.InitRequest[database.WorkspaceSshKey](rw, &audit.RequestParams{
		Audit:          auditor,
		Log:            api.Logger,
		Request:        r,
		Action:         database.AuditActionDelete,
		OrganizationID: organization.ID,
	})
	defer commitAudit()
	key, err := api.Database.DeleteWorkspaceSSHKeyByID(ctx, database.DeleteWorkspaceSSHKeyByIDParams{
		ID:             keyID,
		UserID:         userID,
		OrganizationID: organization.ID,
	})
	if xerrors.Is(err, sql.ErrNoRows) {
		httpapi.ResourceNotFound(rw)
		return
	}
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	aReq.Old = key
	rw.WriteHeader(http.StatusNoContent)
}

// @Summary Create workspace SSH bootstrap
// @ID create-workspace-ssh-bootstrap
// @Security CoderSessionToken
// @Produce json
// @Tags SSH
// @Param workspaceagent path string true "Workspace agent ID" format(uuid)
// @Success 201 {object} codersdk.WorkspaceSSHBootstrapResponse
// @Router /api/v2/workspaceagents/{workspaceagent}/workspace-ssh-bootstrap [post]
func (api *API) workspaceSSHBootstrap(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !api.workspaceSSHGatewayEnabled(rw, r) {
		return
	}
	if api.workspaceSSHBrowserOnly() {
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{
			Message: "Non-browser connections are disabled for your deployment.",
		})
		return
	}
	agentID, ok := httpmw.ParseUUIDParam(rw, r, "workspaceagent")
	if !ok {
		return
	}
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	bootstrapTarget, err := api.Database.GetWorkspaceSSHBootstrapTargetByAgentID(systemCtx, agentID)
	if httpapi.Is404Error(err) {
		httpapi.Write(ctx, rw, http.StatusNotFound, codersdk.Response{
			Message: "Agent doesn't exist with that id, or you do not have access to it.",
		})
		return
	}
	if err != nil {
		httpapi.InternalServerError(rw, xerrors.Errorf("get workspace SSH bootstrap target: %w", err))
		return
	}
	waws := database.GetWorkspaceAgentAndWorkspaceByIDRow(bootstrapTarget)
	if requestLogger := loggermw.RequestLoggerFromContext(ctx); requestLogger != nil {
		requestLogger.WithFields(
			slog.F("workspace_name", waws.WorkspaceTable.Name),
			slog.F("agent_name", waws.WorkspaceAgent.Name),
		)
	}
	if !api.Authorize(r, policy.ActionSSH, waws.WorkspaceTable.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	if response := api.workspaceSSHAgentUnavailable(ctx, waws); response != nil {
		httpapi.Write(ctx, rw, http.StatusConflict, *response)
		return
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		httpapi.InternalServerError(rw, xerrors.Errorf("generate workspace SSH enrollment token: %w", err))
		return
	}
	token := base64.RawURLEncoding.EncodeToString(tokenBytes)
	tokenHash := sha256.Sum256(tokenBytes)
	now := dbtime.Now()
	expiresAt := now.Add(workspaceSSHEnrollmentLifetime)
	enrollmentID := uuid.New()
	_, err = api.Database.InsertWorkspaceSSHKeyEnrollment(ctx, database.InsertWorkspaceSSHKeyEnrollmentParams{
		ID:               enrollmentID,
		TokenHash:        tokenHash[:],
		UserID:           httpmw.APIKey(r).UserID,
		OrganizationID:   waws.WorkspaceTable.OrganizationID,
		WorkspaceAgentID: waws.WorkspaceAgent.ID,
		Locale:           string(i18n.FromRequest(r)),
		CreatedAt:        now,
		ExpiresAt:        expiresAt,
	})
	if err != nil {
		httpapi.InternalServerError(rw, xerrors.Errorf("create workspace SSH key enrollment: %w", err))
		return
	}
	target := api.workspaceSSHTarget(waws)
	enrollmentURL := api.workspaceSSHEnrollmentURL(enrollmentID)
	bashDownload := shellquote.Join("curl", "-fsSL", "-H", "Authorization: Bearer "+token, enrollmentURL+"/script?platform=bash")
	httpapi.Write(ctx, rw, http.StatusCreated, codersdk.WorkspaceSSHBootstrapResponse{
		EnrollmentID:      enrollmentID,
		BashCommand:       "bash -c \"$(" + bashDownload + ")\"",
		PowerShellCommand: "iex (irm -Headers @{Authorization=" + powershellQuote("Bearer "+token) + "} " + powershellQuote(enrollmentURL+"/script?platform=powershell") + ")",
		Alias:             target.Alias,
		ProjectPath:       target.ProjectPath,
		DeepLink:          target.DeepLink,
		ExpiresAt:         expiresAt,
	})
}

// @Summary Get workspace SSH enrollment script
// @ID get-workspace-ssh-enrollment-script
// @Description Authenticate with a one-time enrollment token using the Bearer scheme in the Authorization header.
// @Security Authorization
// @Produce text/plain
// @Tags SSH
// @Param enrollment path string true "Enrollment ID" format(uuid)
// @Param platform query string true "bash or powershell"
// @Success 200 {string} string
// @Router /api/v2/workspace-ssh/enrollments/{enrollment}/script [get]
func (api *API) workspaceSSHEnrollmentScript(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !api.workspaceSSHGatewayEnabled(rw, r) {
		return
	}
	enrollment, token, ok := api.workspaceSSHEnrollment(ctx, rw, r)
	if !ok {
		return
	}
	// Possession of the enrollment token authorizes this target lookup.
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	waws, err := api.Database.GetWorkspaceAgentAndWorkspaceByID(systemCtx, enrollment.WorkspaceAgentID)
	if err != nil || waws.WorkspaceTable.OrganizationID != enrollment.OrganizationID {
		httpapi.ResourceNotFound(rw)
		return
	}
	target := api.workspaceSSHTarget(waws)
	registrationURL := api.workspaceSSHEnrollmentURL(enrollment.ID)
	var script string
	switch r.URL.Query().Get("platform") {
	case "bash":
		script = api.workspaceSSHBashScript(registrationURL, token, enrollment.Locale, target)
	case "powershell":
		script = api.workspaceSSHPowerShellScript(registrationURL, token, enrollment.Locale, target)
	default:
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "Platform must be bash or powershell."})
		return
	}
	rw.Header().Set("Content-Type", "text/plain; charset=utf-8")
	rw.Header().Set("Cache-Control", "no-store")
	rw.WriteHeader(http.StatusOK)
	_, _ = rw.Write([]byte(script))
}

// @Summary Enroll workspace SSH key
// @ID enroll-workspace-ssh-key
// @Description Authenticate with a one-time enrollment token using the Bearer scheme in the Authorization header.
// @Security Authorization
// @Accept json
// @Accept application/x-www-form-urlencoded
// @Produce json
// @Tags SSH
// @Param enrollment path string true "Enrollment ID" format(uuid)
// @Param request body codersdk.EnrollWorkspaceSSHKeyRequest true "Key enrollment"
// @Success 201 {object} codersdk.WorkspaceSSHEnrollmentResponse
// @Router /api/v2/workspace-ssh/enrollments/{enrollment} [post]
func (api *API) enrollWorkspaceSSHKey(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !api.workspaceSSHGatewayEnabled(rw, r) {
		return
	}
	request, ok := readWorkspaceSSHEnrollmentRequest(ctx, rw, r)
	if !ok {
		return
	}
	enrollmentID, tokenHash, _, ok := workspaceSSHEnrollmentCredentials(r)
	if !ok {
		httpapi.ResourceNotFound(rw)
		return
	}
	var enrollment database.WorkspaceSshKeyEnrollment
	var key database.WorkspaceSshKey
	var target workspaceSSHDesktopTarget
	var keyCreated bool
	// The one-time enrollment token supplies the user identity for this
	// unauthenticated endpoint.
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	err := api.Database.InTx(func(tx database.Store) error {
		var err error
		enrollment, err = tx.GetWorkspaceSSHKeyEnrollmentForUpdate(systemCtx, database.GetWorkspaceSSHKeyEnrollmentForUpdateParams{
			ID:        enrollmentID,
			TokenHash: tokenHash,
			Now:       dbtime.Now(),
		})
		if err != nil {
			return err
		}
		waws, err := tx.GetWorkspaceAgentAndWorkspaceByID(systemCtx, enrollment.WorkspaceAgentID)
		if err != nil || waws.WorkspaceTable.OrganizationID != enrollment.OrganizationID {
			return sql.ErrNoRows
		}
		target = api.workspaceSSHTarget(waws)
		key, keyCreated, err = insertWorkspaceSSHKey(systemCtx, tx, enrollment.UserID, enrollment.OrganizationID, codersdk.CreateWorkspaceSSHKeyRequest(request))
		if err != nil {
			return err
		}
		now := dbtime.Now()
		_, err = tx.CompleteWorkspaceSSHKeyEnrollment(systemCtx, database.CompleteWorkspaceSSHKeyEnrollmentParams{
			ID:                enrollment.ID,
			ConsumedAt:        sql.NullTime{Time: now, Valid: true},
			WorkspaceSshKeyID: uuid.NullUUID{UUID: key.ID, Valid: true},
		})
		return err
	}, nil)
	if xerrors.Is(err, sql.ErrNoRows) {
		httpapi.ResourceNotFound(rw)
		return
	}
	if err != nil {
		localizedCtx := i18n.WithLocale(ctx, i18n.Locale(enrollment.Locale))
		rw.Header().Set("Content-Language", enrollment.Locale)
		writeWorkspaceSSHKeyError(localizedCtx, rw, err)
		return
	}
	auditor := api.workspaceSSHAuditor()
	aReq, commitAudit := audit.InitRequest[database.WorkspaceSshKey](rw, &audit.RequestParams{
		Audit:          auditor,
		Log:            api.Logger,
		Request:        r,
		Action:         database.AuditActionCreate,
		OrganizationID: enrollment.OrganizationID,
	})
	defer commitAudit()
	aReq.UserID = enrollment.UserID
	if keyCreated {
		aReq.New = key
	}
	httpapi.Write(ctx, rw, http.StatusCreated, codersdk.WorkspaceSSHEnrollmentResponse{
		Key:         workspaceSSHKey(key),
		Alias:       target.Alias,
		ProjectPath: target.ProjectPath,
		DeepLink:    target.DeepLink,
	})
}

// @Summary Get workspace SSH enrollment status
// @ID get-workspace-ssh-enrollment-status
// @Security CoderSessionToken
// @Produce json
// @Tags SSH
// @Param enrollment path string true "Enrollment ID" format(uuid)
// @Success 200 {object} codersdk.WorkspaceSSHEnrollmentStatusResponse
// @Router /api/v2/workspace-ssh/enrollments/{enrollment} [get]
func (api *API) workspaceSSHEnrollmentStatus(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if !api.workspaceSSHGatewayEnabled(rw, r) {
		return
	}
	enrollmentID, ok := parseWorkspaceSSHEnrollmentID(r)
	if !ok {
		httpapi.ResourceNotFound(rw)
		return
	}
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	enrollment, err := api.Database.GetWorkspaceSSHKeyEnrollmentByID(systemCtx, enrollmentID)
	if xerrors.Is(err, sql.ErrNoRows) || err == nil && enrollment.UserID != httpmw.APIKey(r).UserID {
		httpapi.ResourceNotFound(rw)
		return
	}
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return
	}
	organization, err := api.Database.GetOrganizationByID(systemCtx, enrollment.OrganizationID)
	if err != nil || !api.Authorize(r, policy.ActionRead, organization.RBACObject()) {
		httpapi.ResourceNotFound(rw)
		return
	}
	status := codersdk.WorkspaceSSHEnrollmentStatusPending
	var keyID *uuid.UUID
	if enrollment.ConsumedAt.Valid && enrollment.WorkspaceSshKeyID.Valid {
		status = codersdk.WorkspaceSSHEnrollmentStatusComplete
		keyID = &enrollment.WorkspaceSshKeyID.UUID
	} else if !dbtime.Now().Before(enrollment.ExpiresAt) {
		status = codersdk.WorkspaceSSHEnrollmentStatusExpired
	}
	httpapi.Write(ctx, rw, http.StatusOK, codersdk.WorkspaceSSHEnrollmentStatusResponse{
		EnrollmentID:      enrollment.ID,
		Status:            status,
		WorkspaceSSHKeyID: keyID,
		ExpiresAt:         enrollment.ExpiresAt,
	})
}

type workspaceSSHDesktopTarget struct {
	Alias       string
	ProjectPath string
	DeepLink    string
}

func (api *API) workspaceSSHTarget(waws database.GetWorkspaceAgentAndWorkspaceByIDRow) workspaceSSHDesktopTarget {
	suffix := api.SSHConfig.HostnameSuffix
	if gateway := api.workspaceSSHGatewayInfo(); gateway != nil {
		suffix = gateway.AliasSuffix
	}
	alias := strings.Join([]string{waws.WorkspaceAgent.Name, waws.WorkspaceTable.Name, waws.OwnerUsername, suffix}, ".")
	query := url.Values{
		"name":        {alias},
		"projectPath": {waws.WorkspaceAgent.ExpandedDirectory},
		"enabled":     {"true"},
	}.Encode()
	return workspaceSSHDesktopTarget{
		Alias:       alias,
		ProjectPath: waws.WorkspaceAgent.ExpandedDirectory,
		DeepLink:    "codex://settings/connections/ssh/add?" + strings.ReplaceAll(query, "+", "%20"),
	}
}

func (api *API) workspaceSSHEnrollmentURL(enrollmentID uuid.UUID) string {
	base := *api.AccessURL
	base.Path = strings.TrimSuffix(base.Path, "/") + "/api/v2/workspace-ssh/enrollments/" + enrollmentID.String()
	base.RawQuery = ""
	base.Fragment = ""
	return base.String()
}

func (api *API) workspaceSSHEnrollment(ctx context.Context, rw http.ResponseWriter, r *http.Request) (database.WorkspaceSshKeyEnrollment, string, bool) {
	enrollmentID, tokenHash, token, ok := workspaceSSHEnrollmentCredentials(r)
	if !ok {
		httpapi.ResourceNotFound(rw)
		return database.WorkspaceSshKeyEnrollment{}, "", false
	}
	// The bearer token is the authorization boundary for this unauthenticated
	// endpoint. The enrollment UUID is deliberately non-sensitive.
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	var enrollment database.WorkspaceSshKeyEnrollment
	err := api.Database.InTx(func(tx database.Store) error {
		var err error
		enrollment, err = tx.GetWorkspaceSSHKeyEnrollmentForUpdate(systemCtx, database.GetWorkspaceSSHKeyEnrollmentForUpdateParams{
			ID:        enrollmentID,
			TokenHash: tokenHash,
			Now:       dbtime.Now(),
		})
		return err
	}, nil)
	if xerrors.Is(err, sql.ErrNoRows) {
		httpapi.ResourceNotFound(rw)
		return database.WorkspaceSshKeyEnrollment{}, "", false
	}
	if err != nil {
		httpapi.InternalServerError(rw, err)
		return database.WorkspaceSshKeyEnrollment{}, "", false
	}
	return enrollment, token, true
}

func parseWorkspaceSSHEnrollmentID(r *http.Request) (uuid.UUID, bool) {
	enrollmentID, err := uuid.Parse(chi.URLParam(r, "enrollment"))
	return enrollmentID, err == nil
}

func workspaceSSHEnrollmentCredentials(r *http.Request) (uuid.UUID, []byte, string, bool) {
	enrollmentID, ok := parseWorkspaceSSHEnrollmentID(r)
	if !ok {
		return uuid.Nil, nil, "", false
	}
	fields := strings.Fields(r.Header.Get("Authorization"))
	if len(fields) != 2 || !strings.EqualFold(fields[0], "Bearer") {
		return uuid.Nil, nil, "", false
	}
	tokenHash, ok := workspaceSSHEnrollmentTokenHash(fields[1])
	if !ok {
		return uuid.Nil, nil, "", false
	}
	return enrollmentID, tokenHash, fields[1], true
}

func workspaceSSHEnrollmentTokenHash(token string) ([]byte, bool) {
	tokenBytes, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(tokenBytes) != 32 {
		return nil, false
	}
	hash := sha256.Sum256(tokenBytes)
	return hash[:], true
}

func (api *API) workspaceSSHGatewayEnabled(rw http.ResponseWriter, r *http.Request) bool {
	gateway := api.workspaceSSHGatewayInfo()
	if gateway == nil || !gateway.Enabled {
		httpapi.Write(r.Context(), rw, http.StatusNotFound, codersdk.Response{Message: "Workspace SSH gateway is disabled."})
		return false
	}
	return true
}

func (api *API) workspaceSSHAgentUnavailable(ctx context.Context, waws database.GetWorkspaceAgentAndWorkspaceByIDRow) *codersdk.Response {
	if api.workspaceSSHBrowserOnly() {
		return &codersdk.Response{Message: "Non-browser connections are disabled for your deployment."}
	}
	// The handler already authorized workspace SSH; this lookup only confirms
	// that the selected agent belongs to the latest build.
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic
	current, err := api.Database.GetWorkspaceSSHGatewayTarget(systemCtx, database.GetWorkspaceSSHGatewayTargetParams{
		OwnerUsername: waws.OwnerUsername,
		WorkspaceName: waws.WorkspaceTable.Name,
		AgentName:     waws.WorkspaceAgent.Name,
	})
	if err != nil || current.WorkspaceAgent.ID != waws.WorkspaceAgent.ID {
		return &codersdk.Response{Message: "Agent must belong to the latest workspace build."}
	}
	if current.LatestBuildTransition == database.WorkspaceTransitionStop {
		return &codersdk.Response{Message: "Workspace must be running before configuring ChatGPT Desktop."}
	}
	if current.AgentBuildNumber != current.LatestBuildNumber {
		return &codersdk.Response{Message: "Agent must belong to the latest workspace build."}
	}
	agent := waws.WorkspaceAgent
	if !strings.EqualFold(agent.OperatingSystem, "linux") {
		return &codersdk.Response{Message: "Workspace SSH gateway currently supports Linux agents only."}
	}
	if agent.LifecycleState != database.WorkspaceAgentLifecycleStateReady {
		return &codersdk.Response{Message: "Agent must be ready before configuring ChatGPT Desktop."}
	}
	if agent.Status(dbtime.Now(), api.AgentInactiveDisconnectTimeout).Status != database.WorkspaceAgentStatusConnected {
		return &codersdk.Response{Message: "Agent must be connected before configuring ChatGPT Desktop."}
	}
	return nil
}

func insertWorkspaceSSHKey(ctx context.Context, store database.Store, userID, organizationID uuid.UUID, request codersdk.CreateWorkspaceSSHKeyRequest) (database.WorkspaceSshKey, bool, error) {
	deviceName := strings.TrimSpace(request.DeviceName)
	if deviceName == "" || utf8.RuneCountInString(deviceName) > 255 {
		return database.WorkspaceSshKey{}, false, xerrors.New("device name must contain between 1 and 255 characters")
	}
	publicKey, canonical, fingerprint, err := canonicalWorkspaceSSHPublicKey(request.PublicKey)
	if err != nil {
		return database.WorkspaceSshKey{}, false, err
	}
	_ = publicKey
	existing, err := store.GetWorkspaceSSHKeyByUserOrganizationAndFingerprint(ctx, database.GetWorkspaceSSHKeyByUserOrganizationAndFingerprintParams{
		UserID:         userID,
		OrganizationID: organizationID,
		Fingerprint:    fingerprint,
	})
	if err == nil {
		return existing, false, nil
	}
	if !xerrors.Is(err, sql.ErrNoRows) {
		return database.WorkspaceSshKey{}, false, err
	}
	key, err := store.InsertWorkspaceSSHKey(ctx, database.InsertWorkspaceSSHKeyParams{
		ID:             uuid.New(),
		UserID:         userID,
		OrganizationID: organizationID,
		DeviceName:     deviceName,
		PublicKey:      canonical,
		Fingerprint:    fingerprint,
		CreatedAt:      dbtime.Now(),
	})
	if err == nil {
		return key, true, nil
	}
	if !database.IsUniqueViolation(err, database.UniqueWorkspaceSshKeysOrganizationIDFingerprintKey) {
		return database.WorkspaceSshKey{}, false, err
	}
	// A concurrent enrollment by this user is idempotent. A fingerprint
	// owned by another user remains a conflict without revealing ownership.
	existing, lookupErr := store.GetWorkspaceSSHKeyByUserOrganizationAndFingerprint(ctx, database.GetWorkspaceSSHKeyByUserOrganizationAndFingerprintParams{
		UserID:         userID,
		OrganizationID: organizationID,
		Fingerprint:    fingerprint,
	})
	if lookupErr == nil {
		return existing, false, nil
	}
	return database.WorkspaceSshKey{}, false, err
}

func canonicalWorkspaceSSHPublicKey(value string) (key ssh.PublicKey, canonical, fingerprint string, err error) {
	key, _, _, rest, err := ssh.ParseAuthorizedKey([]byte(value))
	if err != nil || len(strings.TrimSpace(string(rest))) != 0 {
		return nil, "", "", xerrors.New("public key must be one valid OpenSSH public key")
	}
	if key.Type() != ssh.KeyAlgoED25519 {
		return nil, "", "", xerrors.New("public key must be Ed25519")
	}
	canonical = strings.TrimSpace(string(ssh.MarshalAuthorizedKey(key)))
	fingerprint = ssh.FingerprintSHA256(key)
	return key, canonical, fingerprint, nil
}

func workspaceSSHKey(key database.WorkspaceSshKey) codersdk.WorkspaceSSHKey {
	var lastUsedAt *time.Time
	if key.LastUsedAt.Valid {
		lastUsedAt = &key.LastUsedAt.Time
	}
	return codersdk.WorkspaceSSHKey{
		ID:             key.ID,
		UserID:         key.UserID,
		OrganizationID: key.OrganizationID,
		DeviceName:     key.DeviceName,
		PublicKey:      key.PublicKey,
		Fingerprint:    key.Fingerprint,
		CreatedAt:      key.CreatedAt,
		LastUsedAt:     lastUsedAt,
	}
}

func readWorkspaceSSHEnrollmentRequest(ctx context.Context, rw http.ResponseWriter, r *http.Request) (codersdk.EnrollWorkspaceSSHKeyRequest, bool) {
	var request codersdk.EnrollWorkspaceSSHKeyRequest
	if strings.HasPrefix(r.Header.Get("Content-Type"), "application/x-www-form-urlencoded") {
		if err := r.ParseForm(); err != nil {
			httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "Invalid enrollment form."})
			return request, false
		}
		request.DeviceName = r.FormValue("device_name")
		request.PublicKey = r.FormValue("public_key")
		return request, true
	}
	return request, httpapi.Read(ctx, rw, r, &request)
}

func writeWorkspaceSSHKeyError(ctx context.Context, rw http.ResponseWriter, err error) {
	switch {
	case database.IsUniqueViolation(err, database.UniqueWorkspaceSshKeysOrganizationIDFingerprintKey):
		httpapi.Write(ctx, rw, http.StatusConflict, codersdk.Response{Message: "This SSH key is already registered in the organization."})
	case strings.Contains(err.Error(), "public key must be one valid OpenSSH public key"):
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "public key must be one valid OpenSSH public key"})
	case strings.Contains(err.Error(), "public key must be Ed25519"):
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "public key must be Ed25519"})
	case strings.Contains(err.Error(), "device name must contain between 1 and 255 characters"):
		httpapi.Write(ctx, rw, http.StatusBadRequest, codersdk.Response{Message: "device name must contain between 1 and 255 characters"})
	default:
		httpapi.InternalServerError(rw, err)
	}
}

func powershellQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}

func (api *API) workspaceSSHBashScript(registrationURL, token, locale string, target workspaceSSHDesktopTarget) string {
	gateway := api.workspaceSSHGatewayInfo()
	deploymentMarker := "CODER CHATGPT DESKTOP " + api.DeploymentID
	marker := deploymentMarker + " " + target.Alias
	keyName := "coder_chatgpt_ed25519_" + api.DeploymentID
	knownHostsName := "coder_chatgpt_known_hosts_" + api.DeploymentID
	knownHost := gateway.Host
	if gateway.Port != 22 {
		knownHost = fmt.Sprintf("[%s]:%d", gateway.Host, gateway.Port)
	}
	fallbackMessage := "Open ChatGPT Desktop Connections and add SSH host %s with project path %s\n"
	if locale == string(i18n.LocaleSimplifiedChinese) {
		fallbackMessage = "请打开 ChatGPT Desktop 的连接设置，添加 SSH 主机 %s，并将项目路径设为 %s\n"
	}
	return fmt.Sprintf(`#!/usr/bin/env bash
set -euo pipefail
ssh_dir="${HOME}/.ssh"
key_file="${ssh_dir}/%s"
known_hosts_file="${ssh_dir}/%s"
config_file="${ssh_dir}/config"
mkdir -p "${ssh_dir}"
chmod 700 "${ssh_dir}"
if [[ ! -f "${key_file}" ]]; then
  ssh-keygen -q -t ed25519 -N '' -C 'Coder ChatGPT Desktop' -f "${key_file}"
fi
chmod 600 "${key_file}"
chmod 644 "${key_file}.pub"
printf '%%s %%s\n' %s %s >"${known_hosts_file}"
chmod 600 "${known_hosts_file}"
begin=%s
end=%s
deployment_begin=%s
deployment_end=%s
touch "${config_file}"
tmp_file="$(mktemp "${ssh_dir}/config.XXXXXX")"
cat >"${tmp_file}" <<'CODER_SSH_CONFIG'
%s
Host %s
  HostName %s
  Port %d
  User %s
  ProxyCommand none
  IdentityFile ~/.ssh/%s
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  UserKnownHostsFile ~/.ssh/%s
%s
CODER_SSH_CONFIG
awk -v begin="${begin}" -v end="${end}" -v deployment_begin="${deployment_begin}" -v deployment_end="${deployment_end}" '
  $0 == begin || $0 == deployment_begin { skip=1; next }
  $0 == end || $0 == deployment_end { skip=0; next }
  !skip { print }
' "${config_file}" >>"${tmp_file}"
mv "${tmp_file}" "${config_file}"
chmod 600 "${config_file}"
curl -fsS -X POST -H 'Content-Type: application/x-www-form-urlencoded' -H %s \
  --data-urlencode "device_name=$(hostname)" \
  --data-urlencode "public_key@${key_file}.pub" \
  %s >/dev/null
deep_link=%s
if command -v open >/dev/null 2>&1; then
  open "${deep_link}"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${deep_link}" >/dev/null 2>&1 &
else
  printf %s %s %s
fi
`, keyName, knownHostsName, shellquote.Join(knownHost), shellquote.Join(gateway.HostPublicKey), shellquote.Join("# BEGIN "+marker), shellquote.Join("# END "+marker), shellquote.Join("# BEGIN "+deploymentMarker), shellquote.Join("# END "+deploymentMarker), "# BEGIN "+marker, target.Alias, gateway.Host, gateway.Port, target.Alias, keyName, knownHostsName, "# END "+marker, shellquote.Join("Authorization: Bearer "+token), shellquote.Join(registrationURL), shellquote.Join(target.DeepLink), shellquote.Join(fallbackMessage), shellquote.Join(target.Alias), shellquote.Join(target.ProjectPath))
}

func (api *API) workspaceSSHPowerShellScript(registrationURL, token, locale string, target workspaceSSHDesktopTarget) string {
	gateway := api.workspaceSSHGatewayInfo()
	deploymentMarker := "CODER CHATGPT DESKTOP " + api.DeploymentID
	marker := deploymentMarker + " " + target.Alias
	keyName := "coder_chatgpt_ed25519_" + api.DeploymentID
	knownHostsName := "coder_chatgpt_known_hosts_" + api.DeploymentID
	knownHost := gateway.Host
	if gateway.Port != 22 {
		knownHost = fmt.Sprintf("[%s]:%d", gateway.Host, gateway.Port)
	}
	keygenError := "ssh-keygen failed"
	launchError := "ChatGPT Desktop could not be opened. Open Connections and add the SSH host manually."
	if locale == string(i18n.LocaleSimplifiedChinese) {
		keygenError = "ssh-keygen 执行失败"
		launchError = "无法打开 ChatGPT Desktop。请打开连接设置并手动添加 SSH 主机。"
	}
	return fmt.Sprintf(`$ErrorActionPreference = 'Stop'
$sshDir = Join-Path $HOME '.ssh'
$keyFile = Join-Path $sshDir %s
$knownHostsFile = Join-Path $sshDir %s
$configFile = Join-Path $sshDir 'config'
New-Item -ItemType Directory -Force -Path $sshDir | Out-Null
if (-not (Test-Path $keyFile)) {
  & ssh-keygen -q -t ed25519 -N '""' -C 'Coder ChatGPT Desktop' -f $keyFile
  if ($LASTEXITCODE -ne 0) { throw %s }
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($knownHostsFile, %s + ' ' + %s + [Environment]::NewLine, $utf8)
$begin = %s
$end = %s
$deploymentBegin = %s
$deploymentEnd = %s
$lines = if (Test-Path $configFile) { [IO.File]::ReadAllLines($configFile) } else { @() }
$kept = New-Object System.Collections.Generic.List[string]
$skip = $false
foreach ($line in $lines) {
  if ($line -eq $begin -or $line -eq $deploymentBegin) { $skip = $true; continue }
  if ($line -eq $end -or $line -eq $deploymentEnd) { $skip = $false; continue }
  if (-not $skip) { $kept.Add($line) }
}
$block = @(
  $begin,
  %s,
  %s,
  %s,
  %s,
  '  ProxyCommand none',
  %s,
  '  IdentitiesOnly yes',
  '  StrictHostKeyChecking yes',
  %s,
  $end
)
[IO.File]::WriteAllLines($configFile, @($block) + @($kept), $utf8)
$body = @{
  device_name = [Environment]::MachineName
  public_key = [IO.File]::ReadAllText($keyFile + '.pub')
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri %s -Headers @{ Authorization = %s } -ContentType 'application/json' -Body $body | Out-Null
try {
  Start-Process %s
} catch {
  Write-Error %s
}
`, powershellQuote(keyName), powershellQuote(knownHostsName), powershellQuote(keygenError), powershellQuote(knownHost), powershellQuote(gateway.HostPublicKey), powershellQuote("# BEGIN "+marker), powershellQuote("# END "+marker), powershellQuote("# BEGIN "+deploymentMarker), powershellQuote("# END "+deploymentMarker), powershellQuote("Host "+target.Alias), powershellQuote("  HostName "+gateway.Host), powershellQuote(fmt.Sprintf("  Port %d", gateway.Port)), powershellQuote("  User "+target.Alias), powershellQuote("  IdentityFile ~/.ssh/"+keyName), powershellQuote("  UserKnownHostsFile ~/.ssh/"+knownHostsName), powershellQuote(registrationURL), powershellQuote("Bearer "+token), powershellQuote(target.DeepLink), powershellQuote(launchError))
}
