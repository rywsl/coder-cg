import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

const supportedLocales = ["zh-CN", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const localeCookieName = "coder_locale";
export const productionDefaultLocale: SupportedLocale = "zh-CN";
export const testDefaultLocale: SupportedLocale = "en";
let activeLocale: SupportedLocale = testDefaultLocale;

export function isSupportedLocale(value: string): value is SupportedLocale {
	return value === "zh-CN" || value === "en";
}

export function localeFromCookie(cookie: string): SupportedLocale | undefined {
	for (const part of cookie.split(";")) {
		const [rawName, ...rawValue] = part.trim().split("=");
		if (rawName !== localeCookieName) {
			continue;
		}
		let value: string;
		try {
			value = decodeURIComponent(rawValue.join("="));
		} catch {
			return undefined;
		}
		return isSupportedLocale(value) ? value : undefined;
	}
	return undefined;
}

export function initialLocale(
	cookie: string,
	fallback: SupportedLocale,
): SupportedLocale {
	return localeFromCookie(cookie) ?? fallback;
}

export function persistLocale(locale: SupportedLocale): void {
	// Cookie Store is not supported by all Coder browsers.
	/* oxlint-disable unicorn/no-document-cookie */
	// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store is not supported by all Coder browsers.
	document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
	/* oxlint-enable unicorn/no-document-cookie */
}

export function applyLocale(locale: SupportedLocale): void {
	activeLocale = locale;
	document.documentElement.lang = locale;
	dayjs.locale(locale === "zh-CN" ? "zh-cn" : "en");
}

export function intlLocale(locale: SupportedLocale): string {
	return locale === "zh-CN" ? "zh-CN" : "en-US";
}

export function currentLocale(): SupportedLocale {
	return activeLocale;
}

export function currentIntlLocale(): string {
	return intlLocale(activeLocale);
}
