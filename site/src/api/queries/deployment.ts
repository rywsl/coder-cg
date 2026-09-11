import type { QueryClient } from "react-query";
import { API } from "#/api/api";
import type { UpdateWorkspaceSSHGatewayRequest } from "#/api/typesGenerated";
import { disabledRefetchOptions } from "./util";

export const deploymentConfigQueryKey = ["deployment", "config"];

export const deploymentConfig = () => {
	return {
		queryKey: deploymentConfigQueryKey,
		queryFn: API.getDeploymentConfig,
		staleTime: Number.POSITIVE_INFINITY,
	};
};

export const deploymentDAUs = () => {
	return {
		queryKey: ["deployment", "daus"],
		queryFn: () => API.getDeploymentDAUs(),
	};
};

export const deploymentStatsQueryKey = ["deployment", "stats"];

export const deploymentStats = () => {
	return {
		queryKey: deploymentStatsQueryKey,
		queryFn: API.getDeploymentStats,
	};
};

export const deploymentSSHConfigQueryKey = ["deployment", "sshConfig"];

export const deploymentSSHConfig = () => {
	return {
		...disabledRefetchOptions,
		queryKey: deploymentSSHConfigQueryKey,
		queryFn: API.getDeploymentSSHConfig,
	};
};

const workspaceSSHGatewayQueryKey = ["deployment", "workspaceSSHGateway"];

export const workspaceSSHGateway = () => ({
	queryKey: workspaceSSHGatewayQueryKey,
	queryFn: API.getWorkspaceSSHGateway,
	refetchInterval: 5000,
});

const refreshWorkspaceSSHGateway = (queryClient: QueryClient) =>
	Promise.all([
		queryClient.invalidateQueries({ queryKey: workspaceSSHGatewayQueryKey }),
		queryClient.invalidateQueries({ queryKey: deploymentSSHConfigQueryKey }),
	]);

export const updateWorkspaceSSHGateway = (queryClient: QueryClient) => ({
	onSettled: () => refreshWorkspaceSSHGateway(queryClient),
	mutationFn: (request: UpdateWorkspaceSSHGatewayRequest) =>
		API.updateWorkspaceSSHGateway(request),
	onSuccess: (
		status: Awaited<ReturnType<typeof API.updateWorkspaceSSHGateway>>,
	) => {
		queryClient.setQueryData(workspaceSSHGatewayQueryKey, status);
	},
});

export const startWorkspaceSSHGateway = (queryClient: QueryClient) => ({
	onSettled: () => refreshWorkspaceSSHGateway(queryClient),
	mutationFn: API.startWorkspaceSSHGateway,
	onSuccess: (
		status: Awaited<ReturnType<typeof API.startWorkspaceSSHGateway>>,
	) => {
		queryClient.setQueryData(workspaceSSHGatewayQueryKey, status);
	},
});

export const stopWorkspaceSSHGateway = (queryClient: QueryClient) => ({
	onSettled: () => refreshWorkspaceSSHGateway(queryClient),
	mutationFn: API.stopWorkspaceSSHGateway,
	onSuccess: (
		status: Awaited<ReturnType<typeof API.stopWorkspaceSSHGateway>>,
	) => {
		queryClient.setQueryData(workspaceSSHGatewayQueryKey, status);
	},
});

export const deploymentIdpSyncFieldValues = (field: string) => {
	return {
		queryKey: ["deployment", "idpSync", "fieldValues", field],
		queryFn: () => API.getDeploymentIdpSyncFieldValues(field),
	};
};
