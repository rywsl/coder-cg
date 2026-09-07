import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueries, useQuery, useQueryClient } from "react-query";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { groupsByOrganization } from "#/api/queries/groups";
import {
	groupIdpSyncSettings,
	organizationIdpSyncClaimFieldValues,
	patchGroupSyncSettings,
	patchRoleSyncSettings,
	roleIdpSyncSettings,
} from "#/api/queries/organizations";
import { organizationRoles } from "#/api/queries/roles";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import IdpSyncPageView from "./IdpSyncPageView";

const IdpSyncPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { permissions } = useAuthenticated();
	const queryClient = useQueryClient();
	// IdP sync does not have its own entitlement and is based on templace_rbac
	const { template_rbac: isIdpSyncEnabled } = useFeatureVisibility();
	const { organization: organizationName } = useParams() as {
		organization: string;
	};
	const { organization, organizationPermissions } = useOrganizationSettings();
	const [groupField, setGroupField] = useState("");
	const [roleField, setRoleField] = useState("");

	const [
		groupIdpSyncSettingsQuery,
		roleIdpSyncSettingsQuery,
		groupsQuery,
		rolesQuery,
	] = useQueries({
		queries: [
			groupIdpSyncSettings(organizationName),
			roleIdpSyncSettings(organizationName),
			groupsByOrganization(organizationName),
			organizationRoles(organizationName),
		],
	});

	useEffect(() => {
		if (!groupIdpSyncSettingsQuery.data) {
			return;
		}

		setGroupField(groupIdpSyncSettingsQuery.data.field);
	}, [groupIdpSyncSettingsQuery.data]);

	useEffect(() => {
		if (!roleIdpSyncSettingsQuery.data) {
			return;
		}

		setRoleField(roleIdpSyncSettingsQuery.data.field);
	}, [roleIdpSyncSettingsQuery.data]);

	const [searchParams] = useSearchParams();
	const tab = searchParams.get("tab") || "groups";
	const field = tab === "groups" ? groupField : roleField;

	const fieldValuesQuery = useQuery({
		...organizationIdpSyncClaimFieldValues(organizationName, field),
		enabled: Boolean(field),
	});

	const patchGroupSyncSettingsMutation = useMutation(
		patchGroupSyncSettings(organizationName, queryClient),
	);
	const patchRoleSyncSettingsMutation = useMutation(
		patchRoleSyncSettings(organizationName, queryClient),
	);

	if (!organization) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	const title = (
		<title>
			{pageTitle(
				tI18n(
					"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.idp_sync_4af5d734",
				),
				organization.display_name || organization.name,
			)}
		</title>
	);

	if (!organizationPermissions?.viewIdpSyncSettings) {
		return (
			<>
				{title}
				<RequirePermission isFeatureVisible={false} />
			</>
		);
	}

	const error =
		patchGroupSyncSettingsMutation.error ||
		patchRoleSyncSettingsMutation.error ||
		groupIdpSyncSettingsQuery.error ||
		roleIdpSyncSettingsQuery.error ||
		groupsQuery.error;

	const groupsMap = new Map<string, string>();
	if (groupsQuery.data) {
		for (const group of groupsQuery.data) {
			groupsMap.set(group.id, group.display_name || group.name);
		}
	}

	return (
		<div className="w-full max-w-(--breakpoint-2xl) pb-10">
			{title}
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.idp_sync_4af5d734",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.automatically_assign_groups_or_roles_to_a_user_b_fcab4cc0",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/users/idp-sync")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			{!isIdpSyncEnabled ? (
				<PremiumPaywall
					source="idp_sync"
					message={tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.idp_sync_4af5d734",
					)}
					description={tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.auto_sync_groups_roles_from_your_idp_b57a8a89",
					)}
					features={[
						tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.sync_groups_roles_automatically_7202e36e",
						),
						tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.configured_per_organization_0f80f6cb",
						),
						tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.no_manual_user_assignment_cf1b71df",
						),
						tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.works_with_your_oidc_provider_4fbb4584",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			) : (
				<IdpSyncPageView
					tab={tab}
					groupSyncSettings={groupIdpSyncSettingsQuery.data}
					roleSyncSettings={roleIdpSyncSettingsQuery.data}
					claimFieldValues={fieldValuesQuery.data}
					groups={groupsQuery.data}
					groupsMap={groupsMap}
					roles={rolesQuery.data}
					organization={organization}
					onGroupSyncFieldChange={setGroupField}
					onRoleSyncFieldChange={setRoleField}
					error={error}
					onSubmitGroupSyncSettings={async (data) => {
						const mutation = patchGroupSyncSettingsMutation.mutateAsync(data);
						toast.promise(mutation, {
							loading: tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.updating_idp_group_sync_settings_4e9c973b",
							),
							success: tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.idp_group_sync_settings_updated_62ca9d76",
							),
							error: (error) => ({
								message: getErrorMessage(
									error,
									tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.failed_to_update_idp_group_sync_settings_cb49d2b0",
									),
								),
								description: getErrorDetail(error),
							}),
						});
					}}
					onSubmitRoleSyncSettings={async (data) => {
						try {
							await patchRoleSyncSettingsMutation.mutateAsync(data);
							toast.success(
								tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.idp_role_sync_settings_updated_c3527431",
								),
							);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpSyncPage.failed_to_update_idp_role_sync_settings_f10d5a48",
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
		</div>
	);
};

export default IdpSyncPage;
