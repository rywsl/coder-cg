package codersdk

import (
	"time"

	"github.com/google/uuid"
)

// LocalConnectorRelease lists reproducible platform artifacts and checksums.
type LocalConnectorRelease struct {
	Version   string                   `json:"version"`
	Artifacts []LocalConnectorArtifact `json:"artifacts"`
}

// LocalConnectorArtifact describes an HTTPS-downloadable executable.
type LocalConnectorArtifact struct {
	OS     string `json:"os"`
	Arch   string `json:"arch"`
	Name   string `json:"name"`
	SHA256 string `json:"sha256"`
}

// LocalConnector identifies an organization-scoped local device, without secrets.
type LocalConnector struct {
	ID                uuid.UUID                 `json:"id" format:"uuid"`
	OrganizationID    uuid.UUID                 `json:"organization_id" format:"uuid"`
	WorkspaceSSHKeyID uuid.UUID                 `json:"workspace_ssh_key_id" format:"uuid"`
	Name              string                    `json:"name"`
	Revision          int64                     `json:"revision"`
	Online            bool                      `json:"online"`
	Desired           []LocalConnectorWorkspace `json:"desired"`
	Reported          []LocalConnectorPort      `json:"reported"`
}

// LocalConnectorWorkspace selects an agent by stable workspace ID and agent name.
type LocalConnectorWorkspace struct {
	WorkspaceID uuid.UUID `json:"workspace_id" format:"uuid"`
	AgentName   string    `json:"agent_name"`
	Automatic   bool      `json:"automatic"`
	Ports       []uint16  `json:"ports"`
}

// LocalConnectorPort describes a reported loopback mapping.
type LocalConnectorPort struct {
	WorkspaceID uuid.UUID `json:"workspace_id" format:"uuid"`
	AgentName   string    `json:"agent_name"`
	RemotePort  uint16    `json:"remote_port"`
	LocalPort   uint16    `json:"local_port"`
	Protocol    string    `json:"protocol" enums:"http,https,tcp"`
	ErrorCode   string    `json:"error_code"`
}

// LocalConnectorUpdate uses optimistic concurrency to preserve other workspaces.
type LocalConnectorUpdate struct {
	Revision int64                     `json:"revision"`
	Desired  []LocalConnectorWorkspace `json:"desired"`
}

// LocalConnectorEnrollment is entered interactively, never passed in argv or URLs.
type LocalConnectorEnrollment struct {
	EnrollmentID uuid.UUID `json:"enrollment_id" format:"uuid"`
	Token        string    `json:"token"`
	ExpiresAt    time.Time `json:"expires_at" format:"date-time"`
}

// LocalConnectorRegister registers a device using an existing one-time enrollment.
type LocalConnectorRegister struct {
	PublicKey  string `json:"public_key"`
	DeviceName string `json:"device_name"`
	Token      string `json:"token"`
}

// LocalConnectorRegistration pins the host key as part of device authorization.
type LocalConnectorRegistration struct {
	Device  LocalConnector          `json:"device"`
	Gateway WorkspaceSSHGatewayInfo `json:"gateway"`
}

// LocalConnectorSyncRequest contains bounded status, not arbitrary local URLs.
type LocalConnectorSyncRequest struct {
	Revision int64                `json:"revision"`
	Reported []LocalConnectorPort `json:"reported"`
}

// LocalConnectorTarget describes one currently authorized and ready agent.
type LocalConnectorTarget struct {
	LocalConnectorWorkspace
	AgentID    uuid.UUID `json:"agent_id" format:"uuid"`
	Alias      string    `json:"alias"`
	Candidates []uint16  `json:"candidates"`
}

// LocalConnectorSync is a renewable authorization lease for local forwarding.
type LocalConnectorSync struct {
	Revision     int64                   `json:"revision"`
	Gateway      WorkspaceSSHGatewayInfo `json:"gateway"`
	Targets      []LocalConnectorTarget  `json:"targets"`
	LeaseSeconds int                     `json:"lease_seconds"`
}
