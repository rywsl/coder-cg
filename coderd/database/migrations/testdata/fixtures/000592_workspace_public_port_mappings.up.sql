INSERT INTO workspace_public_port_mappings (
    id, organization_id, workspace_id, workspace_agent_id, agent_name,
    remote_port, public_port, protocol, created_by
)
SELECT
    '59200001-0000-4000-8000-000000000001',
    w.organization_id, w.id, a.id, a.name, 5173, 18000, 'http', w.owner_id
FROM workspaces w
JOIN workspace_builds b ON b.workspace_id = w.id
JOIN workspace_resources r ON r.job_id = b.job_id
JOIN workspace_agents a ON a.resource_id = r.id
ORDER BY w.id, b.build_number DESC, a.id
LIMIT 1;
