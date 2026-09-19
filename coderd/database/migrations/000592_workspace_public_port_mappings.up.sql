CREATE TABLE workspace_public_port_mappings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    workspace_agent_id uuid NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
    agent_name text NOT NULL,
    remote_port integer NOT NULL CHECK (remote_port BETWEEN 1 AND 65535),
    public_port integer NOT NULL UNIQUE CHECK (public_port BETWEEN 18000 AND 18099),
    protocol text NOT NULL CHECK (protocol IN ('http', 'https')),
    share_level text NOT NULL DEFAULT 'public' CHECK (share_level = 'public'),
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workspace_public_ports_workspace_agent_port_key UNIQUE (workspace_id, agent_name, remote_port)
);

CREATE INDEX workspace_public_port_mappings_workspace_idx
    ON workspace_public_port_mappings(workspace_id);
CREATE INDEX workspace_public_port_mappings_organization_idx
    ON workspace_public_port_mappings(organization_id);
