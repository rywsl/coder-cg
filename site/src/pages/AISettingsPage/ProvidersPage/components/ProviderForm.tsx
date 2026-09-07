import { useFormik } from "formik";
import { TriangleAlertIcon } from "lucide-react";
import { type FC, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import * as Yup from "yup";
import type {
	AIProviderBedrockProtocol,
	AIProviderType,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { Form, FormFields } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import { Label } from "#/components/Label/Label";
import { Link as DocsLink } from "#/components/Link/Link";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import { useUnsavedChangesPrompt } from "#/hooks/useUnsavedChangesPrompt";
import { i18n } from "#/i18n";
import { docs } from "#/utils/docs";
import { getFormHelpers } from "#/utils/formUtils";
import { CredentialField } from "./CredentialField";

export type ProviderFormValues = {
	type: AIProviderType | "";
	name: string;
	displayName: string;
	icon: string;
	baseUrl: string;
	protocol: AIProviderBedrockProtocol;
	model: string;
	smallFastModel: string;
	accessKey: string;
	accessKeySecret: string;
	roleArn: string;
	apiKey: string;
	enabled: boolean;
};

// AWS Bedrock InvokeModel URL, e.g. https://bedrock-runtime.{region}.amazonaws.com
const BEDROCK_INVOKE_MODEL_URL_REGEX =
	/^https:\/\/bedrock-runtime\.([a-z0-9-]+)\.amazonaws\.com\/?$/i;
// AWS Bedrock Mantle URL, e.g. https://bedrock-mantle.{region}.api.aws/anthropic
const BEDROCK_MANTLE_URL_REGEX =
	/^https:\/\/bedrock-mantle\.([a-z0-9-]+)\.api\.aws\/anthropic\/?$/i;
const PROVIDER_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SAVED_CREDENTIAL_MASK = "********";

// The region lives in the same subdomain slot for both the InvokeModel host
// (bedrock-runtime.{region}.amazonaws.com) and the mantle host
// (bedrock-mantle.{region}.api.aws), so either shape yields the region.
export const parseBedrockRegionFromBaseUrl = (
	baseUrl: string,
): string | undefined => {
	const trimmed = baseUrl.trim();
	const match =
		BEDROCK_INVOKE_MODEL_URL_REGEX.exec(trimmed) ??
		BEDROCK_MANTLE_URL_REGEX.exec(trimmed);
	return match?.[1]?.toLowerCase();
};

const makeNameSchema = (editing: boolean) =>
	editing
		? Yup.string()
		: Yup.string()
				.matches(
					PROVIDER_NAME_REGEX,
					i18n.t(
						"agents:AISettingsPage.ProvidersPage.components.ProviderForm.name_must_be_lowercase_hyphen_separated_e_g_my_a_0d4201a7",
					),
				)
				.required(
					i18n.t(
						"agents:AISettingsPage.ProvidersPage.components.ProviderForm.name_is_required_604fd1b2",
					),
				);

// Display name is always optional. The form copy says blank falls back
// to the provider name, and the update API supports clearing the value.
const makeDisplayNameSchema = (_editing: boolean) => Yup.string();

const defaultInitialValues: ProviderFormValues = {
	type: "anthropic",
	name: "",
	displayName: "",
	icon: "",
	baseUrl: "",
	protocol: "invoke-model",
	model: "",
	smallFastModel: "",
	accessKey: "",
	accessKeySecret: "",
	roleArn: "",
	apiKey: "",
	enabled: true,
};

// Base URL prefills used when switching the Bedrock protocol. The region is
// preserved from whatever the user already entered, falling back to us-east-1.
const BEDROCK_DEFAULT_REGION = "us-east-1";
const bedrockInvokeModelBaseUrl = (region: string) =>
	`https://bedrock-runtime.${region}.amazonaws.com`;
const bedrockMantleBaseUrl = (region: string) =>
	`https://bedrock-mantle.${region}.api.aws/anthropic`;

// Bedrock model defaults mirror codersdk/deployment.go's
// aiGatewayBedrockModel and aiGatewayBedrockSmallFastModel defaults
// so the create form lands on the same models the env-seeded path
// uses. Update both sides together when AWS publishes new model IDs.
const BEDROCK_DEFAULT_MODEL =
	"global.anthropic.claude-sonnet-4-5-20250929-v1:0";
const BEDROCK_DEFAULT_SMALL_FAST_MODEL =
	"global.anthropic.claude-haiku-4-5-20251001-v1:0";
const BEDROCK_MODEL_CARDS_URL =
	"https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards.html";

const providerDefaults: Partial<
	Record<AIProviderType, Partial<ProviderFormValues>>
> = {
	openai: { name: "openai", baseUrl: "https://api.openai.com/v1/" },
	anthropic: { name: "anthropic", baseUrl: "https://api.anthropic.com" },
	bedrock: {
		name: "bedrock",
		baseUrl: bedrockInvokeModelBaseUrl(BEDROCK_DEFAULT_REGION),
		model: BEDROCK_DEFAULT_MODEL,
		smallFastModel: BEDROCK_DEFAULT_SMALL_FAST_MODEL,
	},
	azure: {
		name: "azure",
		baseUrl: "https://YOUR-RESOURCE.openai.azure.com/openai/v1",
	},
	copilot: {
		name: "copilot",
		baseUrl: "https://api.business.githubcopilot.com",
	},
	google: {
		name: "google",
		baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
	},
	"openai-compat": { name: "openai-compat", baseUrl: "" },
	openrouter: { name: "openrouter", baseUrl: "https://openrouter.ai/api/v1" },
	vercel: { name: "vercel", baseUrl: "https://ai-gateway.vercel.sh/v1" },
};

const baseUrlPlaceholders: Partial<Record<AIProviderType, string>> = {
	"openai-compat": "https://provider.example.com/v1",
};

const makeOpenAiAnthropicSchema = (editing: boolean) =>
	Yup.object({
		type: Yup.string()
			.oneOf([
				"openai",
				"anthropic",
				"azure",
				"google",
				"openai-compat",
				"openrouter",
				"vercel",
			] as const)
			.required(),
		name: makeNameSchema(editing),
		displayName: makeDisplayNameSchema(editing),
		icon: Yup.string(),
		// URL shape is validated by the backend; the form only checks presence.
		baseUrl: Yup.string().required(
			i18n.t(
				"agents:AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_is_required_e644e085",
			),
		),
		apiKey: editing
			? Yup.string()
			: Yup.string().required(
					i18n.t(
						"agents:AISettingsPage.ProvidersPage.components.ProviderForm.api_key_is_required_59b831ea",
					),
				),
		enabled: Yup.boolean(),
	});

const credentialFilled = (value: string | undefined): boolean => {
	if (!value) return false;
	const trimmed = value.trim();
	return trimmed !== "" && trimmed !== SAVED_CREDENTIAL_MASK;
};

const BEDROCK_ACCESS_KEY_PAIRED_MESSAGE = i18n.t(
	"agents:AISettingsPage.ProvidersPage.components.ProviderForm.enter_both_access_key_and_secret_or_leave_both_b_cf872347",
);

// Bedrock access keys are optional: when both are blank the server
// falls back to ambient AWS credentials (IAM role, AWS_PROFILE, IRSA,
// instance profile). Yup still requires them to be supplied as a pair
// so a half-typed rotation does not slip through.
const makeBedrockSchema = (editing: boolean) =>
	Yup.object({
		type: Yup.string()
			.oneOf(["bedrock"] as const)
			.required(),
		name: makeNameSchema(editing),
		displayName: makeDisplayNameSchema(editing),
		icon: Yup.string(),
		protocol: Yup.string()
			.oneOf(["invoke-model", "mantle"] as const)
			.required(),
		baseUrl: Yup.string()
			.when("protocol", {
				is: "mantle",
				then: (schema) =>
					schema.matches(
						BEDROCK_MANTLE_URL_REGEX,
						i18n.t(
							"agents:AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_must_be_a_bedrock_mantle_url_https_bedr_8852084b",
						),
					),
				otherwise: (schema) =>
					schema.matches(
						BEDROCK_INVOKE_MODEL_URL_REGEX,
						i18n.t(
							"agents:AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_must_be_a_bedrock_invokemodel_url_https_ea6b03d0",
						),
					),
			})
			.required(
				i18n.t(
					"agents:AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_is_required_e644e085",
				),
			),
		apiKey: Yup.string(),
		// Mantle passthrough forwards the model chosen by the client, so the
		// model fields are not configured on the provider.
		model: Yup.string().when("protocol", {
			is: (protocol: string) => protocol !== "mantle",
			then: (schema) =>
				schema.required(
					i18n.t(
						"agents:AISettingsPage.ProvidersPage.components.ProviderForm.model_is_required_58221dcf",
					),
				),
			otherwise: (schema) => schema,
		}),
		smallFastModel: Yup.string().when("protocol", {
			is: (protocol: string) => protocol !== "mantle",
			then: (schema) =>
				schema.required(
					i18n.t(
						"agents:AISettingsPage.ProvidersPage.components.ProviderForm.small_fast_model_is_required_f6ea5400",
					),
				),
			otherwise: (schema) => schema,
		}),
		accessKey: Yup.string().test(
			"access-key-paired",
			BEDROCK_ACCESS_KEY_PAIRED_MESSAGE,
			function (value) {
				const secret = (this.parent as { accessKeySecret?: string })
					.accessKeySecret;
				return !(credentialFilled(secret) && !credentialFilled(value));
			},
		),
		accessKeySecret: Yup.string().test(
			"access-key-secret-paired",
			BEDROCK_ACCESS_KEY_PAIRED_MESSAGE,
			function (value) {
				const accessKey = (this.parent as { accessKey?: string }).accessKey;
				return !(credentialFilled(accessKey) && !credentialFilled(value));
			},
		),
		enabled: Yup.boolean(),
	});

const makeCopilotSchema = (editing: boolean) =>
	Yup.object({
		type: Yup.string()
			.oneOf(["copilot"] as const)
			.required(),
		name: makeNameSchema(editing),
		displayName: makeDisplayNameSchema(editing),
		icon: Yup.string(),
		baseUrl: Yup.string().required(
			i18n.t(
				"agents:AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_is_required_e644e085",
			),
		),
		enabled: Yup.boolean(),
	});

const getProviderFormSchema = (editing: boolean) =>
	Yup.lazy((value: { type?: AIProviderType } | undefined) => {
		switch (value?.type) {
			case "openai":
			case "anthropic":
			case "azure":
			case "google":
			case "openai-compat":
			case "openrouter":
			case "vercel":
				return makeOpenAiAnthropicSchema(editing);
			case "bedrock":
				return makeBedrockSchema(editing);
			case "copilot":
				return makeCopilotSchema(editing);
			default:
				return Yup.object({
					type: Yup.string()
						.oneOf([
							"openai",
							"anthropic",
							"bedrock",
							"azure",
							"copilot",
							"google",
							"openai-compat",
							"openrouter",
							"vercel",
						])
						.required(),
				});
		}
	});

type ProviderFormProps = {
	editing?: boolean;
	/** When editing Bedrock and the API already has keys, show masked placeholders until cleared. */
	bedrockSavedAccessCredentials?: boolean;
	/** Server-generated STS external ID, shown read-only when a role is assumed. */
	bedrockExternalId?: string;
	/** When editing openai/anthropic and a key is on file, show a masked placeholder until cleared. */
	openAiAnthropicSavedApiKey?: boolean;
	/** Masked rendering of the saved openai/anthropic key (e.g. `sk-***...ABCD`). Falls back to a generic mask when omitted. */
	openAiAnthropicMaskedApiKey?: string;
	initialValues?: Partial<ProviderFormValues>;
	/** Fires whenever the icon field changes, so page headers can preview it. */
	onIconChange?: (icon: string) => void;
	onSubmit?: (values: ProviderFormValues) => void;
	isLoading?: boolean;
	submitError?: unknown;
};

const namePlaceholder = (provider: string) =>
	providerDefaults[provider as keyof typeof providerDefaults]?.name;

const apiKeyPlaceholder = (provider: string) => {
	switch (provider) {
		case "openai":
			return "sk-proj-...";
		case "anthropic":
			return "sk-ant-...";
	}
};

const baseUrlPlaceholder = (provider: string) =>
	baseUrlPlaceholders[provider as keyof typeof baseUrlPlaceholders] ??
	providerDefaults[provider as keyof typeof providerDefaults]?.baseUrl;

export const ProviderForm: FC<ProviderFormProps> = ({
	editing = false,
	bedrockSavedAccessCredentials = false,
	bedrockExternalId,
	openAiAnthropicSavedApiKey = false,
	openAiAnthropicMaskedApiKey,
	initialValues,
	onIconChange,
	onSubmit,
	isLoading = false,
	submitError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const resolvedType = initialValues?.type ?? defaultInitialValues.type;
	const typeDefaults =
		providerDefaults[resolvedType as keyof typeof providerDefaults];

	// Seed Bedrock credentials with the mask when on file; focus clears it,
	// and a re-submitted "" tells the API mapping to keep the value.
	const maskedAccessKey = bedrockSavedAccessCredentials
		? SAVED_CREDENTIAL_MASK
		: "";
	const maskedAccessKeySecret = bedrockSavedAccessCredentials
		? SAVED_CREDENTIAL_MASK
		: "";
	// Same pattern for openai/anthropic. Prefer the API-supplied masked
	// rendering so the user sees the key's identifying suffix.
	const maskedApiKey = openAiAnthropicSavedApiKey
		? (openAiAnthropicMaskedApiKey ?? SAVED_CREDENTIAL_MASK)
		: "";

	const didSubmit = useRef(false);
	const form = useFormik<ProviderFormValues>({
		initialValues: {
			...defaultInitialValues,
			// Layer order: base defaults < type prefills < parent's initialValues.
			// Edit overrides prefills with server values; create gets them as-is.
			...(typeDefaults ?? {}),
			...initialValues,
			accessKey: maskedAccessKey,
			accessKeySecret: maskedAccessKeySecret,
			apiKey: maskedApiKey,
		},
		validationSchema: getProviderFormSchema(editing),
		validateOnMount: true,
		onSubmit: (values) => {
			didSubmit.current = true;
			return onSubmit?.(values);
		},
	});
	const getFieldHelpers = getFormHelpers(form, submitError);

	const handleIconChange = (value: string) => {
		void form.setFieldValue("icon", value);
		onIconChange?.(value);
	};

	const iconField = (
		<div className="flex flex-col gap-2">
			<Label htmlFor="icon">
				{tI18n(
					"AISettingsPage.ProvidersPage.components.ProviderForm.icon_a35abcd6",
				)}
			</Label>
			<div className="text-xs text-content-secondary">
				{tI18n(
					"AISettingsPage.ProvidersPage.components.ProviderForm.optional_url_or_emoji_shown_for_this_provider_0a51f6a1",
				)}
			</div>
			<IconField
				id="icon"
				value={form.values.icon}
				label={null}
				onChange={(event) => handleIconChange(event.target.value)}
				onPickEmoji={handleIconChange}
			/>
		</div>
	);

	const typeSelectValue = form.values.type;

	// Clears the field once if it's still showing the seeded mask;
	// subsequent focuses are no-ops.
	const handleCredentialFocus = (
		field: "apiKey" | "accessKey" | "accessKeySecret",
	) => {
		const initial = form.initialValues[field];
		if (form.values[field] === initial && initial !== "") {
			void form.setFieldValue(field, "");
		}
	};

	// Restores the mask when the user leaves the field without entering
	// a new value, keeping the saved-credential appearance.
	const handleCredentialBlur = (
		field: "apiKey" | "accessKey" | "accessKeySecret",
	) => {
		const initial = form.initialValues[field];
		if (form.values[field] === "" && initial !== "") {
			void form.setFieldValue(field, initial);
		}
	};

	// Switching protocols rewrites the base URL to the matching host, keeping
	// the region the user already entered so they do not retype it.
	const handleBedrockProtocolChange = (protocol: AIProviderBedrockProtocol) => {
		const region =
			parseBedrockRegionFromBaseUrl(form.values.baseUrl) ??
			BEDROCK_DEFAULT_REGION;
		const baseUrl =
			protocol === "mantle"
				? bedrockMantleBaseUrl(region)
				: bedrockInvokeModelBaseUrl(region);
		void form.setValues({ ...form.values, protocol, baseUrl });
	};

	const isMantle = form.values.protocol === "mantle";

	// When the parent's mutation finishes without an error, treat the just-
	// submitted values as the new baseline so the unsaved-changes prompt does
	// not fire on subsequent navigations. React Query reports a missing error
	// as `null`, so a truthy check covers both null and undefined.
	const previousIsLoading = useRef(isLoading);
	useEffect(() => {
		if (previousIsLoading.current && !isLoading) {
			if (didSubmit.current && !submitError) {
				// Restore credential fields to their initial masked sentinels so
				// the raw key is never left visible after a successful save.
				const remaskedValues = {
					...form.values,
					apiKey: maskedApiKey,
					accessKey: maskedAccessKey,
					accessKeySecret: maskedAccessKeySecret,
				};
				form.resetForm({ values: remaskedValues });
			}
			didSubmit.current = false;
		}
		previousIsLoading.current = isLoading;
	}, [
		isLoading,
		submitError,
		form,
		maskedApiKey,
		maskedAccessKey,
		maskedAccessKeySecret,
	]);

	const unsavedChanges = useUnsavedChangesPrompt(
		form.dirty && !form.isSubmitting,
	);

	return (
		<Form onSubmit={form.handleSubmit}>
			<FormFields>
				{Boolean(submitError) && <ErrorAlert error={submitError} />}
				{typeSelectValue !== "" && typeSelectValue !== "bedrock" && (
					<>
						<div className="grid grid-cols-2 items-start gap-4">
							<FormField
								required
								field={getFieldHelpers("name")}
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.name_dcd1d522",
								)}
								description={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.unique_identifier_used_in_urls_can_t_be_changed_637196f5",
								)}
								className="w-full"
								placeholder={namePlaceholder(form.values.type)}
								disabled={editing}
							/>
							<FormField
								field={getFieldHelpers("displayName")}
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.display_name_2b7f6a84",
								)}
								description={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.friendly_name_defaults_to_name_if_blank_212d32e4",
								)}
								className="w-full"
							/>
						</div>
						{iconField}
						<FormField
							required
							field={getFieldHelpers("baseUrl", {
								backendFieldName: "base_url",
							})}
							label={tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_3df9726c",
							)}
							description={
								typeSelectValue === "copilot" ? (
									<>
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.the_base_url_for_your_copilot_tier_baad719f",
										)}{" "}
										<code>https://api.individual.githubcopilot.com</code>,{" "}
										<code>https://api.business.githubcopilot.com</code>
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.or_3d30020b",
										)}{" "}
										<code>https://api.enterprise.githubcopilot.com</code>.
									</>
								) : (
									tI18n(
										"AISettingsPage.ProvidersPage.components.ProviderForm.the_base_url_where_the_provider_s_api_is_hosted_a25deddf",
									)
								)
							}
							className="w-full"
							placeholder={baseUrlPlaceholder(form.values.type)}
						/>
						{typeSelectValue === "copilot" ? (
							<p className="text-sm text-content-secondary m-0">
								{tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.copilot_authenticates_with_each_user_s_github_oa_55687d18",
								)}
							</p>
						) : (
							<CredentialField
								required
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.api_key_16f0ee47",
								)}
								helpers={getFieldHelpers("apiKey")}
								onBlur={() => handleCredentialBlur("apiKey")}
								onFocus={() => handleCredentialFocus("apiKey")}
								autoComplete="new-password"
								placeholder={apiKeyPlaceholder(form.values.type)}
							/>
						)}
					</>
				)}

				{typeSelectValue === "bedrock" && (
					<>
						<div className="grid grid-cols-2 items-start gap-4">
							<FormField
								required
								field={getFieldHelpers("name")}
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.name_dcd1d522",
								)}
								description={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.unique_identifier_used_in_urls_can_t_be_changed_637196f5",
								)}
								className="w-full"
								placeholder={namePlaceholder(form.values.type)}
								disabled={editing}
							/>
							<FormField
								field={getFieldHelpers("displayName")}
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.display_name_2b7f6a84",
								)}
								description={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.friendly_name_defaults_to_name_if_blank_212d32e4",
								)}
								className="w-full"
							/>
						</div>
						{iconField}
						<div className="flex flex-col gap-2">
							<Label htmlFor="bedrock-protocol">
								{tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.protocol_cf088334",
								)}
							</Label>
							<Select
								value={form.values.protocol}
								onValueChange={(value) =>
									handleBedrockProtocolChange(
										value as AIProviderBedrockProtocol,
									)
								}
							>
								<SelectTrigger id="bedrock-protocol" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="invoke-model">
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.invokemodel_c72cf967",
										)}
									</SelectItem>
									<SelectItem value="mantle">
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.mantle_ae66fdba",
										)}
									</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-content-secondary m-0">
								{isMantle
									? tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.newer_anthropic_compatible_bedrock_endpoint_reco_f327a00f",
										)
									: tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.legacy_bedrock_runtime_api_still_supported_mantl_7a3ea598",
										)}
							</p>
						</div>
						<FormField
							required
							field={getFieldHelpers("baseUrl", {
								backendFieldName: "base_url",
							})}
							label={tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.endpoint_3df9726c",
							)}
							description={
								<>
									{tI18n(
										"AISettingsPage.ProvidersPage.components.ProviderForm.in_the_format_of_f3674a02",
									)}{" "}
									<code>
										{isMantle
											? "https://bedrock-mantle.{region}.api.aws/anthropic"
											: "https://bedrock-runtime.{region}.amazonaws.com"}
									</code>
								</>
							}
							className="w-full"
							placeholder={
								isMantle
									? bedrockMantleBaseUrl(BEDROCK_DEFAULT_REGION)
									: baseUrlPlaceholder(form.values.type)
							}
						/>
						{!isMantle && (
							<>
								<div className="grid grid-cols-2 items-start gap-4">
									<FormField
										required
										field={getFieldHelpers("model")}
										label={tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.model_5e2c614c",
										)}
										className="w-full"
										placeholder={BEDROCK_DEFAULT_MODEL}
									/>
									<FormField
										required
										field={getFieldHelpers("smallFastModel")}
										label={tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.small_fast_model_45d78430",
										)}
										className="w-full"
										placeholder={BEDROCK_DEFAULT_SMALL_FAST_MODEL}
									/>
								</div>
								<p className="text-xs text-content-secondary m-0">
									{tI18n(
										"AISettingsPage.ProvidersPage.components.ProviderForm.find_available_bedrock_model_ids_in_the_f1c0575b",
									)}{" "}
									<DocsLink
										size="sm"
										href={BEDROCK_MODEL_CARDS_URL}
										target="_blank"
										rel="noreferrer"
									>
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderForm.aws_bedrock_model_cards_b8ebdfad",
										)}
									</DocsLink>
									.
								</p>
							</>
						)}
						<div className="grid grid-cols-2 items-start gap-4">
							<CredentialField
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.access_key_8663b0d4",
								)}
								helpers={getFieldHelpers("accessKey")}
								onBlur={() => handleCredentialBlur("accessKey")}
								onFocus={() => handleCredentialFocus("accessKey")}
								autoComplete="new-password"
							/>
							<CredentialField
								label={tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.access_key_secret_96cc3983",
								)}
								helpers={getFieldHelpers("accessKeySecret")}
								onBlur={() => handleCredentialBlur("accessKeySecret")}
								onFocus={() => handleCredentialFocus("accessKeySecret")}
								autoComplete="new-password"
							/>
						</div>
						<p className="text-xs text-content-secondary m-0">
							{tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.optional_leave_both_fields_blank_to_authenticate_5716ca65",
							)}{" "}
							<DocsLink
								size="sm"
								href={docs("/ai-coder/ai-gateway/providers#amazon-bedrock")}
								target="_blank"
								rel="noreferrer"
							>
								{tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.view_docs_61479fda",
								)}
							</DocsLink>
						</p>
						<FormField
							field={getFieldHelpers("roleArn")}
							label={tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.role_arn_6cbb6f1d",
							)}
							className="w-full"
							placeholder={tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.arn_aws_iam_123456789012_role_bedrockrole_6b155a5b",
							)}
						/>
						<p className="text-xs text-content-secondary m-0">
							{tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.optional_when_a_role_arn_is_set_the_gateway_assu_df5ff74e",
							)}
						</p>
						{editing && bedrockExternalId && (
							<div className="flex flex-col gap-2">
								<Label>
									{tI18n(
										"AISettingsPage.ProvidersPage.components.ProviderForm.external_id_69da56ba",
									)}
								</Label>
								<CodeExample secret={false} code={bedrockExternalId} />
								<p className="text-xs text-content-secondary m-0">
									{tI18n(
										"AISettingsPage.ProvidersPage.components.ProviderForm.server_generated_add_it_to_the_assumed_role_s_tr_ca2c5302",
									)}
									<code>sts:ExternalId</code>
									{tI18n(
										"AISettingsPage.ProvidersPage.components.ProviderForm.condition_so_only_this_deployment_can_assume_the_9936222a",
									)}
								</p>
							</div>
						)}
					</>
				)}

				<div className="flex justify-end gap-4">
					<Link to="/ai/settings/providers">
						<Button variant="outline" type="button">
							{tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.cancel_19766ed6",
							)}
						</Button>
					</Link>
					<Button
						disabled={isLoading || !form.isValid || (editing && !form.dirty)}
						type="submit"
					>
						<Spinner loading={isLoading} />
						{editing
							? tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.update_provider_09ab4ff0",
								)
							: tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderForm.add_provider_8cd1856b",
								)}
					</Button>
				</div>
			</FormFields>
			<ConfirmDialog
				type="info"
				hideCancel={false}
				open={unsavedChanges.isOpen}
				onClose={unsavedChanges.onCancel}
				onConfirm={unsavedChanges.onConfirm}
				title={tI18n(
					"AISettingsPage.ProvidersPage.components.ProviderForm.unsaved_changes_a710c2b9",
				)}
				confirmText={tI18n(
					"AISettingsPage.ProvidersPage.components.ProviderForm.confirm_eebdd24a",
				)}
				description={
					<div className="flex items-start gap-3">
						<TriangleAlertIcon className="size-icon-sm mt-1 shrink-0" />
						<p className="m-0">
							{tI18n(
								"AISettingsPage.ProvidersPage.components.ProviderForm.your_updates_haven_t_been_saved_leave_anyway_0230d6de",
							)}
						</p>
					</div>
				}
			/>
		</Form>
	);
};
