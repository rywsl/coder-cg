import { i18n } from "#/i18n";
import { CONCRETE_THEMES, type ConcreteThemeName } from "#/theme";

type ThemeCopy = {
	title: string;
	description: string;
};

export const THEME_COPY: Record<ConcreteThemeName, ThemeCopy> = {
	light: {
		title: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.light_default_01811a14",
		),
		description: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.coder_s_standard_light_theme_with_full_color_con_1e8c9aac",
		),
	},
	"light-protan-deuter": {
		title: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.light_protanopia_and_deuteranopia_afe6c53f",
		),
		description: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.for_people_who_may_find_it_difficult_to_distingu_3764f3b7",
		),
	},
	"light-tritan": {
		title: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.light_tritanopia_723af7dd",
		),
		description: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.for_people_who_find_it_difficult_to_distinguish__f1915c79",
		),
	},
	dark: {
		title: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.dark_default_123f4270",
		),
		description: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.coder_s_standard_dark_theme_with_full_color_cont_1046a18c",
		),
	},
	"dark-protan-deuter": {
		title: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.dark_protanopia_and_deuteranopia_d88f0936",
		),
		description: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.for_people_who_may_find_it_difficult_to_distingu_3355c516",
		),
	},
	"dark-tritan": {
		title: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.dark_tritanopia_bcc8b158",
		),
		description: i18n.t(
			"users:UserSettingsPage.AppearancePage.themeCopy.for_people_who_find_it_difficult_to_distinguish__5634becc",
		),
	},
};

export const LIGHT_THEMES: ConcreteThemeName[] = [
	"light",
	"light-protan-deuter",
	"light-tritan",
];

export const DARK_THEMES: ConcreteThemeName[] = [
	"dark",
	"dark-protan-deuter",
	"dark-tritan",
];

export const SYNC_MODE_THEMES: ConcreteThemeName[] = [
	...LIGHT_THEMES,
	...DARK_THEMES,
];

const syncModeThemes = SYNC_MODE_THEMES;
const themeCopyKeys = Object.keys(THEME_COPY);
if (
	syncModeThemes.length !== CONCRETE_THEMES.length ||
	themeCopyKeys.length !== CONCRETE_THEMES.length ||
	!CONCRETE_THEMES.every((theme) => syncModeThemes.includes(theme))
) {
	throw new Error(
		"Theme copy registries are out of sync with CONCRETE_THEMES.",
	);
}
