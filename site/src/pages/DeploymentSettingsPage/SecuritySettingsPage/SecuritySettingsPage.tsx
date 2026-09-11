import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { SecuritySettingsPageView } from "./SecuritySettingsPageView";

const SecuritySettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPage.security_settings_170ded24",
					),
				)}
			</title>
			<SecuritySettingsPageView options={deploymentConfig.options} />
		</>
	);
};

export default SecuritySettingsPage;
