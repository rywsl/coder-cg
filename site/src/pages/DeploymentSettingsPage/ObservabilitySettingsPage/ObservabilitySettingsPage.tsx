import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { ObservabilitySettingsPageView } from "./ObservabilitySettingsPageView";

const ObservabilitySettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();
	const { entitlements } = useDashboard();
	const { permissions } = useAuthenticated();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPage.observability_settings_e964bbb6",
					),
				)}
			</title>
			<ObservabilitySettingsPageView
				options={deploymentConfig.options}
				featureAuditLogEnabled={entitlements.features.audit_log.enabled}
				canViewPremium={permissions.viewAllLicenses}
			/>
		</>
	);
};

export default ObservabilitySettingsPage;
