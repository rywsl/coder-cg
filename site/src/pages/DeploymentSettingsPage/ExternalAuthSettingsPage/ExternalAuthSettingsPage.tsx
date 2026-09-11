import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { ExternalAuthSettingsPageView } from "./ExternalAuthSettingsPageView";

const ExternalAuthSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPage.external_authentication_settings_287b95d7",
					),
				)}
			</title>
			<ExternalAuthSettingsPageView config={deploymentConfig.config} />
		</>
	);
};

export default ExternalAuthSettingsPage;
