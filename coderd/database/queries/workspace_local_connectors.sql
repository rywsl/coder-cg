-- name: InsertWorkspaceLocalConnector :one
INSERT INTO workspace_local_connectors (id, organization_id, user_id, workspace_ssh_key_id, token_hash, name)
VALUES (@id, @organization_id, @user_id, @workspace_ssh_key_id, @token_hash, @name)
RETURNING *;

-- name: GetWorkspaceLocalConnectorByID :one
SELECT * FROM workspace_local_connectors WHERE id = @id;

-- name: GetWorkspaceLocalConnectorsByOwner :many
SELECT * FROM workspace_local_connectors WHERE user_id = @user_id AND organization_id = @organization_id ORDER BY created_at;

-- name: UpdateWorkspaceLocalConnectorDesired :one
UPDATE workspace_local_connectors SET desired = @desired, revision = revision + 1, reported = '[]'::jsonb
WHERE id = @id AND revision = @revision RETURNING *;

-- name: UpdateWorkspaceLocalConnectorReported :one
UPDATE workspace_local_connectors
SET reported = CASE WHEN revision = @reported_revision THEN @reported::jsonb ELSE '[]'::jsonb END,
    last_seen_at = @last_seen_at
WHERE id = @id RETURNING *;
