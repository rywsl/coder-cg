CREATE TABLE workspace_local_connectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_ssh_key_id uuid NOT NULL UNIQUE REFERENCES workspace_ssh_keys(id) ON DELETE CASCADE,
    token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
    name text NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
    desired jsonb NOT NULL DEFAULT '[]'::jsonb,
    revision bigint NOT NULL DEFAULT 1,
    reported jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at timestamptz
);
CREATE INDEX workspace_local_connectors_owner ON workspace_local_connectors(user_id, organization_id);
