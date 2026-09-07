import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { Button } from "#/components/Button/Button";

/**
 * Shown on premium page when any license is installed. The copy stays license-neutral
 * to also cover existing Enterprise licenses, which are not Premium.
 */
export const LicenseActivePanel: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col items-center gap-6 text-center max-w-md">
			<h1 className="m-0 font-semibold text-3xl text-content-primary">
				{tI18n(
					"DeploymentSettingsPage.PremiumPage.LicenseActivePanel.a_license_is_already_installed_0f101bf8",
				)}
			</h1>
			<p className="m-0 px-8 text-sm text-content-primary">
				{tI18n(
					"DeploymentSettingsPage.PremiumPage.LicenseActivePanel.this_deployment_already_has_a_license_review_you_9eea7857",
				)}
			</p>
			<Button asChild className="w-full">
				<RouterLink to="/deployment/licenses">
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.LicenseActivePanel.view_licenses_84534935",
					)}
				</RouterLink>
			</Button>
		</div>
	);
};
