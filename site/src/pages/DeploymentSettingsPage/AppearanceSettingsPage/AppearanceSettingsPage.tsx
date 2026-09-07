import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	appearanceConfigKey,
	updateAppearance,
} from "#/api/queries/appearance";
import type { UpdateAppearanceConfig } from "#/api/typesGenerated";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { AppearanceSettingsPageView } from "./AppearanceSettingsPageView";

// ServiceBanner is unlike the other Deployment Settings pages because it
// implements a form, whereas the others are read-only. We make this
// exception because the Service Banner is visual, and configuring it from
// the command line would be a significantly worse user experience.
const AppearanceSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { appearance, entitlements } = useDashboard();
	const queryClient = useQueryClient();
	const updateAppearanceMutation = useMutation(updateAppearance(queryClient));
	const { permissions } = useAuthenticated();
	const canEditAppearance = permissions.editDeploymentConfig;

	const onSaveAppearance = async (
		newConfig: Partial<UpdateAppearanceConfig>,
	) => {
		const newAppearance = { ...appearance, ...newConfig };

		const mutation = updateAppearanceMutation.mutateAsync(newAppearance, {
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: appearanceConfigKey });
			},
		});

		toast.promise(mutation, {
			loading: tI18n(
				"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPage.updating_appearance_settings_234d4bdb",
			),
			success: tI18n(
				"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPage.appearance_settings_updated_successfully_2b373752",
			),
			error: (error) => ({
				message: getErrorMessage(
					error,
					tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPage.failed_to_update_appearance_settings_3c2325a3",
					),
				),
				description: getErrorDetail(error),
			}),
		});
	};

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPage.appearance_settings_a6887bd9",
					),
				)}
			</title>
			<RequirePermission isFeatureVisible={canEditAppearance}>
				<AppearanceSettingsPageView
					appearance={appearance}
					onSaveAppearance={onSaveAppearance}
					isEntitled={
						entitlements.features.appearance.entitlement !== "not_entitled"
					}
					canViewPremium={permissions.viewAllLicenses}
				/>
			</RequirePermission>
		</>
	);
};

export default AppearanceSettingsPage;
