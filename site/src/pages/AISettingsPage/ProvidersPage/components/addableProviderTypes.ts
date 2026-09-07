import type { AIProviderType } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

export type AddableProvider = {
	value: AIProviderType;
	label: string;
};

export const addableProviders: readonly AddableProvider[] = [
	{
		value: "anthropic",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.anthropic_744205e4",
		),
	},
	{
		value: "bedrock",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.aws_bedrock_d3ba7b97",
		),
	},
	{
		value: "azure",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.azure_openai_76977023",
		),
	},
	{
		value: "copilot",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.github_copilot_ed249d41",
		),
	},
	{
		value: "google",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.google_ce770667",
		),
	},
	{
		value: "openai",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.openai_8b7d1a31",
		),
	},
	{
		value: "openai-compat",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.openai_compatible_790d883a",
		),
	},
	{
		value: "openrouter",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.openrouter_eb70c3bc",
		),
	},
	{
		value: "vercel",
		label: i18n.t(
			"agents:AISettingsPage.ProvidersPage.components.addableProviderTypes.vercel_68edc75c",
		),
	},
];
