import { useFormik } from "formik";
import { PlayIcon, RotateCwIcon, SaveIcon, SquareIcon } from "lucide-react";
import { type FC, useId } from "react";
import { useTranslation } from "react-i18next";
import type {
	UpdateWorkspaceSSHGatewayRequest,
	WorkspaceSSHGatewayRuntimeConfig,
	WorkspaceSSHGatewayState,
	WorkspaceSSHGatewayStatus,
} from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Badge, type BadgeProps } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import {
	FormFields,
	FormFooter,
	FormSection,
	VerticalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { Label } from "#/components/Label/Label";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { getFormHelpers } from "#/utils/formUtils";

type GatewayNumericValue = number | string;

type GatewayFormValues = Omit<
	WorkspaceSSHGatewayRuntimeConfig,
	| "advertise_port"
	| "max_connections"
	| "max_pending_connections"
	| "max_pending_connections_per_ip"
	| "max_connections_per_user"
	| "max_channels_per_connection"
	| "auth_attempts_per_minute"
	| "auth_attempts_burst"
> & {
	advertise_port: GatewayNumericValue;
	max_connections: GatewayNumericValue;
	max_pending_connections: GatewayNumericValue;
	max_pending_connections_per_ip: GatewayNumericValue;
	max_connections_per_user: GatewayNumericValue;
	max_channels_per_connection: GatewayNumericValue;
	auth_attempts_per_minute: GatewayNumericValue;
	auth_attempts_burst: GatewayNumericValue;
	codex_api_key: string;
	clear_codex_api_key: boolean;
};

const numericFieldNames = [
	"advertise_port",
	"max_connections",
	"max_pending_connections",
	"max_pending_connections_per_ip",
	"max_connections_per_user",
	"max_channels_per_connection",
	"auth_attempts_per_minute",
	"auth_attempts_burst",
] as const;

const parsePositiveInteger = (value: GatewayNumericValue): number => {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0
		? parsed
		: 0;
};

type WorkspaceSSHGatewaySectionProps = {
	status: WorkspaceSSHGatewayStatus;
	error?: unknown;
	isSaving: boolean;
	isStarting: boolean;
	isStopping: boolean;
	onSave: (
		request: UpdateWorkspaceSSHGatewayRequest,
		onSuccess: () => void,
	) => void;
	onStart: () => void;
	onStop: () => void;
};

const statusVariant: Record<
	WorkspaceSSHGatewayState,
	NonNullable<BadgeProps["variant"]>
> = {
	stopped: "default",
	starting: "info",
	running: "green",
	stopping: "warning",
	error: "destructive",
};

export const WorkspaceSSHGatewaySection: FC<
	WorkspaceSSHGatewaySectionProps
> = ({
	status,
	error,
	isSaving,
	isStarting,
	isStopping,
	onSave,
	onStart,
	onStop,
}) => {
	const { t: tI18n } = useTranslation("administration");
	const clearAPIKeyID = useId();
	const statusLabels: Record<WorkspaceSSHGatewayState, string> = {
		stopped: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.stopped_1a4f630a",
		),
		starting: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.starting_aeed4d26",
		),
		running: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.running_f4ccae29",
		),
		stopping: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.stopping_a71ee1d4",
		),
		error: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.error_54a0e8c1",
		),
	};
	const errorMessages: Record<string, string> = {
		https_required: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.configure_an_https_access_url_before_starting_th_10d07e18",
		),
		configuration_invalid: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.review_the_gateway_configuration_and_save_it_aga_405d04c8",
		),
		api_key_missing: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.configure_a_codex_api_key_before_starting_the_ga_5d83efad",
		),
		host_key_missing: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.the_ssh_host_key_is_missing_save_the_configurati_5b7eca4f",
		),
		host_key_invalid: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.the_stored_ssh_host_key_is_invalid_f7c98720",
		),
		listen_failed: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.the_listening_address_is_unavailable_stop_the_co_35cea57c",
		),
		stored_config_invalid: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.the_stored_gateway_configuration_is_invalid_6e6d199c",
		),
		persistence_failed: tI18n(
			"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.the_gateway_configuration_could_not_be_saved_8d46d799",
		),
	};
	const form = useFormik<GatewayFormValues>({
		initialValues: {
			...status.config,
			codex_api_key: "",
			clear_codex_api_key: false,
		},
		validate: (values) => {
			const errors: Partial<Record<keyof GatewayFormValues, string>> = {};
			for (const fieldName of numericFieldNames) {
				if (parsePositiveInteger(values[fieldName]) === 0) {
					errors[fieldName] = tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.enter_a_positive_integer_30d16661",
					);
				}
			}
			return errors;
		},
		onSubmit: (values, helpers) => {
			const config: WorkspaceSSHGatewayRuntimeConfig = {
				listen_address: values.listen_address,
				advertise_host: values.advertise_host,
				advertise_port: parsePositiveInteger(values.advertise_port),
				codex_base_url: values.codex_base_url,
				codex_model: values.codex_model,
				max_connections: parsePositiveInteger(values.max_connections),
				max_pending_connections: parsePositiveInteger(
					values.max_pending_connections,
				),
				max_pending_connections_per_ip: parsePositiveInteger(
					values.max_pending_connections_per_ip,
				),
				max_connections_per_user: parsePositiveInteger(
					values.max_connections_per_user,
				),
				max_channels_per_connection: parsePositiveInteger(
					values.max_channels_per_connection,
				),
				auth_attempts_per_minute: parsePositiveInteger(
					values.auth_attempts_per_minute,
				),
				auth_attempts_burst: parsePositiveInteger(values.auth_attempts_burst),
			};
			onSave(
				{
					config,
					codex_api_key: values.clear_codex_api_key
						? undefined
						: values.codex_api_key || undefined,
					clear_codex_api_key: values.clear_codex_api_key,
				},
				() => {
					helpers.resetForm({
						values: {
							...config,
							codex_api_key: "",
							clear_codex_api_key: false,
						},
					});
				},
			);
		},
	});
	const getFieldHelpers = getFormHelpers(form, error);
	const operationInProgress = isSaving || isStarting || isStopping;
	const fieldsDisabled =
		operationInProgress ||
		status.desired_enabled ||
		status.state === "running" ||
		status.state === "starting" ||
		status.state === "stopping";
	const canStart =
		status.configured &&
		!operationInProgress &&
		(status.state === "stopped" || status.state === "error");
	const canStop = status.desired_enabled || status.state === "running";
	const isRetry = status.state === "error";

	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<SettingsHeaderTitle level="h2" hierarchy="secondary">
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.workspace_ssh_gateway_924863a4",
						)}
					</SettingsHeaderTitle>
					<p className="mt-2 mb-0 text-sm text-content-secondary">
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.manage_the_openssh_entry_point_used_by_chatgpt_d_74afc5cd",
						)}
					</p>
				</div>
				<Badge variant={statusVariant[status.state]} role="status">
					{statusLabels[status.state]}
				</Badge>
			</div>
			{status.error_code && (
				<Alert severity="error" prominent>
					<AlertTitle>
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.gateway_could_not_start_ac7729ed",
						)}
					</AlertTitle>
					<AlertDescription>
						{errorMessages[status.error_code] ??
							tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.the_gateway_encountered_an_unknown_error_review__8906ec55",
							)}
					</AlertDescription>
				</Alert>
			)}
			{error != null && <ErrorAlert error={error} />}
			{status.configured && (
				<div className="grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<div className="text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.bound_address_f204f25a",
							)}
						</div>
						<code className="break-all">
							{status.bound_address ||
								tI18n(
									"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.not_listening_0cf2b8dd",
								)}
						</code>
					</div>
					<div>
						<div className="text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.host_key_fingerprint_1e9d2ba6",
							)}
						</div>
						<code className="break-all">
							{status.host_key_fingerprint ||
								tI18n(
									"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.not_generated_baae3f6e",
								)}
						</code>
					</div>
				</div>
			)}
			<VerticalForm
				onSubmit={form.handleSubmit}
				aria-label={tI18n(
					"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.workspace_ssh_gateway_settings_020be30c",
				)}
			>
				<FormSection
					title={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.connection_639a40e8",
					)}
					description={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.configure_the_local_listener_and_the_public_addr_f9abe926",
					)}
				>
					<FormFields className="grid gap-6 md:grid-cols-2">
						<FormField
							field={getFieldHelpers("listen_address")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.listen_address_edc8737a",
							)}
							placeholder="0.0.0.0:2222"
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("advertise_host")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.public_host_802d5b67",
							)}
							placeholder={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.ssh_example_com_8d2adc0e",
							)}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("advertise_port")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.public_port_32a480f3",
							)}
							type="number"
							min={1}
							max={65535}
							disabled={fieldsDisabled}
							required
						/>
					</FormFields>
				</FormSection>

				<FormSection
					title={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.codex_provider_49721de8",
					)}
					description={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.configure_the_responses_compatible_sub2_endpoint_37e4c27f",
					)}
				>
					<FormFields>
						<FormField
							field={getFieldHelpers("codex_base_url")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.sub2_base_url_7da7f59a",
							)}
							placeholder="https://api.example.com/v1"
							type="url"
							disabled={fieldsDisabled}
							required={Boolean(form.values.codex_model)}
						/>
						<FormField
							field={getFieldHelpers("codex_model")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.model_5e2c614c",
							)}
							placeholder={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.gpt_5_3_codex_a3da4ff8",
							)}
							disabled={fieldsDisabled}
							required={Boolean(form.values.codex_base_url)}
						/>
						<FormField
							field={getFieldHelpers("codex_api_key", {
								helperText: status.api_key_configured
									? tI18n(
											"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.api_key_already_stored_f034be6e",
										)
									: tI18n(
											"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.api_key_secret_notice_30247d93",
										),
							})}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.codex_api_key_8f00562a",
							)}
							type="password"
							placeholder={
								status.api_key_configured
									? tI18n(
											"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.leave_blank_to_keep_the_stored_key_f1c1936f",
										)
									: tI18n(
											"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.enter_an_api_key_8f4f3375",
										)
							}
							disabled={fieldsDisabled || form.values.clear_codex_api_key}
							ignorePasswordManagers
						/>
						{status.api_key_configured && (
							<div className="flex items-center gap-2">
								<Checkbox
									id={clearAPIKeyID}
									checked={form.values.clear_codex_api_key}
									onCheckedChange={(checked) => {
										void form.setFieldValue(
											"clear_codex_api_key",
											checked === true,
										);
									}}
									disabled={fieldsDisabled}
								/>
								<Label htmlFor={clearAPIKeyID}>
									{tI18n(
										"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.clear_the_stored_api_key_when_saving_98ea6779",
									)}
								</Label>
							</div>
						)}
					</FormFields>
				</FormSection>

				<FormSection
					title={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.security_limits_9add98ae",
					)}
					description={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.limit_connection_authentication_and_ssh_channel__ff47a005",
					)}
				>
					<FormFields className="grid gap-6 md:grid-cols-2">
						<FormField
							field={getFieldHelpers("max_connections")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.total_connections_b919c747",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("max_pending_connections")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.pending_authentication_connections_c58ee74c",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("max_pending_connections_per_ip")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.pending_connections_per_ip_c72654b9",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("max_connections_per_user")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.connections_per_user_e903dbdf",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("max_channels_per_connection")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.channels_per_connection_fdd340d4",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("auth_attempts_per_minute")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.authentication_attempts_per_ip_per_minute_6635bea7",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
						<FormField
							field={getFieldHelpers("auth_attempts_burst")}
							label={tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.authentication_burst_5b71b236",
							)}
							type="number"
							min={1}
							disabled={fieldsDisabled}
							required
						/>
					</FormFields>
				</FormSection>

				<FormFooter>
					<Button type="submit" disabled={fieldsDisabled}>
						<Spinner loading={isSaving}>
							<SaveIcon />
						</Spinner>
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.save_configuration_b2b158f2",
						)}
					</Button>
					{canStop ? (
						<Button
							type="button"
							variant="outline"
							onClick={onStop}
							disabled={operationInProgress}
						>
							<Spinner loading={isStopping}>
								<SquareIcon />
							</Spinner>
							{tI18n(
								"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.stop_cae7d57b",
							)}
						</Button>
					) : (
						<Button type="button" onClick={onStart} disabled={!canStart}>
							<Spinner loading={isStarting}>
								{isRetry ? <RotateCwIcon /> : <PlayIcon />}
							</Spinner>
							{isRetry
								? tI18n(
										"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.retry_942087cc",
									)
								: tI18n(
										"DeploymentSettingsPage.NetworkSettingsPage.WorkspaceSSHGatewaySection.start_e4bb9f1e",
									)}
						</Button>
					)}
				</FormFooter>
			</VerticalForm>
		</section>
	);
};
