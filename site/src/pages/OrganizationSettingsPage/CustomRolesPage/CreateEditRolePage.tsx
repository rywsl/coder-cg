import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	createOrganizationRole,
	organizationRoles,
	updateOrganizationRole,
} from "#/api/queries/roles";
import type { CustomRoleRequest } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { Loader } from "#/components/Loader/Loader";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { CreateEditRolePageView } from "./CreateEditRolePageView";

const CreateEditRolePage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { organization: organizationName, roleName } = useParams();
	const { organizationPermissions } = useOrganizationSettings();
	const rolesQuery = useQuery({
		...organizationRoles(organizationName ?? ""),
		enabled: Boolean(organizationName),
	});
	const createOrganizationRoleMutation = useMutation(
		createOrganizationRole(queryClient, organizationName ?? ""),
	);
	const updateOrganizationRoleMutation = useMutation(
		updateOrganizationRole(queryClient, organizationName ?? ""),
	);

	if (!organizationName) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	const rolesHref = `/organizations/${organizationName}/roles`;

	if (rolesQuery.isLoading) {
		return <Loader />;
	}

	if (rolesQuery.error) {
		return <ErrorAlert error={rolesQuery.error} />;
	}

	if (!organizationPermissions) {
		return (
			<ErrorAlert
				error={tI18n(
					"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.failed_to_load_organization_permissions_f4f874a8",
				)}
			/>
		);
	}

	const role = roleName
		? rolesQuery.data?.find((candidate) => candidate.name === roleName)
		: undefined;

	if (roleName && !role) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.role_not_found_8ea4417f",
				)}
				cta={
					<Button variant="outline" asChild>
						<Link to={rolesHref}>
							{tI18n(
								"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.back_to_roles_094ed2c4",
							)}
						</Link>
					</Button>
				}
			/>
		);
	}

	const isEditing = role !== undefined;
	const saveRole = isEditing
		? updateOrganizationRoleMutation
		: createOrganizationRoleMutation;

	const handleSubmit = (data: CustomRoleRequest) => {
		const mutation = saveRole.mutateAsync(data, {
			onSuccess: () => {
				navigate(rolesHref);
			},
		});
		toast.promise(mutation, {
			loading: tI18n(
				"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.value0_custom_role_value1_298d91a3",
				{
					value0: isEditing ? "Updating" : "Creating",
					value1: data.name,
				},
			),
			success: tI18n(
				"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.custom_role_value0_value1_successfully_500133fb",
				{
					value0: data.name,
					value1: isEditing ? "updated" : "created",
				},
			),
			error: (error) => ({
				message: getErrorMessage(
					error,
					tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.failed_to_value0_custom_role_value1_f1da4475",
						{
							value0: isEditing ? "update" : "create",
							value1: data.name,
						},
					),
				),
				description: getErrorDetail(error),
			}),
		});
	};

	return (
		<RequirePermission
			isFeatureVisible={
				isEditing
					? organizationPermissions.updateOrgRoles
					: organizationPermissions.createOrgRoles
			}
		>
			<title>
				{pageTitle(
					isEditing
						? tI18n(
								"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.edit_custom_role_0cb81d2b",
							)
						: tI18n(
								"OrganizationSettingsPage.CustomRolesPage.CreateEditRolePage.new_custom_role_64946125",
							),
					isEditing ? role.display_name || role.name : undefined,
				)}
			</title>
			<CreateEditRolePageView
				role={role}
				onSubmit={handleSubmit}
				error={saveRole.error}
				isLoading={saveRole.isPending}
				organizationName={organizationName}
			/>
		</RequirePermission>
	);
};

export default CreateEditRolePage;
