import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useParams } from "react-router";
import { provisionerDaemonGroups } from "#/api/queries/organizations";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { OrganizationProvisionerKeysPageView } from "./OrganizationProvisionerKeysPageView";

const OrganizationProvisionerKeysPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { permissions } = useAuthenticated();
	const { organization: organizationName } = useParams() as {
		organization: string;
	};
	const { organization, organizationPermissions } = useOrganizationSettings();
	const { entitlements } = useDashboard();
	const provisionerKeyDaemonsQuery = useQuery({
		...provisionerDaemonGroups(organizationName),
		enabled: !!organization,
		select: (data) =>
			[...data].sort((a, b) => b.daemons.length - a.daemons.length),
	});

	if (!organization) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	const title = (
		<title>
			{pageTitle(
				tI18n(
					"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPage.provisioner_keys_3c2d4e86",
				),
				organization.display_name || organization.name,
			)}
		</title>
	);

	if (!organizationPermissions?.viewProvisioners) {
		return (
			<>
				{title}
				<RequirePermission isFeatureVisible={false} />
			</>
		);
	}

	return (
		<>
			{title}
			<OrganizationProvisionerKeysPageView
				showPaywall={!entitlements.features.multiple_organizations.enabled}
				provisionerKeyDaemons={provisionerKeyDaemonsQuery.data}
				error={provisionerKeyDaemonsQuery.error}
				permissions={permissions}
				onRetry={provisionerKeyDaemonsQuery.refetch}
			/>
		</>
	);
};

export default OrganizationProvisionerKeysPage;
