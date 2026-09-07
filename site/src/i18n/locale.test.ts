import dayjs from "dayjs";
import {
	applyLocale,
	initialLocale,
	intlLocale,
	isSupportedLocale,
	localeFromCookie,
	persistLocale,
} from "./locale";

describe("locale", () => {
	it("recognizes only supported locale values", () => {
		expect(isSupportedLocale("en")).toBe(true);
		expect(isSupportedLocale("zh-CN")).toBe(true);
		expect(isSupportedLocale("zh-TW")).toBe(false);
		expect(isSupportedLocale("")).toBe(false);
	});

	it("reads the locale cookie among unrelated cookies", () => {
		expect(localeFromCookie("a=1; coder_locale=zh-CN; b=2")).toBe("zh-CN");
	});

	it("ignores unsupported and malformed locale cookies", () => {
		expect(localeFromCookie("coder_locale=fr")).toBeUndefined();
		expect(localeFromCookie("coder_locale=%E0%A4%A")).toBeUndefined();
	});

	it("uses the provided default when the cookie is absent", () => {
		expect(initialLocale("", "zh-CN")).toBe("zh-CN");
		expect(initialLocale("", "en")).toBe("en");
	});

	it("persists a host-only locale cookie", () => {
		persistLocale("zh-CN");

		expect(document.cookie).toContain("coder_locale=zh-CN");
	});

	it("synchronizes the document and date locale", () => {
		applyLocale("zh-CN");

		expect(document.documentElement.lang).toBe("zh-CN");
		expect(dayjs.locale()).toBe("zh-cn");
		expect(intlLocale("zh-CN")).toBe("zh-CN");
		expect(intlLocale("en")).toBe("en-US");
	});
});
