-- name: InsertWorkspaceSSHKey :one
INSERT INTO workspace_ssh_keys (
	id,
	user_id,
	organization_id,
	device_name,
	public_key,
	fingerprint,
	created_at
) VALUES (
	@id,
	@user_id,
	@organization_id,
	@device_name,
	@public_key,
	@fingerprint,
	@created_at
)
RETURNING *;

-- name: GetWorkspaceSSHKeyByOrganizationAndFingerprint :one
SELECT *
FROM workspace_ssh_keys
WHERE organization_id = @organization_id
	AND fingerprint = @fingerprint;

-- name: GetWorkspaceSSHKeyByUserOrganizationAndFingerprint :one
SELECT *
FROM workspace_ssh_keys
WHERE user_id = @user_id
	AND organization_id = @organization_id
	AND fingerprint = @fingerprint;

-- name: GetWorkspaceSSHKeyByID :one
SELECT *
FROM workspace_ssh_keys
WHERE id = @id;

-- name: GetWorkspaceSSHKeysByUserAndOrganization :many
SELECT *
FROM workspace_ssh_keys
WHERE user_id = @user_id
	AND organization_id = @organization_id
ORDER BY created_at DESC;

-- name: DeleteWorkspaceSSHKeyByID :one
DELETE FROM workspace_ssh_keys
WHERE id = @id
	AND user_id = @user_id
	AND organization_id = @organization_id
RETURNING *;

-- name: UpdateWorkspaceSSHKeyLastUsedAt :exec
UPDATE workspace_ssh_keys
SET last_used_at = @last_used_at
WHERE id = @id;

-- name: InsertWorkspaceSSHKeyEnrollment :one
INSERT INTO workspace_ssh_key_enrollments (
	id,
	token_hash,
	user_id,
	organization_id,
	workspace_agent_id,
	locale,
	created_at,
	expires_at
) VALUES (
	@id,
	@token_hash,
	@user_id,
	@organization_id,
	@workspace_agent_id,
	@locale,
	@created_at,
	@expires_at
)
RETURNING *;

-- name: GetWorkspaceSSHKeyEnrollmentForUpdate :one
SELECT *
FROM workspace_ssh_key_enrollments
WHERE id = @id
	AND token_hash = @token_hash
	AND consumed_at IS NULL
	AND expires_at > @now
FOR UPDATE;

-- name: CompleteWorkspaceSSHKeyEnrollment :one
UPDATE workspace_ssh_key_enrollments
SET
	consumed_at = @consumed_at,
	workspace_ssh_key_id = @workspace_ssh_key_id
WHERE id = @id
	AND consumed_at IS NULL
RETURNING *;

-- name: GetWorkspaceSSHKeyEnrollmentByID :one
SELECT *
FROM workspace_ssh_key_enrollments
WHERE id = @id;

-- name: DeleteExpiredWorkspaceSSHKeyEnrollments :exec
DELETE FROM workspace_ssh_key_enrollments
WHERE expires_at <= @now;

-- name: GetWorkspaceSSHGatewayTarget :one
SELECT
	sqlc.embed(workspaces),
	sqlc.embed(workspace_agents),
	users.username AS owner_username,
	latest_workspace_build.build_number AS latest_build_number,
	latest_workspace_build.transition AS latest_build_transition,
	target_agent.build_number AS agent_build_number
FROM workspaces
JOIN users ON users.id = workspaces.owner_id
JOIN workspace_builds AS latest_workspace_build ON latest_workspace_build.workspace_id = workspaces.id
	AND latest_workspace_build.build_number = (
		SELECT MAX(latest_build.build_number)
		FROM workspace_builds AS latest_build
		WHERE latest_build.workspace_id = workspaces.id
	)
JOIN LATERAL (
	SELECT
		workspace_agents.id,
		agent_build.build_number
	FROM workspace_builds AS agent_build
	JOIN workspace_resources ON workspace_resources.job_id = agent_build.job_id
	JOIN workspace_agents ON workspace_agents.resource_id = workspace_resources.id
	WHERE agent_build.workspace_id = workspaces.id
		AND LOWER(workspace_agents.name) = LOWER(@agent_name)
		AND workspace_agents.deleted = FALSE
	ORDER BY agent_build.build_number DESC
	LIMIT 1
) AS target_agent ON TRUE
JOIN workspace_agents ON workspace_agents.id = target_agent.id
WHERE LOWER(users.username) = LOWER(@owner_username)
	AND LOWER(workspaces.name) = LOWER(@workspace_name)
	AND workspaces.deleted = FALSE
	AND users.deleted = FALSE;

-- name: GetWorkspaceSSHBootstrapTargetByAgentID :one
SELECT
	sqlc.embed(workspace_agents),
	sqlc.embed(workspaces),
	users.username AS owner_username
FROM workspace_agents
JOIN workspace_resources ON workspace_agents.resource_id = workspace_resources.id
JOIN provisioner_jobs ON workspace_resources.job_id = provisioner_jobs.id
JOIN workspace_builds ON provisioner_jobs.id = workspace_builds.job_id
JOIN workspaces ON workspace_builds.workspace_id = workspaces.id
JOIN users ON workspaces.owner_id = users.id
WHERE workspace_agents.id = @id
	AND workspace_agents.deleted = FALSE
	AND provisioner_jobs.type = 'workspace_build'::provisioner_job_type
	AND workspaces.deleted = FALSE
	AND users.deleted = FALSE
LIMIT 1;
