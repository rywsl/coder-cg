import { API } from "#/api/api";
import type {
	DeleteWorkspaceAgentPortShareRequest,
	UpsertWorkspaceAgentPortShareRequest,
} from "#/api/typesGenerated";

export const workspacePortShares = (workspaceId: string) => {
	return {
		queryKey: ["sharedPorts", workspaceId],
		queryFn: () => API.getWorkspaceAgentSharedPorts(workspaceId),
	};
};

export const upsertWorkspacePortShare = (workspaceId: string) => {
	return {
		mutationFn: async (options: UpsertWorkspaceAgentPortShareRequest) => {
			await API.upsertWorkspaceAgentSharedPort(workspaceId, options);
		},
	};
};

export const deleteWorkspacePortShare = (workspaceId: string) => {
	return {
		mutationFn: async (options: DeleteWorkspaceAgentPortShareRequest) => {
			await API.deleteWorkspaceAgentSharedPort(workspaceId, options);
		},
	};
};

export const workspacePublicPortMappings = (workspaceId: string) => ({
	queryKey: ["publicPortMappings", workspaceId],
	queryFn: () => API.getWorkspacePublicPortMappings(workspaceId),
});

export const createWorkspacePublicPortMapping = (workspaceId: string) => ({
	mutationFn: (
		options: import("#/api/typesGenerated").CreateWorkspacePublicPortMappingRequest,
	) => API.createWorkspacePublicPortMapping(workspaceId, options),
});

export const deleteWorkspacePublicPortMapping = (workspaceId: string) => ({
	mutationFn: (mappingId: string) =>
		API.deleteWorkspacePublicPortMapping(workspaceId, mappingId),
});
