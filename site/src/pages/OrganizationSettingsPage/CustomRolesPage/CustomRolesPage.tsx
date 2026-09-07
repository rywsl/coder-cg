import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { updateOrganization } from "#/api/queries/organizations";
import { deleteOrganizationRole, organizationRoles } from "#/api/queries/roles";
import type { Role } from "#/api/typesGenerated";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import { CustomRolesPageView } from "./CustomRolesPageView";

const CustomRolesPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { permissions } = useAuthenticated();
	const queryClient = useQueryClient();
	const { custom_roles: isCustomRolesEnabled } = useFeatureVisibility();
	const { organization: organizationName } = useParams() as {
		organization: string;
	};
	const { organization, organizationPermissions } = useOrganizationSettings();
	const { entitlements } = useDashboard();
	const defaultRolesEntitled =
		entitlements.features.multiple_organizations.enabled;

	const [roleToDelete, setRoleToDelete] = useState<Role>();

	const organizationRolesQuery = useQuery(organizationRoles(organizationName));
	const builtInRoles = organizationRolesQuery.data?.filter(
		(role) => role.built_in,
	);
	const customRoles = organizationRolesQuery.data?.filter(
		(role) => !role.built_in,
	);

	const deleteRoleMutation = useMutation(
		deleteOrganizationRole(queryClient, organizationName),
	);
	const updateOrganizationMutation = useMutation(
		updateOrganization(queryClient),
	);

	useEffect(() => {
		if (organizationRolesQuery.error) {
			toast.error(
				getErrorMessage(
					organizationRolesQuery.error,
					tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.error_loading_custom_roles_b1acba0b",
					),
				),
				{
					description: getErrorDetail(organizationRolesQuery.error),
				},
			);
		}
	}, [organizationRolesQuery.error]);

	if (!organization) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	return (
		<div className="w-full max-w-(--breakpoint-2xl) pb-10">
			<title>
				{pageTitle(
					tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.custom_roles_6e845384",
					),
					organization.display_name || organization.name,
				)}
			</title>
			<RequirePermission
				isFeatureVisible={organizationPermissions?.viewOrgRoles ?? false}
			>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.roles_c2533705",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.manage_roles_for_this_organization_8ad3ed17",
						)}{" "}
						<SettingsHeaderDocsLink href={docs("/admin/users/groups-roles")} />
					</SettingsHeaderDescription>
				</SettingsHeader>

				<CustomRolesPageView
					organization={organization}
					builtInRoles={builtInRoles}
					customRoles={customRoles}
					onDeleteRole={setRoleToDelete}
					canCreateOrgRole={organizationPermissions?.createOrgRoles ?? false}
					canUpdateOrgRole={organizationPermissions?.updateOrgRoles ?? false}
					canDeleteOrgRole={organizationPermissions?.deleteOrgRoles ?? false}
					canEditDefaultRoles={organizationPermissions?.editSettings ?? false}
					isCustomRolesEnabled={isCustomRolesEnabled}
					permissions={permissions}
					defaultRolesEntitled={defaultRolesEntitled}
					availableOrgRoles={organizationRolesQuery.data}
					isUpdatingDefaultRoles={updateOrganizationMutation.isPending}
					onUpdateDefaultRoles={async (roles) => {
						try {
							await updateOrganizationMutation.mutateAsync({
								organizationId: organization.id,
								req: { default_org_member_roles: roles },
							});
							toast.success(
								tI18n(
									"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.default_roles_updated_afd4cc06",
								),
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.failed_to_update_default_roles_a0cdd07c",
									),
								),
								{ description: getErrorDetail(error) },
							);
						}
					}}
				/>

				<DeleteDialog
					key={roleToDelete?.name}
					isOpen={roleToDelete !== undefined}
					confirmLoading={deleteRoleMutation.isPending}
					name={roleToDelete?.name ?? ""}
					entity={tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.role_4b168d88",
					)}
					onCancel={() => setRoleToDelete(undefined)}
					onConfirm={async () => {
						try {
							if (roleToDelete) {
								await deleteRoleMutation.mutateAsync(roleToDelete.name, {
									onSuccess: () => {
										setRoleToDelete(undefined);
										organizationRolesQuery.refetch();
									},
								});
							}
							toast.success(
								roleToDelete
									? `Custom role "${roleToDelete.name}" deleted successfully.`
									: "Custom role deleted successfully.",
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"OrganizationSettingsPage.CustomRolesPage.CustomRolesPage.failed_to_delete_custom_role_5a72eb1f",
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
				/>
			</RequirePermission>
		</div>
	);
};

export default CustomRolesPage;
