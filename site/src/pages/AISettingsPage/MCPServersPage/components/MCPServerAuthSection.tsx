import type { FormikContextType } from "formik";
import { PlusIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { Input } from "#/components/Input/Input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { passwordManagerIgnoreProps } from "#/utils/formUtils";
import { Field } from "./MCPServerFormFieldPrimitives";
import {
	AUTH_TYPE_OPTIONS,
	type MCPServerFormValues,
	SECRET_PLACEHOLDER,
} from "./mcpServerFormLogic";

interface MCPServerAuthFieldsProps {
	form: FormikContextType<MCPServerFormValues>;
	formId: string;
	disabled: boolean;
}

interface MCPServerAuthSectionProps extends MCPServerAuthFieldsProps {
	canSelectUserOIDC: boolean;
}

export const MCPServerAuthSection: FC<MCPServerAuthSectionProps> = ({
	form,
	formId,
	disabled,
	canSelectUserOIDC,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const authTypeOptions = AUTH_TYPE_OPTIONS.filter(
		(option) =>
			option.value !== "user_oidc" ||
			canSelectUserOIDC ||
			form.initialValues.authType === "user_oidc",
	);

	return (
		<>
			<Field
				label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.authentication_method_fc6a54d8",
				)}
				htmlFor={`${formId}-auth`}
				className="max-w-md"
			>
				<Select
					value={form.values.authType}
					onValueChange={(value) => void form.setFieldValue("authType", value)}
					disabled={disabled}
				>
					<SelectTrigger id={`${formId}-auth`} className="shadow-none">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{authTypeOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			{form.values.authType === "oauth2" && (
				<OAuth2Fields form={form} formId={formId} disabled={disabled} />
			)}
			{form.values.authType === "api_key" && (
				<APIKeyFields form={form} formId={formId} disabled={disabled} />
			)}
			{form.values.authType === "custom_headers" && (
				<CustomHeadersFields form={form} formId={formId} disabled={disabled} />
			)}
			{form.values.authType === "user_oidc" && (
				<p className="m-0 text-sm text-content-secondary">
					{tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.coder_will_forward_the_user_s_oidc_identity_to_t_ab0f3456",
					)}
				</p>
			)}
		</>
	);
};

const OAuth2Fields: FC<MCPServerAuthFieldsProps> = ({
	form,
	formId,
	disabled,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="space-y-5">
			<p className="m-0 text-sm text-content-secondary">
				{tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.register_a_client_with_the_external_mcp_server_s_aa47736d",
				)}
			</p>
			<div className="grid items-start gap-4 sm:grid-cols-2">
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.client_id_8726db01",
					)}
					htmlFor={`${formId}-oauth-id`}
				>
					<Input
						id={`${formId}-oauth-id`}
						className="shadow-none"
						{...form.getFieldProps("oauth2ClientID")}
						disabled={disabled}
					/>
				</Field>
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.client_secret_4aded5fa",
					)}
					htmlFor={`${formId}-oauth-secret`}
				>
					<SecretInput
						id={`${formId}-oauth-secret`}
						value={form.values.oauth2ClientSecret}
						touched={form.values.oauth2SecretTouched}
						onTouch={() => void form.setFieldValue("oauth2SecretTouched", true)}
						onValueChange={(value) =>
							void form.setFieldValue("oauth2ClientSecret", value)
						}
						onReset={() =>
							void form.setFieldValue("oauth2SecretTouched", false)
						}
						disabled={disabled}
					/>
				</Field>
			</div>
			<div className="grid items-start gap-4 sm:grid-cols-2">
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.authorization_url_c70b5f2b",
					)}
					htmlFor={`${formId}-oauth-auth-url`}
				>
					<Input
						id={`${formId}-oauth-auth-url`}
						className="placeholder:text-content-disabled shadow-none"
						{...form.getFieldProps("oauth2AuthURL")}
						placeholder="https://"
						disabled={disabled}
					/>
				</Field>
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.token_url_431e0036",
					)}
					htmlFor={`${formId}-oauth-token-url`}
				>
					<Input
						id={`${formId}-oauth-token-url`}
						className="placeholder:text-content-disabled shadow-none"
						{...form.getFieldProps("oauth2TokenURL")}
						disabled={disabled}
					/>
				</Field>
			</div>
			<div className="grid items-start gap-4 sm:grid-cols-2">
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.revocation_url_a6cc6ed3",
					)}
					htmlFor={`${formId}-oauth-revocation-url`}
				>
					<Input
						id={`${formId}-oauth-revocation-url`}
						className="placeholder:text-content-disabled shadow-none"
						{...form.getFieldProps("oauth2RevocationURL")}
						placeholder="https://"
						disabled={disabled}
					/>
				</Field>
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.scopes_0d5644ff",
					)}
					htmlFor={`${formId}-oauth-scopes`}
				>
					<Input
						id={`${formId}-oauth-scopes`}
						className="shadow-none"
						{...form.getFieldProps("oauth2Scopes")}
						disabled={disabled}
					/>
				</Field>
			</div>
		</div>
	);
};

