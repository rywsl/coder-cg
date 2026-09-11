import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

const protectedTerms = [
	"Coder",
	"CLI",
	"API",
	"IDE",
	"IdP",
	"URL",
	"AI",
	"Premium",
	"OpenAI",
	"Anthropic",
	"AWS Bedrock",
	"Azure OpenAI",
	"DigitalOcean",
	"Google",
	"Google Cloud",
	"OpenRouter",
	"Vercel",
	"Vercel AI Gateway",
	"GitHub Copilot",
	"Bedrock",
	"Bedrock Mantle",
] as const;

const canonicalTechnicalTerms = [
	{ name: "Agent", source: /\bagents?\b/i, translation: /\bAgents?\b/i },
	{
		name: "Subagent",
		source: /\bsubagents?\b/i,
		translation: /\b(?:Subagents?|Agents?)\b/i,
	},
	{ name: "Token", source: /\btokens?\b/i, translation: /\bTokens?\b/i },
	{
		name: "Provisioner",
		source: /\bprovisioners?\b/i,
		translation: /\bProvisioners?\b/i,
	},
] as const;

const localizedProductTerms = [
	{
		name: "Workspace",
		source: /\bworkspaces?\b/i,
		translation: "工作区",
		untranslated: /\bWorkspaces?\b/i,
	},
	{
		name: "Template",
		source: /\btemplates?\b/i,
		translation: "模板",
		untranslated: /\bTemplates?\b/i,
	},
] as const;

describe("translation catalogs", () => {
	const english = flatten(en);
	const chinese = flatten(zhCN);

	it("has matching non-empty keys and interpolation variables", () => {
		expect([...chinese.keys()].sort()).toEqual([...english.keys()].sort());
		for (const [key, source] of english) {
			const translation = chinese.get(key);
			expect(translation, key).toBeTruthy();
			expect(placeholders(translation ?? ""), key).toEqual(
				placeholders(source),
			);
			expect(translation, key).not.toMatch(/ZXQTERM|zxqplaceholder/i);
		}
	});

	it("preserves technical terms and localizes product terminology", () => {
		for (const [key, source] of english) {
			const translation = chinese.get(key) ?? "";
			for (const term of protectedTerms) {
				const pattern = new RegExp(`\\b${term}\\b`, "i");
				if (pattern.test(source)) {
					expect(translation, `${key}: ${term}`).toMatch(pattern);
				}
			}
			for (const term of canonicalTechnicalTerms) {
				if (term.source.test(source)) {
					expect(translation, `${key}: ${term.name}`).toMatch(term.translation);
				}
			}
			for (const term of localizedProductTerms) {
				if (term.source.test(source)) {
					expect(translation, `${key}: ${term.name}`).toContain(
						term.translation,
					);
					expect(translation, `${key}: ${term.name}`).not.toMatch(
						term.untranslated,
					);
				}
			}
		}
	});

	it("rejects known machine-translation errors", () => {
		for (const [key, source] of english) {
			const translation = chinese.get(key) ?? "";
			expect(translation, key).not.toMatch(
				/女士|救命|已救援|韦尔塞尔|GitHub 副驾驶|基岩/,
			);
			if (source.trim() === "ms") {
				expect(translation, key).toBe("毫秒");
			}
		}
	});
});

function flatten(
	value: object,
	prefix = "",
	result = new Map<string, string>(),
): Map<string, string> {
	for (const [key, child] of Object.entries(value)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (typeof child === "string") {
			result.set(fullKey, child);
		} else if (child && typeof child === "object") {
			flatten(child, fullKey, result);
		}
	}
	return result;
}

function placeholders(value: string): string[] {
	return [...value.matchAll(/\{\{\s*([^},\s]+)/g)]
		.map((match) => match[1])
		.sort();
}
