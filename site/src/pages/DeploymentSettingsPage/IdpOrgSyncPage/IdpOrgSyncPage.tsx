import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { deploymentIdpSyncFieldValues } from "#/api/queries/deployment";
import {
	organizationIdpSyncSettings,
	patchOrganizationSyncSettings,
} from "#/api/queries/idpsync";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import { ExportPolicyButton } from "./ExportPolicyButton";
import { IdpOrgSyncPageView } from "./IdpOrgSyncPageView";

const IdpOrgSyncPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { permissions } = useAuthenticated();
	const queryClient = useQueryClient();
	// IdP sync does not have its own entitlement and is based on templace_rbac
	const { template_rbac: isIdpSyncEnabled } = useFeatureVisibility();
	const { organizations } = useDashboard();
	const settingsQuery = useQuery(organizationIdpSyncSettings(isIdpSyncEnabled));

	const [field, setField] = useState("");
	useEffect(() => {
		if (!settingsQuery.data) {
			return;
		}

		setField(settingsQuery.data.field);
	}, [settingsQuery.data]);

	const fieldValuesQuery = useQuery({
		...deploymentIdpSyncFieldValues(field),
		enabled: Boolean(field),
	});

	const patchOrganizationSyncSettingsMutation = useMutation(
		patchOrganizationSyncSettings(queryClient),
	);

	useEffect(() => {
		if (patchOrganizationSyncSettingsMutation.error) {
			toast.error(
				getErrorMessage(
					patchOrganizationSyncSettingsMutation.error,
					tI18n(
						"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.error_updating_organization_idp_sync_settings_4de84c50",
					),
				),
			);
		}
	}, [patchOrganizationSyncSettingsMutation.error]);

	if (settingsQuery.isLoading) {
		return <Loader />;
	}

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.organization_idp_sync_8e69f5cd",
					),
				)}
			</title>
			<div>
				<SettingsHeader
					actions={<ExportPolicyButton syncSettings={settingsQuery.data} />}
				>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.organization_idp_sync_8e69f5cd",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.automatically_assign_users_to_an_organization_ba_34be883d",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/users/idp-sync#organization-sync")}
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>
				{!isIdpSyncEnabled ? (
					<PremiumPaywall
						source="idp_org_sync"
						message={tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.idp_organization_sync_9d6641db",
						)}
						description={tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.configure_organization_mappings_to_synchronize_c_bbb43e57",
						)}
						features={[
							tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.sync_groups_roles_automatically_7202e36e",
							),
							tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.no_manual_user_assignment_cf1b71df",
							),
							tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.works_with_your_oidc_provider_4fbb4584",
							),
						]}
						canViewPremium={permissions.viewAllLicenses}
					/>
				) : (
					<IdpOrgSyncPageView
						organizationSyncSettings={settingsQuery.data}
						claimFieldValues={fieldValuesQuery.data}
						organizations={organizations}
						onSyncFieldChange={setField}
						onSubmit={async (data) => {
							try {
								await patchOrganizationSyncSettingsMutation.mutateAsync(data);
								toast.success(
									tI18n(
										"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.organization_sync_settings_updated_8e1f32e7",
									),
								);
							} catch (error) {
								toast.error(
									getErrorMessage(
										error,
										tI18n(
											"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPage.failed_to_update_organization_idp_sync_settings_b4993f1f",
										),
									),
									{
										description: getErrorDetail(error),
									},
								);
							}
						}}
						error={settingsQuery.error || fieldValuesQuery.error}
					/>
				)}
			</div>
		</>
	);
};

export default IdpOrgSyncPage;
