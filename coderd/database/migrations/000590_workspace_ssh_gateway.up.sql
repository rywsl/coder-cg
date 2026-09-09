ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'workspace_ssh_key';

CREATE TABLE workspace_ssh_keys (
	id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	device_name text NOT NULL CHECK (length(device_name) BETWEEN 1 AND 255),
	public_key text NOT NULL,
	fingerprint text NOT NULL,
	created_at timestamptz NOT NULL,
	last_used_at timestamptz,
	CONSTRAINT workspace_ssh_keys_organization_id_fingerprint_key
		UNIQUE (organization_id, fingerprint)
);

CREATE INDEX workspace_ssh_keys_user_organization_idx
	ON workspace_ssh_keys (user_id, organization_id);

CREATE TABLE workspace_ssh_key_enrollments (
	id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
	token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	workspace_agent_id uuid NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
	locale text NOT NULL CHECK (locale IN ('en', 'zh-CN')),
	created_at timestamptz NOT NULL,
	expires_at timestamptz NOT NULL CHECK (expires_at > created_at),
	consumed_at timestamptz,
	workspace_ssh_key_id uuid,
	CONSTRAINT workspace_ssh_key_enrollments_consumption_check CHECK (
		(consumed_at IS NULL AND workspace_ssh_key_id IS NULL)
		OR (consumed_at IS NOT NULL AND workspace_ssh_key_id IS NOT NULL)
	)
);

CREATE INDEX workspace_ssh_key_enrollments_expires_at_idx
	ON workspace_ssh_key_enrollments (expires_at);
