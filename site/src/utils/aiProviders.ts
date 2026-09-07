import { i18n } from "#/i18n";
export const formatProviderLabel = (provider: string): string => {
	const normalized = provider.trim().toLowerCase();
	switch (normalized) {
		case "openai":
			return i18n.t("pages:aiProviders.openai_8b7d1a31");
		case "anthropic":
			return i18n.t("pages:aiProviders.anthropic_744205e4");
		case "azure":
			return i18n.t("pages:aiProviders.azure_openai_76977023");
		case "bedrock":
			return i18n.t("pages:aiProviders.aws_bedrock_d3ba7b97");
		case "google":
			return i18n.t("pages:aiProviders.google_ce770667");
		case "openai-compat":
		case "openai-compatible":
		case "openai_compatible":
			return i18n.t("pages:aiProviders.openai_compatible_790d883a");
		case "openrouter":
			return i18n.t("pages:aiProviders.openrouter_eb70c3bc");
		case "vercel":
			return i18n.t("pages:aiProviders.vercel_ai_gateway_7ddb0704");
		default:
			if (!normalized) {
				return i18n.t("pages:aiProviders.unknown_b764cdc0");
			}
			return `${normalized[0].toUpperCase()}${normalized.slice(1)}`;
	}
};
