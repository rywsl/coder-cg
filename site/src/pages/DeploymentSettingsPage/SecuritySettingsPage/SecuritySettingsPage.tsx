import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { SecuritySettingsPageView } from "./SecuritySettingsPageView";

const SecuritySettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();
	const { entitlements } = useDashboard();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPage.security_settings_170ded24",
					),
				)}
			</title>
			<SecuritySettingsPageView
				options={deploymentConfig.options}
				isBrowserOnlyEntitled={
					entitlements.features.browser_only.entitlement !== "not_entitled"
				}
				featureBrowserOnlyEnabled={entitlements.features.browser_only.enabled}
			/>
		</>
	);
};

export default SecuritySettingsPage;
