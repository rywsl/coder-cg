-- name: ListWorkspacePublicPortMappings :many
SELECT * FROM workspace_public_port_mappings
WHERE workspace_id = $1
ORDER BY public_port;

-- name: GetWorkspacePublicPortMapping :one
SELECT * FROM workspace_public_port_mappings WHERE id = $1;

-- name: GetWorkspacePublicPortMappingByPublicPort :one
SELECT * FROM workspace_public_port_mappings WHERE public_port = $1;

-- name: GetWorkspacePublicPortMappingByWorkspaceAgentPort :one
SELECT * FROM workspace_public_port_mappings
WHERE workspace_id = $1 AND agent_name = $2 AND remote_port = $3;

-- name: ListWorkspacePublicPortMappingsAll :many
SELECT * FROM workspace_public_port_mappings ORDER BY public_port;

-- name: InsertWorkspacePublicPortMapping :one
INSERT INTO workspace_public_port_mappings (
    organization_id, workspace_id, workspace_agent_id, agent_name,
    remote_port, public_port, protocol, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: DeleteWorkspacePublicPortMapping :exec
DELETE FROM workspace_public_port_mappings WHERE id = $1;
