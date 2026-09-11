import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { UpdateAppearanceConfig } from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Switch } from "#/components/Switch/Switch";
import { docs } from "#/utils/docs";

type AppearanceSettingsPageViewProps = {
	appearance: UpdateAppearanceConfig;
	onSaveAppearance: (
		newConfig: Partial<UpdateAppearanceConfig>,
	) => Promise<void>;
};

export const AppearanceSettingsPageView: FC<
	AppearanceSettingsPageViewProps
> = ({ appearance, onSaveAppearance }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.appearance_3907fa7f",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.customize_the_look_and_feel_of_your_coder_deploy_ac5e771b",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/setup/appearance")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			<div className="overflow-hidden rounded-lg border border-solid border-border">
				<div className="flex items-center justify-between gap-4 p-6">
					<div>
						<h3 className="m-0 text-xl font-semibold">
							<label htmlFor="codernauts-enabled">
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.codernauts_game_3f840042",
								)}
							</label>
						</h3>
						<div className="mt-2 text-sm text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.a_lunar_lander_game_where_you_rescue_stranded_te_a96f57b4",
							)}
						</div>
					</div>
					<Switch
						id="codernauts-enabled"
						checked={appearance.codernauts_enabled}
						onCheckedChange={(checked) =>
							onSaveAppearance({ codernauts_enabled: checked })
						}
					/>
				</div>
			</div>
		</div>
	);
};
