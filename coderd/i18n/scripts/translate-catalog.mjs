#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const i18nRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const enPath = resolve(i18nRoot, "catalog/en.json");
const zhPath = resolve(i18nRoot, "catalog/zh-CN.json");
const english = JSON.parse(readFileSync(enPath, "utf8"));
const chinese = JSON.parse(readFileSync(zhPath, "utf8"));
const translateAll = process.argv.includes("--all");
const translateTemplates = process.argv.includes("--templates");
const normalizeOnly = process.argv.includes("--normalize");

const protectedTerms = [
	"Visual Studio Code",
	"VS Code",
	"WebSocket",
	"JavaScript",
	"TypeScript",
	"Kubernetes",
	"Terraform",
	"PostgreSQL",
	"JetBrains",
	"GitHub Copilot",
	"GitHub",
	"Vercel",
	"Bedrock",
	"Mantle",
	"InvokeModel",
	"Agents",
	"Agent",
	"Coder",
	"OAuth2",
	"OAuth",
	"OpenID",
	"Linux",
	"Windows",
	"macOS",
	"CLI",
	"API",
	"IDE",
	"SSH",
	"HTTP",
	"HTTPS",
	"SSE",
	"MCP",
	"Git",
	"JSON",
	"UUID",
	"URL",
	"OIDC",
	"SCIM",
	"DERP",
	"RBAC",
	"JWT",
	"PKCE",
	"Provisioner",
	"LLM",
];

const entries = new Map();
if (!normalizeOnly) {
	for (const [source, translation] of Object.entries(chinese.messages)) {
		if (translateAll || source === translation) {
			entries.set(`message:${source}`, source);
		}
	}
	for (const entry of chinese.templates) {
		const englishEntry = english.templates.find(
			({ source }) => source === entry.source,
		);
		if (
			englishEntry &&
			(translateAll ||
				translateTemplates ||
				entry.translation === englishEntry.translation)
		) {
			entries.set(`template:${entry.source}`, englishEntry.translation);
		}
	}
}

const translations = await translateEntries(entries);
for (const [key, translation] of translations) {
	const separator = key.indexOf(":");
	const kind = key.slice(0, separator);
	const source = key.slice(separator + 1);
	if (kind === "message") {
		chinese.messages[source] = translation;
	} else {
		const entry = chinese.templates.find((candidate) => candidate.source === source);
		entry.translation = translation;
	}
}

for (const [source, translation] of Object.entries(chinese.messages)) {
	chinese.messages[source] = normalizeTranslation(translation);
}
for (const entry of chinese.templates) {
	entry.translation = normalizeTranslation(entry.translation);
}

writeFileSync(zhPath, `${JSON.stringify(chinese, null, "\t")}\n`);

async function translateEntries(values) {
	if (values.size === 0) return new Map();
	const separator = "\n__CODER_I18N_SEPARATOR__\n";
	const batches = [];
	let batch = [];
	let length = 0;
	for (const [key, source] of values) {
		const protectedValue = protect(source);
		if (batch.length > 0 && length + protectedValue.text.length > 3000) {
			batches.push(batch);
			batch = [];
			length = 0;
		}
		batch.push({ key, source, ...protectedValue });
		length += protectedValue.text.length + separator.length;
	}
	if (batch.length > 0) batches.push(batch);

	const result = new Map();
	for (let index = 0; index < batches.length; index++) {
		const current = batches[index];
		const query = current.map((entry) => entry.text.trim()).join(separator);
		const url = new URL("https://clients5.google.com/translate_a/t");
		url.searchParams.set("client", "dict-chrome-ex");
		url.searchParams.set("sl", "en");
		url.searchParams.set("tl", "zh-CN");
		url.searchParams.set("q", query);
		const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
		if (!response.ok) {
			throw new Error(`translation request failed: ${response.status}`);
		}
		const payload = await response.json();
		const translated = payload[0].split(separator.trim());
		if (translated.length !== current.length) {
			throw new Error(`batch ${index + 1} returned ${translated.length} of ${current.length} translations`);
		}
		for (let item = 0; item < current.length; item++) {
			const entry = current[item];
			result.set(entry.key, restore(translated[item].trim(), entry.terms));
		}
		console.log(`Translated batch ${index + 1}/${batches.length}.`);
	}
	return result;
}

function protect(value) {
	let text = value;
	const terms = [];
	const patterns = [
		{ pattern: /\{\{[0-9]+\}\}/g },
		{ pattern: /https?:\/\/[^\s)\]}>,]+/gi },
		{ pattern: /--[a-z0-9-]+/gi },
		{ pattern: /\b[A-Z][A-Z0-9_]{2,}\b/g },
		{ pattern: /\b[a-z][a-z0-9]*_[a-z0-9_]+\b/g },
		{ pattern: /\b[a-z0-9]+(?:-[a-z0-9]+)+\b/g },
		{ pattern: /\/[a-z0-9_{}./-]+/gi },
		{
			pattern:
				/\b(?:ns|us|ms|KiB|MiB|GiB|TiB|KB|MB|GB|TB|kHz|MHz|GHz|Kbps|Mbps|Gbps)\b/g,
		},
		...[...protectedTerms]
			.sort((left, right) => right.length - left.length)
			.map((term) => ({
				canonical: term,
				pattern: new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"),
			})),
	];
	for (const { canonical, pattern } of patterns) {
		text = text.replace(pattern, (term) => {
			const token = `zxqplaceholder${String(terms.length).padStart(4, "0")}qxz`;
			terms.push([token, canonical ?? term]);
			return token;
		});
	}
	return { text, terms };
}

function restore(value, terms) {
	let restored = value;
	for (let index = terms.length - 1; index >= 0; index--) {
		const [token, term] = terms[index];
		restored = restored.replaceAll(token, term);
	}
	return restored;
}

function normalizeTranslation(value) {
	let normalized = value
		.replace(/\bworkspaces?\b/gi, "工作区")
		.replaceAll("工作空间", "工作区")
		.replace(/\btemplates?\b/gi, "模板")
		.replace(/\bOpenAI-compatible\b/gi, "OpenAI 兼容")
		.replaceAll("韦尔塞尔", "Vercel")
		.replaceAll("副驾驶", "Copilot")
		.replaceAll("基岩", "Bedrock")
		.replaceAll("碱基", "基础")
		.replaceAll("型号", "模型")
		.replaceAll("代币", "Token")
		.replaceAll("秘密", "密钥")
		.replaceAll("会员", "成员")
		.replaceAll("帐户", "账户")
		.replaceAll("路线", "路由")
		.replaceAll("配置程序", "Provisioner")
		.replaceAll("守护程序", "守护进程")
		.replaceAll("提供程序", "提供商");
	normalized = normalized
		.replace(/([\p{Script=Han}])\s+(工作区|模板)/gu, "$1$2")
		.replace(/(工作区|模板)\s+([\p{Script=Han}])/gu, "$1$2")
		.replaceAll("具有此名称的模板", "同名模板");
	for (const term of protectedTerms) {
		const escaped = escapeRegExp(term);
		normalized = normalized
			.replace(new RegExp(`([\\p{Script=Han}])(${escaped})`, "giu"), "$1 $2")
			.replace(new RegExp(`(${escaped})([\\p{Script=Han}])`, "giu"), "$1 $2");
	}
	return normalized;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
