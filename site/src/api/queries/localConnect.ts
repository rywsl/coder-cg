import type { QueryClient } from "react-query";
import { API } from "#/api/api";
import { workspaceSSHKeysQueryKey } from "#/api/queries/workspaceSSH";
import type { LocalConnectorUpdate } from "#/api/typesGenerated";

export const localConnectorsKey = (organization: string) => [
	"localConnectors",
	organization,
];
export const localConnectors = (organization: string) => ({
	queryKey: localConnectorsKey(organization),
	queryFn: () => API.getLocalConnectors(organization),
	refetchInterval: 5000,
});
export const localConnectorReleaseKey = ["localConnectorRelease"];
export const localConnectorRelease = (enabled: boolean) => ({
	queryKey: localConnectorReleaseKey,
	queryFn: () => API.getLocalConnectorRelease(),
	enabled,
});
export const enrollLocalConnector = (agentID: string) => ({
	mutationFn: () => API.createLocalConnectorEnrollment(agentID),
});
export const updateLocalConnector = (
	client: QueryClient,
	organization: string,
) => ({
	mutationFn: ({ id, ...request }: LocalConnectorUpdate & { id: string }) =>
		API.updateLocalConnector(organization, id, request),
	onSettled: () =>
		client.invalidateQueries({ queryKey: localConnectorsKey(organization) }),
});
export const revokeLocalConnector = (
	client: QueryClient,
	organization: string,
) => ({
	mutationFn: (key: string) => API.deleteWorkspaceSSHKey(organization, key),
	onSettled: () =>
		Promise.all([
			client.invalidateQueries({ queryKey: localConnectorsKey(organization) }),
			client.invalidateQueries({
				queryKey: workspaceSSHKeysQueryKey(organization),
			}),
		]),
});
