import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import {
	applyLocale,
	initialLocale,
	persistLocale,
	productionDefaultLocale,
	type SupportedLocale,
	testDefaultLocale,
} from "./locale";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

export const defaultNS = "common";
export const resources = {
	en,
	"zh-CN": zhCN,
} as const;

const isTestEnvironment =
	process.env.NODE_ENV === "test" || process.env.STORYBOOK === "true";
const locale = isTestEnvironment
	? testDefaultLocale
	: initialLocale(document.cookie, productionDefaultLocale);

export const i18n = i18next.createInstance().use(initReactI18next);

void i18n.init({
	defaultNS,
	fallbackLng: "en",
	initAsync: false,
	interpolation: {
		escapeValue: false,
	},
	lng: locale,
	resources,
	supportedLngs: ["zh-CN", "en"],
});

if (!isTestEnvironment) {
	persistLocale(locale);
}
applyLocale(locale);

export async function changeLocale(locale: SupportedLocale): Promise<void> {
	persistLocale(locale);
	applyLocale(locale);
	await i18n.changeLanguage(locale);
	if (!isTestEnvironment) {
		window.location.reload();
	}
}
