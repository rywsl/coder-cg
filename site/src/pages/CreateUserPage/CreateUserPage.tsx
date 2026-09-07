import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { roles } from "#/api/queries/roles";
import { authMethods, createUser } from "#/api/queries/users";
import { Margins } from "#/components/Margins/Margins";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { pageTitle } from "#/utils/page";
import { CreateUserForm } from "./CreateUserForm";

const CreateUserPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const createUserMutation = useMutation(createUser(queryClient));
	const authMethodsQuery = useQuery(authMethods());
	const rolesQuery = useQuery(roles());
	const { showOrganizations } = useDashboard();
	const { service_accounts: serviceAccountsEnabled } = useFeatureVisibility();

	return (
		<Margins>
			<title>
				{pageTitle(tI18n("CreateUserPage.CreateUserPage.create_user_80532ec0"))}
			</title>
			<CreateUserForm
				error={createUserMutation.error}
				isLoading={createUserMutation.isPending}
				onSubmit={async (user) => {
					const mutation = createUserMutation.mutateAsync(
						{
							username: user.username,
							name: user.name,
							email: user.email,
							organization_ids: [user.organization],
							login_type: user.login_type,
							password: user.password,
							user_status: null,
							service_account: user.service_account,
							roles: [...user.roles],
						},
						{
							onSuccess: () => {
								navigate("..", { relative: "path" });
							},
						},
					);
					const requestedAccount = user.service_account
						? "service account"
						: "user";
					toast.promise(mutation, {
						loading: tI18n(
							"CreateUserPage.CreateUserPage.creating_value0_value1_ff433be5",
							{
								value0: requestedAccount,
								value1: user.username,
							},
						),
						success: (created) =>
							tI18n(
								"CreateUserPage.CreateUserPage.value0_value1_created_successfully_7ddb8d99",
								{
									value0: created.is_service_account
										? "Service account"
										: "User",
									value1: created.username,
								},
							),
						error: (e) => ({
							message: getErrorMessage(
								e,
								tI18n(
									"CreateUserPage.CreateUserPage.failed_to_create_value0_value1_ba742d6c",
									{
										value0: requestedAccount,
										value1: user.username,
									},
								),
							),
							description: getErrorDetail(e),
						}),
					});
				}}
				onCancel={() => {
					navigate("..", { relative: "path" });
				}}
				authMethods={authMethodsQuery.data}
				showOrganizations={showOrganizations}
				serviceAccountsEnabled={serviceAccountsEnabled}
				availableRoles={rolesQuery.data}
				rolesLoading={rolesQuery.isLoading}
				rolesError={rolesQuery.error}
			/>
		</Margins>
	);
};

export default CreateUserPage;
