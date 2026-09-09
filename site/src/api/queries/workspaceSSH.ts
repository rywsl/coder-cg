import type { QueryClient } from "react-query";
import { API } from "#/api/api";

export const workspaceSSHKeysQueryKey = (organization: string) => [
	"organization",
	organization,
	"workspaceSSHKeys",
];

export const workspaceSSHKeys = (organization: string, enabled = true) => ({
	queryKey: workspaceSSHKeysQueryKey(organization),
	queryFn: () => API.getWorkspaceSSHKeys(organization),
	enabled,
});

export const deleteWorkspaceSSHKey = (
	queryClient: QueryClient,
	organization: string,
) => ({
	mutationFn: (keyID: string) => API.deleteWorkspaceSSHKey(organization, keyID),
	onSuccess: async () => {
		await queryClient.invalidateQueries({
			queryKey: workspaceSSHKeysQueryKey(organization),
		});
	},
});

export const createWorkspaceSSHBootstrap = (agentID: string) => ({
	mutationFn: () => API.createWorkspaceSSHBootstrap(agentID),
});

const workspaceSSHEnrollmentStatusQueryKey = (enrollmentID: string) => [
	"workspaceSSHEnrollment",
	enrollmentID,
];

export const workspaceSSHEnrollmentStatus = (
	enrollmentID: string,
	enabled: boolean,
	refetchInterval: number,
) => ({
	queryKey: workspaceSSHEnrollmentStatusQueryKey(enrollmentID),
	queryFn: () => API.getWorkspaceSSHEnrollmentStatus(enrollmentID),
	enabled,
	refetchInterval,
});
