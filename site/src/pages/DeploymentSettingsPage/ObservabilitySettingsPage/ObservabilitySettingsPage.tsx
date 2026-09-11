import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { ObservabilitySettingsPageView } from "./ObservabilitySettingsPageView";

const ObservabilitySettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPage.observability_settings_e964bbb6",
					),
				)}
			</title>
			<ObservabilitySettingsPageView options={deploymentConfig.options} />
		</>
	);
};

export default ObservabilitySettingsPage;
