import type * as TypesGen from "#/api/typesGenerated";
import { i18n } from "#/i18n";

const PROVIDER_STATUS_URLS: Record<string, string> = {
	anthropic: "https://status.anthropic.com",
};

const normalizeProvider = (provider?: string): string | undefined => {
	const normalized = provider?.trim().toLowerCase();
	if (!normalized) {
		return undefined;
	}

	switch (normalized) {
		case "azure openai":
		case "azure-openai":
			return "azure";
		case "openai compat":
		case "openai compatible":
		case "openai_compat":
			return "openai-compat";
		default:
			return normalized;
	}
};

export const getErrorTitle = (
	kind: TypesGen.ChatErrorKind,
	mode: "retry" | "error",
): string => {
	switch (kind) {
		case "overloaded":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.service_overloaded_449cf6a0",
			);
		case "rate_limit":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.rate_limited_a06130a5",
			);
		case "timeout":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.request_timed_out_7aa26ae7",
			);
		case "stream_silence_timeout":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.response_stalled_7f142ca4",
			);
		case "auth":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.authentication_failed_93821eb7",
			);
		case "config":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.configuration_error_0a48c29a",
			);
		case "usage_limit":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.usage_limit_reached_0e17661d",
			);
		case "missing_key":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.chat_interrupted_15a3fc83",
			);
		case "provider_disabled":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.provider_disabled_be14ad85",
			);
		case "content_filter":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.response_blocked_9c28467a",
			);
		case "hook_dispatch_failed":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.lifecycle_hook_failed_642c3cbe",
			);
		case "hook_denied":
			return i18n.t(
				"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.blocked_by_policy_dec64a50",
			);
		default:
			return mode === "retry"
				? i18n.t(
						"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.retrying_request_b6afe6e6",
					)
				: i18n.t(
						"agents:AgentsPage.components.ChatConversation.chatStatusHelpers.request_failed_cfce761b",
					);
	}
};

export const getProviderStatusURL = (
	kind: TypesGen.ChatErrorKind,
	provider?: string,
): string | undefined => {
	if (kind !== "overloaded") {
		return undefined;
	}
	const normalized = normalizeProvider(provider);
	return normalized ? PROVIDER_STATUS_URLS[normalized] : undefined;
};
