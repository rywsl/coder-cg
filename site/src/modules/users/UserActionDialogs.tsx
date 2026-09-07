import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { roles } from "#/api/queries/roles";
import {
	activateUser,
	deleteUser,
	suspendUser,
	updatePassword,
	updateRoles,
	userKey,
} from "#/api/queries/users";
import type { User } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import { RoleSelectorDialog } from "#/modules/roles/RoleSelectorDialog";
import { generateRandomBase64String } from "#/utils/random";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

export type UserAdminAction =
	| { type: "editRoles"; user: User }
	| { type: "resetPassword"; user: User }
	| { type: "suspend"; user: User }
	| { type: "activate"; user: User }
	| { type: "delete"; user: User };

type UserActionDialogsProps = {
	action: UserAdminAction | undefined;
	onClose: () => void;
};

export const UserActionDialogs: FC<UserActionDialogsProps> = ({
	action,
	onClose,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const queryClient = useQueryClient();
	const user = action?.user;
	const rolesQuery = useQuery({
		...roles(),
		enabled: action?.type === "editRoles",
	});
	const updateUserRolesMutation = useMutation(updateRoles(queryClient));
	const deleteUserMutation = useMutation(deleteUser(queryClient));
	const suspendUserMutation = useMutation(suspendUser(queryClient));
	const activateUserMutation = useMutation(activateUser(queryClient));
	const updatePasswordMutation = useMutation(updatePassword());

	const invalidateUser = (target: User) =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: userKey(target.id) }),
			queryClient.invalidateQueries({ queryKey: userKey(target.username) }),
		]);

	if (!action || !user) {
		return null;
	}

	return (
		<>
			{action.type === "editRoles" && (
				<RoleSelectorDialog
					user={user}
					availableRoles={rolesQuery.data}
					loading={rolesQuery.isLoading}
					error={rolesQuery.error}
					onCancel={onClose}
					onUpdateRoles={async (nextRoles) => {
						try {
							await updateUserRolesMutation.mutateAsync({
								userId: user.id,
								roles: nextRoles,
							});
							await invalidateUser(user);
							toast.success(
								tI18n(
									"users.UserActionDialogs.user_roles_updated_successfully_078e9bfc",
								),
							);
							onClose();
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"users.UserActionDialogs.error_updating_user_roles_1b08245e",
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
					isUpdatingRoles={updateUserRolesMutation.isPending}
				/>
			)}
			{action.type === "delete" && (
				<DeleteDialog
					isOpen
					confirmLoading={deleteUserMutation.isPending}
					name={user.username}
					entity={tI18n("users.UserActionDialogs.user_04f8996d")}
					onCancel={onClose}
					onConfirm={async () => {
						try {
							await deleteUserMutation.mutateAsync(user.id);
							onClose();
							toast.success(
								tI18n(
									"users.UserActionDialogs.user_value0_deleted_successfully_63216a8a",
									{
										value0: user.username,
									},
								),
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"users.UserActionDialogs.error_deleting_user_value0_63c93ea7",
										{
											value0: user.username,
										},
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
				/>
			)}
			{action.type === "suspend" && (
				<ConfirmDialog
					type="delete"
					hideCancel={false}
					open
					confirmLoading={suspendUserMutation.isPending}
					title={tI18n("users.UserActionDialogs.suspend_user_8d42f0ff")}
					confirmText={tI18n("users.UserActionDialogs.suspend_4948e134")}
					onClose={onClose}
					onConfirm={async () => {
						try {
							await suspendUserMutation.mutateAsync(user.id);
							await invalidateUser(user);
							onClose();
							toast.success(
								tI18n(
									"users.UserActionDialogs.user_value0_suspended_successfully_080b822e",
									{
										value0: user.username,
									},
								),
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"users.UserActionDialogs.error_suspending_user_value0_cad9a133",
										{
											value0: user.username,
										},
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
					description={
						<>
							{tI18n(
								"users.UserActionDialogs.do_you_want_to_suspend_the_user_b38b8a23",
							)}
							<strong>{user.username}</strong>?
						</>
					}
				/>
			)}
			{action.type === "activate" && (
				<ConfirmDialog
					type="success"
					hideCancel={false}
					open
					confirmLoading={activateUserMutation.isPending}
					title={tI18n("users.UserActionDialogs.activate_user_53e63392")}
					confirmText={tI18n("users.UserActionDialogs.activate_24433c70")}
					onClose={onClose}
					onConfirm={async () => {
						try {
							await activateUserMutation.mutateAsync(user.id);
							await invalidateUser(user);
							onClose();
							toast.success(
								tI18n(
									"users.UserActionDialogs.user_value0_activated_successfully_b3167e3a",
									{
										value0: user.username,
									},
								),
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"users.UserActionDialogs.error_activating_user_value0_222859a9",
										{
											value0: user.username,
										},
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
					description={
						<>
							{tI18n(
								"users.UserActionDialogs.do_you_want_to_activate_418a8cb2",
							)}
							<strong>{user.username}</strong>?
						</>
					}
				/>
			)}
			{action.type === "resetPassword" && (
				<ResetPasswordAction
					user={user}
					loading={updatePasswordMutation.isPending}
					onClose={onClose}
					onConfirm={async (newPassword) => {
						try {
							await updatePasswordMutation.mutateAsync({
								userId: user.id,
								password: newPassword,
								old_password: "",
							});
							onClose();
							toast.success(
								tI18n(
									"users.UserActionDialogs.password_for_value0_updated_successfully_0400eb8e",
									{
										value0: user.username,
									},
								),
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"users.UserActionDialogs.error_resetting_password_for_value0_9d2d886f",
										{
											value0: user.username,
										},
									),
								),
							);
						}
					}}
				/>
			)}
		</>
	);
};

const ResetPasswordAction: FC<{
	user: User;
	loading: boolean;
	onClose: () => void;
	onConfirm: (newPassword: string) => void;
}> = ({ user, loading, onClose, onConfirm }) => {
	const [newPassword] = useState(() =>
		process.env.STORYBOOK === "true"
			? "hello-storybook"
			: generateRandomBase64String(12),
	);

	return (
		<ResetPasswordDialog
			open
			loading={loading}
			user={user}
			newPassword={newPassword}
			onClose={onClose}
			onConfirm={() => onConfirm(newPassword)}
		/>
	);
};
