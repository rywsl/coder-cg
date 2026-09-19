import type { WorkspacePublicPortMapping } from "#/api/typesGenerated";
import { MockWorkspace, MockWorkspaceAgentReady } from "./entities";

export const MockPublicPortMapping: WorkspacePublicPortMapping = {
	id: "680f3cfe-8aad-4ed4-857d-fba98c4c6ad0",
	organization_id: MockWorkspace.organization_id,
	workspace_id: MockWorkspace.id,
	workspace_agent_id: MockWorkspaceAgentReady.id,
	agent_name: MockWorkspaceAgentReady.name,
	remote_port: 5173,
	public_port: 18000,
	protocol: "http",
	url: "https://212.64.22.217:18000",
	share_level: "public",
	state: "ready",
	created_by: MockWorkspace.owner_id,
	created_at: "2026-09-19T00:00:00Z",
	updated_at: "2026-09-19T00:00:00Z",
};
