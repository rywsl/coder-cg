package codersdk

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
)

// WorkspaceSSHKey is a public key registered for the workspace SSH gateway.
type WorkspaceSSHKey struct {
	ID             uuid.UUID  `json:"id" format:"uuid"`
	UserID         uuid.UUID  `json:"user_id" format:"uuid"`
	OrganizationID uuid.UUID  `json:"organization_id" format:"uuid"`
	DeviceName     string     `json:"device_name"`
	PublicKey      string     `json:"public_key"`
	Fingerprint    string     `json:"fingerprint"`
	CreatedAt      time.Time  `json:"created_at" format:"date-time"`
	LastUsedAt     *time.Time `json:"last_used_at,omitempty" format:"date-time"`
}

// CreateWorkspaceSSHKeyRequest registers a device public key.
type CreateWorkspaceSSHKeyRequest struct {
	DeviceName string `json:"device_name" validate:"required,max=255"`
	PublicKey  string `json:"public_key" validate:"required"`
}

// WorkspaceSSHBootstrapResponse contains one-time setup commands and the
// resulting ChatGPT Desktop workspace target.
type WorkspaceSSHBootstrapResponse struct {
	EnrollmentID      uuid.UUID `json:"enrollment_id" format:"uuid"`
	BashCommand       string    `json:"bash_command"`
	PowerShellCommand string    `json:"powershell_command"`
	Alias             string    `json:"alias"`
	ProjectPath       string    `json:"project_path"`
	DeepLink          string    `json:"deep_link"`
	ExpiresAt         time.Time `json:"expires_at" format:"date-time"`
}

// WorkspaceSSHEnrollmentStatus is the lifecycle state of an enrollment.
type WorkspaceSSHEnrollmentStatus string

const (
	WorkspaceSSHEnrollmentStatusPending  WorkspaceSSHEnrollmentStatus = "pending"
	WorkspaceSSHEnrollmentStatusComplete WorkspaceSSHEnrollmentStatus = "complete"
	WorkspaceSSHEnrollmentStatusExpired  WorkspaceSSHEnrollmentStatus = "expired"
)

// WorkspaceSSHEnrollmentStatusResponse reports the key created by one setup
// attempt without exposing its enrollment credential.
type WorkspaceSSHEnrollmentStatusResponse struct {
	EnrollmentID      uuid.UUID                    `json:"enrollment_id" format:"uuid"`
	Status            WorkspaceSSHEnrollmentStatus `json:"status"`
	WorkspaceSSHKeyID *uuid.UUID                   `json:"workspace_ssh_key_id,omitempty" format:"uuid"`
	ExpiresAt         time.Time                    `json:"expires_at" format:"date-time"`
}

// EnrollWorkspaceSSHKeyRequest completes a one-time device enrollment.
type EnrollWorkspaceSSHKeyRequest struct {
	DeviceName string `json:"device_name" validate:"required,max=255"`
	PublicKey  string `json:"public_key" validate:"required"`
}

// WorkspaceSSHEnrollmentResponse is returned after a key is enrolled.
type WorkspaceSSHEnrollmentResponse struct {
	Key         WorkspaceSSHKey `json:"key"`
	Alias       string          `json:"alias"`
	ProjectPath string          `json:"project_path"`
	DeepLink    string          `json:"deep_link"`
}

// WorkspaceSSHKeys returns the current user's keys in an organization.
func (c *Client) WorkspaceSSHKeys(ctx context.Context, organization string) ([]WorkspaceSSHKey, error) {
	res, err := c.Request(ctx, http.MethodGet, fmt.Sprintf("/api/v2/organizations/%s/workspace-ssh-keys", url.PathEscape(organization)), nil)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, ReadBodyAsError(res)
	}
	var keys []WorkspaceSSHKey
	return keys, ReadBodyAsJSON(res, &keys)
}

// CreateWorkspaceSSHKey registers a key for the current user.
func (c *Client) CreateWorkspaceSSHKey(ctx context.Context, organization string, request CreateWorkspaceSSHKeyRequest) (WorkspaceSSHKey, error) {
	res, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/api/v2/organizations/%s/workspace-ssh-keys", url.PathEscape(organization)), request)
	if err != nil {
		return WorkspaceSSHKey{}, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusCreated {
		return WorkspaceSSHKey{}, ReadBodyAsError(res)
	}
	var key WorkspaceSSHKey
	return key, ReadBodyAsJSON(res, &key)
}

// DeleteWorkspaceSSHKey revokes a key for the current user.
func (c *Client) DeleteWorkspaceSSHKey(ctx context.Context, organization string, keyID uuid.UUID) error {
	res, err := c.Request(ctx, http.MethodDelete, fmt.Sprintf("/api/v2/organizations/%s/workspace-ssh-keys/%s", url.PathEscape(organization), keyID), nil)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusNoContent {
		return ReadBodyAsError(res)
	}
	return nil
}

// WorkspaceSSHBootstrap creates a one-time setup command for an agent.
func (c *Client) WorkspaceSSHBootstrap(ctx context.Context, agentID uuid.UUID) (WorkspaceSSHBootstrapResponse, error) {
	res, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/api/v2/workspaceagents/%s/workspace-ssh-bootstrap", agentID), nil)
	if err != nil {
		return WorkspaceSSHBootstrapResponse{}, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusCreated {
		return WorkspaceSSHBootstrapResponse{}, ReadBodyAsError(res)
	}
	var response WorkspaceSSHBootstrapResponse
	return response, ReadBodyAsJSON(res, &response)
}

// WorkspaceSSHEnrollmentStatus returns the state of an enrollment created by
// the current user.
func (c *Client) WorkspaceSSHEnrollmentStatus(ctx context.Context, enrollmentID uuid.UUID) (WorkspaceSSHEnrollmentStatusResponse, error) {
	res, err := c.Request(ctx, http.MethodGet, fmt.Sprintf("/api/v2/workspace-ssh/enrollments/%s", enrollmentID), nil)
	if err != nil {
		return WorkspaceSSHEnrollmentStatusResponse{}, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return WorkspaceSSHEnrollmentStatusResponse{}, ReadBodyAsError(res)
	}
	var response WorkspaceSSHEnrollmentStatusResponse
	return response, ReadBodyAsJSON(res, &response)
}
