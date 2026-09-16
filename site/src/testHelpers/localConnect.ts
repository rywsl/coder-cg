import type {
	LocalConnector,
	LocalConnectorEnrollment,
} from "#/api/typesGenerated";
import { MockWorkspace, MockWorkspaceAgentReady } from "./entities";

export const MockLocalConnectorEnrollment: LocalConnectorEnrollment = {
	enrollment_id: "44bc3fae-5ad8-42df-a4e8-40f0e21a3e54",
	token: "example-one-time-code",
	expires_at: "2099-01-01T00:00:00Z",
};

export const MockLocalConnector: LocalConnector = {
	id: "dc7d2472-21bd-4b1d-8b85-199ebf1e5a86",
	organization_id: MockWorkspace.organization_id,
	workspace_ssh_key_id: "af6abc8f-55fd-4231-9b87-8cdb9cf937ad",
	name: "开发电脑",
	revision: 1,
	online: true,
	desired: [
		{
			workspace_id: MockWorkspace.id,
			agent_name: MockWorkspaceAgentReady.name,
			automatic: true,
			ports: [],
		},
	],
	reported: [
		{
			workspace_id: MockWorkspace.id,
			agent_name: MockWorkspaceAgentReady.name,
			remote_port: 5173,
			local_port: 5174,
			protocol: "http",
			error_code: "",
		},
	],
};
