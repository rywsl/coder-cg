import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	deleteOrganization,
	patchWorkspaceSharingSettings,
	updateOrganization,
	workspaceSharingSettings,
} from "#/api/queries/organizations";
import type { ShareableWorkspaceOwners } from "#/api/typesGenerated";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { i18n } from "#/i18n";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { OrganizationSettingsPageView } from "./OrganizationSettingsPageView";

const sharingUpdatedToastLabels: Record<ShareableWorkspaceOwners, string> = {
	none: i18n.t(
		"administration:OrganizationSettingsPage.OrganizationSettingsPage.workspace_sharing_disabled_9bc03401",
	),
	service_accounts: i18n.t(
		"administration:OrganizationSettingsPage.OrganizationSettingsPage.workspace_sharing_restricted_to_service_accounts_27d09164",
	),
	everyone: i18n.t(
		"administration:OrganizationSettingsPage.OrganizationSettingsPage.workspace_sharing_enabled_for_all_users_79181914",
	),
};

const OrganizationSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { organization, organizationPermissions } = useOrganizationSettings();

	const updateOrganizationMutation = useMutation(
		updateOrganization(queryClient),
	);
	const deleteOrganizationMutation = useMutation(
		deleteOrganization(queryClient),
	);

	const sharingSettingsQuery = useQuery({
		...workspaceSharingSettings(organization?.id ?? ""),
		enabled: Boolean(organization),
	});

	const patchSharingSettingsMutation = useMutation(
		patchWorkspaceSharingSettings(organization?.id ?? "", queryClient),
	);

	if (!organization) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.OrganizationSettingsPage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	const title = (
		<title>
			{pageTitle(
				tI18n(
					"OrganizationSettingsPage.OrganizationSettingsPage.settings_74a883a0",
				),
				organization.display_name || organization.name,
			)}
		</title>
	);

	if (!organizationPermissions?.editSettings) {
		return (
			<>
				{title}
				<RequirePermission isFeatureVisible={false} />
			</>
		);
	}

	const error =
		updateOrganizationMutation.error ?? deleteOrganizationMutation.error;

	const handleChangeShareableOwners = async (
		value: ShareableWorkspaceOwners,
	) => {
		const mutation = patchSharingSettingsMutation.mutateAsync({
			shareable_workspace_owners: value,
		});

		toast.promise(mutation, {
			loading: tI18n(
				"OrganizationSettingsPage.OrganizationSettingsPage.updating_workspace_sharing_settings_9567c85b",
			),
			success: sharingUpdatedToastLabels[value],
			error: (error) => ({
				message: tI18n(
					"OrganizationSettingsPage.OrganizationSettingsPage.failed_to_update_workspace_sharing_settings_2536c853",
				),
				description: getErrorDetail(error),
			}),
		});
	};

	return (
		<>
			{title}
			<OrganizationSettingsPageView
				organization={organization}
				error={error}
				onSubmit={async (values) => {
					const updatedOrganization =
						await updateOrganizationMutation.mutateAsync({
							organizationId: organization.id,
							req: values,
						});
					navigate(`/organizations/${updatedOrganization.name}/settings`);
					toast.success(
						tI18n(
							"OrganizationSettingsPage.OrganizationSettingsPage.organization_value0_settings_updated_successfull_c0ada6b3",
							{
								value0: updatedOrganization.name,
							},
						),
					);
				}}
				onDeleteOrganization={async () => {
					try {
						await deleteOrganizationMutation.mutateAsync(organization.id);
						toast.success(
							tI18n(
								"OrganizationSettingsPage.OrganizationSettingsPage.organization_value0_deleted_successfully_2f4b7347",
								{
									value0: organization.display_name || organization.name,
								},
							),
						);
						navigate("/organizations");
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"OrganizationSettingsPage.OrganizationSettingsPage.failed_to_delete_organization_value0_c06c5897",
									{
										value0: organization.name,
									},
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
					}
				}}
				workspaceSharingGloballyDisabled={
					sharingSettingsQuery.data?.sharing_globally_disabled
				}
				shareableWorkspaceOwners={
					sharingSettingsQuery.data?.shareable_workspace_owners ?? "none"
				}
				onChangeShareableOwners={handleChangeShareableOwners}
				isTogglingWorkspaceSharing={patchSharingSettingsMutation.isPending}
			/>
		</>
	);
};

export default OrganizationSettingsPage;
