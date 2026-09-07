import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import {
	setWorkspaceGroupRole,
	setWorkspaceUserRole,
	workspaceACL,
} from "#/api/queries/workspaces";
import type {
	Group,
	Workspace,
	WorkspaceGroup,
	WorkspaceRole,
	WorkspaceUser,
} from "#/api/typesGenerated";

/**
 * Encapsulates all data fetching and mutations for workspace sharing.
 * This hook manages the workspace ACL query and provides methods to
 * add, update, and remove users and groups from the workspace.
 */
export function useWorkspaceSharing(workspace: Workspace) {
	const { t: tI18n } = useTranslation("workspaces");

	const queryClient = useQueryClient();
	const [hasRemovedMember, setHasRemovedMember] = useState(false);

	const workspaceACLQuery = useQuery(workspaceACL(workspace.id));

	const addUserMutation = useMutation(setWorkspaceUserRole(queryClient));
	const updateUserMutation = useMutation(setWorkspaceUserRole(queryClient));
	const removeUserMutation = useMutation(setWorkspaceUserRole(queryClient));

	const addGroupMutation = useMutation(setWorkspaceGroupRole(queryClient));
	const updateGroupMutation = useMutation(setWorkspaceGroupRole(queryClient));
	const removeGroupMutation = useMutation(setWorkspaceGroupRole(queryClient));

	const addUser = async (
		user: WorkspaceUser,
		role: WorkspaceRole,
		reset: () => void,
	) => {
		const mutation = addUserMutation.mutateAsync({
			workspaceId: workspace.id,
			userId: user.id,
			role,
		});
		toast.promise(mutation, {
			loading: tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.adding_value0_to_workspace_73dce64a",
				{
					value0: user.username,
				},
			),
			success: tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.value0_added_to_workspace_successfully_59667c2d",
				{
					value0: user.username,
				},
			),
		});
		reset();
	};

	const updateUser = async (user: WorkspaceUser, role: WorkspaceRole) => {
		await updateUserMutation.mutateAsync({
			workspaceId: workspace.id,
			userId: user.id,
			role,
		});
		toast.success(
			tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.value0_role_updated_successfully_b176c6b1",
				{
					value0: user.username,
				},
			),
		);
	};

	const removeUser = async (user: WorkspaceUser) => {
		await removeUserMutation.mutateAsync({
			workspaceId: workspace.id,
			userId: user.id,
			role: "",
		});
		setHasRemovedMember(true);
		toast.success(
			tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.value0_removed_successfully_fa2f26d1",
				{
					value0: user.username,
				},
			),
		);
	};

	const addGroup = async (
		group: Group,
		role: WorkspaceRole,
		reset: () => void,
	) => {
		await addGroupMutation.mutateAsync({
			workspaceId: workspace.id,
			groupId: group.id,
			role,
		});
		setHasRemovedMember(false);
		toast.success(
			tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.group_value0_added_to_workspace_successfully_70662b2c",
				{
					value0: group.name,
				},
			),
		);
		reset();
	};

	const updateGroup = async (group: WorkspaceGroup, role: WorkspaceRole) => {
		await updateGroupMutation.mutateAsync({
			workspaceId: workspace.id,
			groupId: group.id,
			role,
		});
		toast.success(
			tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.group_role_value0_updated_successfully_2e3b870a",
				{
					value0: role,
				},
			),
		);
	};

	const removeGroup = async (group: Group) => {
		await removeGroupMutation.mutateAsync({
			workspaceId: workspace.id,
			groupId: group.id,
			role: "",
		});
		setHasRemovedMember(true);
		toast.success(
			tI18n(
				"workspaces.WorkspaceSharingForm.useWorkspaceSharing.group_value0_removed_successfully_2b8bc601",
				{
					value0: group.name,
				},
			),
		);
	};

	const mutationError =
		addUserMutation.error ??
		updateUserMutation.error ??
		removeUserMutation.error ??
		addGroupMutation.error ??
		updateGroupMutation.error ??
		removeGroupMutation.error;

	return {
		workspaceACL: workspaceACLQuery.data,
		isLoading: workspaceACLQuery.isLoading,
		error: workspaceACLQuery.error,
		mutationError,
		hasRemovedMember,
		// User actions
		addUser,
		updateUser,
		removeUser,
		isAddingUser: addUserMutation.isPending,
		updatingUserId: updateUserMutation.isPending
			? updateUserMutation.variables?.userId
			: undefined,
		// Group actions
		addGroup,
		updateGroup,
		removeGroup,
		isAddingGroup: addGroupMutation.isPending,
		updatingGroupId: updateGroupMutation.isPending
			? updateGroupMutation.variables?.groupId
			: undefined,
	} as const;
}
