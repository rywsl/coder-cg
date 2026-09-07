import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { ExternalAuthSettingsPageView } from "./ExternalAuthSettingsPageView";

const ExternalAuthSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();
	const { permissions } = useAuthenticated();
	const { multiple_external_auth: isEntitled } = useFeatureVisibility();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPage.external_authentication_settings_287b95d7",
					),
				)}
			</title>
			<ExternalAuthSettingsPageView
				config={deploymentConfig.config}
				isEntitled={isEntitled}
				canViewPremium={permissions.viewAllLicenses}
			/>
		</>
	);
};

export default ExternalAuthSettingsPage;
