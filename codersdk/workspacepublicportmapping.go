package codersdk

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// WorkspacePublicPortMapping describes an explicitly public workspace service.
type WorkspacePublicPortMapping struct {
	ID               uuid.UUID `json:"id" format:"uuid"`
	OrganizationID   uuid.UUID `json:"organization_id" format:"uuid"`
	WorkspaceID      uuid.UUID `json:"workspace_id" format:"uuid"`
	WorkspaceAgentID uuid.UUID `json:"workspace_agent_id" format:"uuid"`
	AgentName        string    `json:"agent_name"`
	RemotePort       int32     `json:"remote_port"`
	PublicPort       int32     `json:"public_port"`
	Protocol         string    `json:"protocol" enums:"http,https"`
	URL              string    `json:"url"`
	CreatedBy        uuid.UUID `json:"created_by" format:"uuid"`
	ShareLevel       string    `json:"share_level" enums:"public"`
	State            string    `json:"state" enums:"ready,unavailable,proxy_error,ingress_error,disabled"`
	CreatedAt        time.Time `json:"created_at" format:"date-time"`
	UpdatedAt        time.Time `json:"updated_at" format:"date-time"`
}

// WorkspacePublicPortMappings includes deployment availability and saved shares.
type WorkspacePublicPortMappings struct {
	Enabled  bool                         `json:"enabled"`
	Mappings []WorkspacePublicPortMapping `json:"mappings"`
}

// CreateWorkspacePublicPortMappingRequest requires explicit public consent.
type CreateWorkspacePublicPortMappingRequest struct {
	AgentName  string `json:"agent_name"`
	RemotePort int32  `json:"remote_port"`
	Protocol   string `json:"protocol" enums:"http,https"`
	ShareLevel string `json:"share_level" enums:"public"`
}

// GetWorkspacePublicPortMappings lists saved public shares for a workspace.
func (c *Client) GetWorkspacePublicPortMappings(ctx context.Context, workspaceID uuid.UUID) (WorkspacePublicPortMappings, error) {
	var out WorkspacePublicPortMappings
	res, err := c.Request(ctx, http.MethodGet, fmt.Sprintf("/api/v2/workspaces/%s/public-port-mappings", workspaceID), nil)
	if err != nil {
		return out, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return out, ReadBodyAsError(res)
	}
	err = ReadBodyAsJSON(res, &out)
	return out, err
}

// CreateWorkspacePublicPortMapping allocates a public port after explicit consent.
func (c *Client) CreateWorkspacePublicPortMapping(ctx context.Context, workspaceID uuid.UUID, req CreateWorkspacePublicPortMappingRequest) (WorkspacePublicPortMapping, error) {
	var out WorkspacePublicPortMapping
	res, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/api/v2/workspaces/%s/public-port-mappings", workspaceID), req)
	if err != nil {
		return out, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return out, ReadBodyAsError(res)
	}
	err = ReadBodyAsJSON(res, &out)
	return out, err
}

// DeleteWorkspacePublicPortMapping revokes a public share and its connections.
func (c *Client) DeleteWorkspacePublicPortMapping(ctx context.Context, workspaceID, mappingID uuid.UUID) error {
	res, err := c.Request(ctx, http.MethodDelete, fmt.Sprintf("/api/v2/workspaces/%s/public-port-mappings/%s", workspaceID, mappingID), nil)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return ReadBodyAsError(res)
	}
	return nil
}
