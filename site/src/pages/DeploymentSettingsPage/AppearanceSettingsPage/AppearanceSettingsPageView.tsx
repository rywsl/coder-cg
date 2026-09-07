import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { UpdateAppearanceConfig } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	FormFields,
	FormFooter,
	FormSection,
	VerticalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { Switch } from "#/components/Switch/Switch";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import { docs } from "#/utils/docs";
import { getFormHelpers } from "#/utils/formUtils";
import { AnnouncementBannerSettings } from "./AnnouncementBannerSettings";

type AppearanceSettingsPageViewProps = {
	appearance: UpdateAppearanceConfig;
	isEntitled: boolean;
	canViewPremium: boolean;
	onSaveAppearance: (
		newConfig: Partial<UpdateAppearanceConfig>,
	) => Promise<void>;
};

export const AppearanceSettingsPageView: FC<
	AppearanceSettingsPageViewProps
> = ({ appearance, isEntitled, canViewPremium, onSaveAppearance }) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<{
		application_name: string;
		logo_url: string;
	}>({
		initialValues: {
			application_name: appearance.application_name,
			logo_url: appearance.logo_url,
		},
		onSubmit: (values) => onSaveAppearance(values),
		enableReinitialize: true,
	});
	const getFieldHelpers = getFormHelpers(form);

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
			{!isEntitled ? (
				<PremiumPaywall
					source="appearance"
					message={tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.appearance_3907fa7f",
					)}
					description={tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.configure_branding_and_announcement_banners_for__fa737695",
					)}
					features={[
						tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.custom_application_name_and_logo_97036ae6",
						),
						tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.site_wide_announcement_banners_for_updates_5190337f",
						),
						tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.custom_branded_oidc_sign_in_button_abdcadcf",
						),
						tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.custom_support_links_in_dropdown_98bed5c8",
						),
					]}
					canViewPremium={canViewPremium}
				/>
			) : (
				<div className="flex flex-col gap-8">
					<VerticalForm
						onSubmit={form.handleSubmit}
						aria-label={tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.appearance_settings_e40070e1",
						)}
					>
						<FormSection
							title={tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.branding_d417aa16",
							)}
							description={tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.customize_the_application_name_and_logo_shown_on_6f9a511d",
							)}
						>
							<FormFields>
								<FormField
									field={getFieldHelpers("application_name", {
										helperText: tI18n(
											"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.leave_empty_to_use_coder_a1d0738e",
										),
									})}
									label={tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.application_name_09526e9d",
									)}
									placeholder={tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.coder_db9653ff",
									)}
									disabled={form.isSubmitting}
								/>

								<IconField
									{...getFieldHelpers("logo_url", {
										helperText: tI18n(
											"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.leave_empty_to_use_the_coder_logo_an_image_with__c289b3e0",
										),
									})}
									label={tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.logo_url_7ed9aaae",
									)}
									placeholder="/icon/coder.svg"
									disabled={form.isSubmitting}
									onPickEmoji={(value) => {
										void form.setFieldValue("logo_url", value);
									}}
								/>
							</FormFields>
						</FormSection>

						<FormFooter>
							<Button type="submit" disabled={form.isSubmitting}>
								<Spinner loading={form.isSubmitting} />
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AppearanceSettingsPageView.save_1509f561",
								)}
							</Button>
						</FormFooter>
					</VerticalForm>

					<AnnouncementBannerSettings
						isEntitled
						announcementBanners={appearance.announcement_banners || []}
						onSubmit={(announcementBanners) =>
							onSaveAppearance({ announcement_banners: announcementBanners })
						}
					/>
				</div>
			)}
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