const APIKeyFields: FC<MCPServerAuthFieldsProps> = ({
	form,
	formId,
	disabled,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="grid items-start gap-4 sm:grid-cols-2">
			<Field
				label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.header_ba5caa42",
				)}
				htmlFor={`${formId}-api-header`}
			>
				<Input
					id={`${formId}-api-header`}
					className="shadow-none"
					{...form.getFieldProps("apiKeyHeader")}
					placeholder={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.authorization_ca5839e3",
					)}
					disabled={disabled}
				/>
			</Field>
			<Field
				label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.api_key_16f0ee47",
				)}
				htmlFor={`${formId}-api-key`}
			>
				<SecretInput
					id={`${formId}-api-key`}
					value={form.values.apiKeyValue}
					touched={form.values.apiKeyTouched}
					onTouch={() => void form.setFieldValue("apiKeyTouched", true)}
					onValueChange={(value) =>
						void form.setFieldValue("apiKeyValue", value)
					}
					onReset={() => void form.setFieldValue("apiKeyTouched", false)}
					disabled={disabled}
				/>
			</Field>
		</div>
	);
};

const SecretInput: FC<{
	id: string;
	value: string;
	touched: boolean;
	onTouch: () => void;
	onValueChange: (value: string) => void;
	onReset: () => void;
	disabled: boolean;
}> = ({ id, value, touched, onTouch, onValueChange, onReset, disabled }) => (
	<Input
		id={id}
		className="font-mono shadow-none [-webkit-text-security:disc]"
		type="text"
		{...passwordManagerIgnoreProps}
		value={value}
		onChange={(event) => {
			onTouch();
			onValueChange(event.target.value);
		}}
		onFocus={() => {
			if (!touched && value !== "") {
				onValueChange("");
				onTouch();
			}
		}}
		onBlur={() => {
			if (touched && value === "") {
				onValueChange(SECRET_PLACEHOLDER);
				onReset();
			}
		}}
		disabled={disabled}
	/>
);

const CustomHeadersFields: FC<MCPServerAuthFieldsProps> = ({
	form,
	formId,
	disabled,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const headers =
		form.values.customHeaders.length > 0
			? form.values.customHeaders
			: [{ key: "", value: "" }];
	const setHeaders = (nextHeaders: Array<{ key: string; value: string }>) => {
		void form.setFieldValue("customHeadersTouched", true);
		void form.setFieldValue("customHeaders", nextHeaders);
	};

	return (
		<div className="space-y-3">
			<p className="m-0 text-sm text-content-secondary">
				{tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.enter_custom_headers_to_send_with_each_request_s_88851acf",
				)}
			</p>
			{headers.map((header, index) => (
				<div
					key={index.toString()}
					className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
				>
					<CustomHeaderInput
						formId={formId}
						header={header}
						index={index}
						headers={headers}
						setHeaders={setHeaders}
						disabled={disabled}
					/>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() => setHeaders([...headers, { key: "", value: "" }])}
				disabled={disabled}
			>
				<PlusIcon />
				{tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.add_header_1192c90d",
				)}
			</Button>
		</div>
	);
};

const CustomHeaderInput: FC<{
	formId: string;
	header: { key: string; value: string };
	index: number;
	headers: Array<{ key: string; value: string }>;
	setHeaders: (headers: Array<{ key: string; value: string }>) => void;
	disabled: boolean;
}> = ({ formId, header, index, headers, setHeaders, disabled }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			<Field
				label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.header_name_c1dcc8fb",
				)}
				htmlFor={`${formId}-custom-header-${index}`}
			>
				<Input
					id={`${formId}-custom-header-${index}`}
					className="shadow-none"
					value={header.key}
					onChange={(event) => {
						const nextHeaders = [...headers];
						nextHeaders[index] = { ...header, key: event.target.value };
						setHeaders(nextHeaders);
					}}
					disabled={disabled}
				/>
			</Field>
			<Field
				label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.header_value_f9a9058c",
				)}
				htmlFor={`${formId}-custom-value-${index}`}
			>
				<Input
					id={`${formId}-custom-value-${index}`}
					className="shadow-none"
					value={header.value}
					onChange={(event) => {
						const nextHeaders = [...headers];
						nextHeaders[index] = { ...header, value: event.target.value };
						setHeaders(nextHeaders);
					}}
					disabled={disabled}
				/>
			</Field>
			<Button
				type="button"
				variant="subtle"
				size="icon"
				aria-label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerAuthSection.remove_header_e42db5eb",
				)}
				disabled={disabled || headers.length === 1}
				onClick={() =>
					setHeaders(headers.filter((_, headerIndex) => headerIndex !== index))
				}
			>
				<XIcon />
			</Button>
		</>
	);
};
