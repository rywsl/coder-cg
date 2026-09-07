import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { UserAuthSettingsPageView } from "./UserAuthSettingsPageView";

const UserAuthSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.UserAuthSettingsPage.UserAuthSettingsPage.user_authentication_settings_477311b4",
					),
				)}
			</title>
			<UserAuthSettingsPageView options={deploymentConfig.options} />
		</>
	);
};

export default UserAuthSettingsPage;
