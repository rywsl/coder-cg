import type * as TypesGen from "#/api/typesGenerated";
import { i18n } from "#/i18n";

export const SECRET_PLACEHOLDER = "••••••••••••••••";

export const TRANSPORT_OPTIONS = [
	{
		value: "streamable_http",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.streamable_http_e885e442",
		),
	},
	{ value: "sse", label: "SSE" },
] as const;

export const AUTH_TYPE_OPTIONS = [
	{
		value: "none",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.none_dc937b59",
		),
	},
	{
		value: "oauth2",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.oauth2_ead3e38f",
		),
	},
	{
		value: "api_key",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.api_key_16f0ee47",
		),
	},
	{
		value: "custom_headers",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.custom_headers_34cb675c",
		),
	},
	{
		value: "user_oidc",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.user_oidc_identity_de07354d",
		),
	},
] as const;

export const AUTH_TYPE_LABELS = Object.fromEntries(
	AUTH_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

export const AVAILABILITY_OPTIONS = [
	{
		value: "force_on",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.force_on_bde131e3",
		),
		description: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.always_injected_into_every_conversation_5f62c8bf",
		),
	},
	{
		value: "default_on",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.default_on_2a592bdc",
		),
		description: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.pre_selected_but_users_can_opt_out_b7e51dac",
		),
	},
	{
		value: "default_off",
		label: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.default_off_1216008b",
		),
		description: i18n.t(
			"agents:AISettingsPage.MCPServersPage.components.mcpServerFormLogic.available_but_users_must_opt_in_47ebf7a2",
		),
	},
] as const;

export const AVAILABILITY_LABELS = Object.fromEntries(
	AVAILABILITY_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

export interface MCPServerFormValues {
	displayName: string;
	slug: string;
	slugTouched: boolean;
	description: string;
	iconURL: string;
	url: string;
	transport: string;
	authType: string;
	oauth2ClientID: string;
	oauth2ClientSecret: string;
	oauth2SecretTouched: boolean;
	oauth2AuthURL: string;
	oauth2TokenURL: string;
	oauth2RevocationURL: string;
	oauth2Scopes: string;
	apiKeyHeader: string;
	apiKeyValue: string;
	apiKeyTouched: boolean;
	availability: string;
	enabled: boolean;
	modelIntent: boolean;
	allowInPlanMode: boolean;
	forwardCoderHeaders: boolean;
	toolAllowList: string;
	toolDenyList: string;
	customHeaders: Array<{ key: string; value: string }>;
	customHeadersTouched: boolean;
}

export const slugify = (value: string): string =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");

export const buildInitialMCPServerFormValues = (
	server?: TypesGen.MCPServerConfig,
): MCPServerFormValues => ({
	displayName: server?.display_name ?? "",
	slug: server?.slug ?? "",
	slugTouched: Boolean(server),
	description: server?.description ?? "",
	iconURL: server?.icon_url ?? "",
	url: server?.url ?? "",
	transport: server?.transport ?? "streamable_http",
	authType: server?.auth_type ?? "none",
	oauth2ClientID: server?.oauth2_client_id ?? "",
	oauth2ClientSecret: server?.has_oauth2_secret ? SECRET_PLACEHOLDER : "",
	oauth2SecretTouched: false,
	oauth2AuthURL: server?.oauth2_auth_url ?? "",
	oauth2TokenURL: server?.oauth2_token_url ?? "",
	oauth2RevocationURL: server?.oauth2_revocation_url ?? "",
	oauth2Scopes: server?.oauth2_scopes ?? "",
	apiKeyHeader: server?.api_key_header ?? "",
	apiKeyValue: server?.has_api_key ? SECRET_PLACEHOLDER : "",
	apiKeyTouched: false,
	availability: server?.availability ?? "default_off",
	enabled: server?.enabled ?? true,
	modelIntent: server?.model_intent ?? false,
	allowInPlanMode: server?.allow_in_plan_mode ?? false,
	forwardCoderHeaders: server?.forward_coder_headers ?? false,
	toolAllowList: server?.tool_allow_list.join(", ") ?? "",
	toolDenyList: server?.tool_deny_list.join(", ") ?? "",
	customHeaders: [],
	customHeadersTouched: false,
});

export const canSubmitMCPServerForm = (
	values: MCPServerFormValues,
	isDisabled: boolean,
): boolean =>
	!isDisabled &&
	values.displayName.trim() !== "" &&
	values.slug.trim() !== "" &&
	values.url.trim() !== "";

export const buildCreateMCPServerConfigRequest = (
	values: MCPServerFormValues,
): TypesGen.CreateMCPServerConfigRequest => {
	const toolAllowList = values.toolAllowList
		.split(",")
		.map((tool) => tool.trim())
		.filter(Boolean);
	const toolDenyList = values.toolDenyList
		.split(",")
		.map((tool) => tool.trim())
		.filter(Boolean);

	const request: TypesGen.CreateMCPServerConfigRequest = {
		display_name: values.displayName.trim(),
		slug: values.slug.trim(),
		description: values.description.trim(),
		icon_url: values.iconURL.trim(),
		url: values.url.trim(),
		transport: values.transport,
		auth_type: values.authType,
		availability: values.availability,
		enabled: values.enabled,
		model_intent: values.modelIntent,
		allow_in_plan_mode: values.allowInPlanMode,
		forward_coder_headers: values.forwardCoderHeaders,
		tool_allow_list: toolAllowList,
		tool_deny_list: toolDenyList,
	};

	if (values.authType === "oauth2") {
		const oauth2ClientSecret =
			values.oauth2SecretTouched &&
			values.oauth2ClientSecret !== SECRET_PLACEHOLDER &&
			values.oauth2ClientSecret !== ""
				? values.oauth2ClientSecret
				: undefined;

		return {
			...request,
			oauth2_client_id: values.oauth2ClientID.trim(),
			oauth2_client_secret: oauth2ClientSecret,
			oauth2_auth_url: values.oauth2AuthURL.trim() || undefined,
			oauth2_token_url: values.oauth2TokenURL.trim() || undefined,
			oauth2_revocation_url: values.oauth2RevocationURL.trim() || undefined,
			oauth2_scopes: values.oauth2Scopes.trim() || undefined,
		};
	}

	if (values.authType === "api_key") {
		const apiKeyValue =
			values.apiKeyTouched &&
			values.apiKeyValue !== SECRET_PLACEHOLDER &&
			values.apiKeyValue !== ""
				? values.apiKeyValue
				: undefined;

		return {
			...request,
			api_key_header: values.apiKeyHeader.trim() || undefined,
			api_key_value: apiKeyValue,
		};
	}

	if (values.authType === "custom_headers" && values.customHeadersTouched) {
		return {
			...request,
			custom_headers: Object.fromEntries(
				values.customHeaders
					.map(({ key, value }) => [key.trim(), value] as const)
					.filter(([key]) => key !== ""),
			),
		};
	}

	return request;
};

export const buildUpdateMCPServerConfigRequest = (
	values: MCPServerFormValues,
): TypesGen.UpdateMCPServerConfigRequest => {
	const base = buildCreateMCPServerConfigRequest(values);
	// The edit-page header toggle owns `enabled`; the form's copy is stale
	// relative to the toggle, so omit it from the update payload.
	const { enabled: _enabled, ...updateFields } = base;
	return {
		...updateFields,
		// Always sent: an omitted field keeps the stored value, "" clears it.
		...(values.authType === "oauth2" && {
			oauth2_revocation_url: values.oauth2RevocationURL.trim(),
		}),
		tool_allow_list: [...(base.tool_allow_list ?? [])],
		tool_deny_list: [...(base.tool_deny_list ?? [])],
	};
};
