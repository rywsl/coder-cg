import { cn } from "cn";
import { type FormikTouched, useFormik } from "formik";
import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type FieldError,
	getErrorMessage,
	isApiError,
	isApiErrorResponse,
} from "#/api/errors";
import {
	type CreateUserSecretRequest,
	type ImportUserSecretsRequest,
	MaxSecretsFileBytes,
	type UpdateUserSecretRequest,
	type UserSecret,
} from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { FileUpload } from "#/components/FileUpload/FileUpload";
import { FormField } from "#/components/FormField/FormField";
import { Label } from "#/components/Label/Label";
import { Separator } from "#/components/Separator/Separator";
import { Spinner } from "#/components/Spinner/Spinner";
import { Textarea } from "#/components/Textarea/Textarea";
import { i18n } from "#/i18n";
import { getFormHelpers } from "#/utils/formUtils";
import {
	buildCreateUserSecretRequest,
	buildUpdateUserSecretRequest,
	getCreateSecretRequiredFieldErrors,
	mapSecretApiErrorToFormErrors,
	type SecretFieldErrors,
	type SecretFormValues,
	secretsFileFormatFromFilename,
} from "./secretForm";

type SecretDialogProps = {
	open: boolean;
	secret?: UserSecret;
	isSubmitting: boolean;
	returnFocusElement?: HTMLElement | null;
	onClose: () => void;
	onCreateSecret: (
		request: CreateUserSecretRequest,
	) => Promise<UserSecret> | UserSecret;
	onUpdateSecret: (
		name: string,
		request: UpdateUserSecretRequest,
	) => Promise<UserSecret> | UserSecret;
	onImportSecrets: (request: ImportUserSecretsRequest) => Promise<UserSecret[]>;
};

const emptyValues: SecretFormValues = {
	name: "",
	value: "",
	description: "",
	env_name: "",
	file_path: "",
};

const infoText = i18n.t(
	"users:UserSettingsPage.SecretsPage.SecretDialog.secret_values_cannot_be_retrieved_once_saved_b82a8b54",
);
export const SAVED_SECRET_VALUE_DISPLAY = "••••••••••••••••••••";

export const SecretDialog: FC<SecretDialogProps> = ({
	open,
	secret,
	isSubmitting,
	returnFocusElement,
	onClose,
	onCreateSecret,
	onUpdateSecret,
	onImportSecrets,
}) => {
	const { t: tI18n } = useTranslation("users");

	const isEdit = Boolean(secret);
	const initialValues = secret
		? {
				name: secret.name,
				value: "",
				description: secret.description,
				env_name: secret.env_name,
				file_path: secret.file_path,
			}
		: emptyValues;
	const [clearValueRequested, setClearValueRequested] = useState(false);
	const [importFile, setImportFile] = useState<File | undefined>(undefined);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState<unknown>(undefined);

	const form = useFormik<SecretFormValues>({
		initialValues,
		enableReinitialize: true,
		validateOnMount: true,
		validate: (values) =>
			isEdit ? {} : getCreateSecretRequiredFieldErrors(values),
		onSubmit: async (values, helpers) => {
			helpers.setStatus(undefined);
			try {
				if (secret) {
					const request = buildUpdateUserSecretRequest(secret, values, {
						clearValue: clearValueRequested,
					});
					await onUpdateSecret(secret.name, request);
				} else {
					await onCreateSecret(buildCreateUserSecretRequest(values));
				}
				setClearValueRequested(false);
				helpers.resetForm();
				onClose();
			} catch (error) {
				const formErrors = mapSecretApiErrorToFormErrors(error);
				helpers.setErrors(formErrors.fieldErrors);
				helpers.setTouched(
					touchedFromFieldErrors(formErrors.fieldErrors),
					false,
				);
				helpers.setStatus(formErrors.formError);
			}
		},
	});

	const closeDialog = () => {
		setClearValueRequested(false);
		setImportFile(undefined);
		setImportError(undefined);
		setIsImporting(false);
		form.resetForm();
		onClose();
	};

	const handleImportFile = (file: File) => {
		if (isImporting) {
			return;
		}
		setImportError(undefined);
		setImportFile(file);

		const format = secretsFileFormatFromFilename(file.name);
		if (!format) {
			setImportError({
				message: tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.unsupported_file_type_import_a_env_json_yaml_or__813e37a5",
				),
			});
			return;
		}
		if (file.size > MaxSecretsFileBytes) {
			setImportError({
				message: tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.file_is_too_large_import_a_file_of_1_mib_or_smal_2ad522e5",
				),
			});
			return;
		}

		setIsImporting(true);
		const reader = new FileReader();
		reader.onload = async () => {
			const content = typeof reader.result === "string" ? reader.result : "";
			try {
				await onImportSecrets({ format, content });
				closeDialog();
			} catch (error) {
				setImportError(error);
			} finally {
				setIsImporting(false);
			}
		};
		reader.onerror = () => {
			setImportError({
				message: tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.failed_to_read_the_selected_file_d48c5240",
				),
			});
			setIsImporting(false);
		};
		reader.readAsText(file);
	};

	const request = secret
		? buildUpdateUserSecretRequest(secret, form.values, {
				clearValue: clearValueRequested,
			})
		: undefined;
	const hasUpdate = request ? Object.keys(request).length > 0 : false;
	const isBusy = isSubmitting || form.isSubmitting || isImporting;
	const confirmDisabled =
		isBusy || !form.isValid || (secret ? !hasUpdate : !form.dirty);
	const getFieldHelpers = getFormHelpers(form);
	const formError = form.status as string | undefined;

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && !isBusy) {
					closeDialog();
				}
			}}
		>
			<DialogContent
				className="max-h-[90vh] overflow-y-auto"
				aria-describedby={undefined}
				onCloseAutoFocus={(event) => {
					if (returnFocusElement?.isConnected) {
						event.preventDefault();
						returnFocusElement.focus();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{secret
							? tI18n(
									"UserSettingsPage.SecretsPage.SecretDialog.edit_secret_b5068d24",
								)
							: tI18n(
									"UserSettingsPage.SecretsPage.SecretDialog.add_secret_f57a23c6",
								)}
					</DialogTitle>
				</DialogHeader>

				<form
					onSubmit={form.handleSubmit}
					className="flex flex-col gap-5"
					autoComplete="off"
				>
					<Alert severity="info" className="text-content-secondary">
						<AlertDescription>{infoText}</AlertDescription>
					</Alert>

					{formError && (
						<Alert severity="error" prominent>
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					)}

					{secret ? (
						<>
							<SecretFields
								getFieldHelpers={getFieldHelpers}
								disableName
								showValue={false}
							/>
							<SecretValueField
								key={`${secret.name}-${open}`}
								field={getFieldHelpers("value", {
									helperText: tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.leave_blank_to_keep_the_existing_value_37e1207c",
									),
								})}
								placeholder={tI18n(
									"UserSettingsPage.SecretsPage.SecretDialog.leave_blank_to_keep_existing_value_01a009d2",
								)}
								showSavedValue={open}
								clearValueRequested={clearValueRequested}
								onClearValue={() => {
									setClearValueRequested(true);
									void form.setFieldValue("value", "", false);
								}}
								onUndoClearValue={() => {
									setClearValueRequested(false);
									void form.setFieldValue("value", "", false);
								}}
							/>
							<SecretDescriptionField field={getFieldHelpers("description")} />
						</>
					) : (
						<>
							<div className="flex flex-col gap-3">
								<FileUpload
									isUploading={isImporting}
									file={importFile}
									onUpload={handleImportFile}
									onUnsupportedFile={handleImportFile}
									onRemove={() => {
										setImportFile(undefined);
										setImportError(undefined);
									}}
									removeLabel={tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.remove_file_fffa2e32",
									)}
									title={tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.import_secrets_from_a_file_329de98a",
									)}
									description={tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.import_a_single_or_multiple_secrets_at_once_with_ca2eac74",
									)}
									extensions={["env", "json", "yaml", "yml"]}
								/>
								{importError !== undefined && (
									<ImportSecretsError error={importError} />
								)}
							</div>
							<div className="flex items-center">
								<Separator className="flex-1" />
								<span className="whitespace-nowrap px-3 text-xs text-content-secondary">
									{tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.or_add_individually_fce85069",
									)}
								</span>
								<Separator className="flex-1" />
							</div>
							<SecretFields
								getFieldHelpers={getFieldHelpers}
								showRequiredLabels
								showValue
							/>
							<SecretDescriptionField field={getFieldHelpers("description")} />
						</>
					)}

					<DialogFooter>
						<Button variant="outline" disabled={isBusy} onClick={closeDialog}>
							{tI18n(
								"UserSettingsPage.SecretsPage.SecretDialog.cancel_19766ed6",
							)}
						</Button>
						<Button type="submit" disabled={confirmDisabled}>
							<Spinner loading={isSubmitting || form.isSubmitting} />
							{secret
								? tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.update_c1c1009d",
									)
								: tI18n(
										"UserSettingsPage.SecretsPage.SecretDialog.save_1509f561",
									)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

type SecretFieldsProps = {
	getFieldHelpers: ReturnType<typeof getFormHelpers<SecretFormValues>>;
	disableName?: boolean;
	showRequiredLabels?: boolean;
	showValue: boolean;
};

const SecretFields: FC<SecretFieldsProps> = ({
	getFieldHelpers,
	disableName,
	showRequiredLabels,
	showValue,
}) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<>
			<FormField
				field={getFieldHelpers("name", {
					helperText: disableName
						? "Unique identifier (can’t be changed)."
						: undefined,
				})}
				label={
					showRequiredLabels ? (
						<RequiredFieldLabel>
							{tI18n("UserSettingsPage.SecretsPage.SecretDialog.name_dcd1d522")}
						</RequiredFieldLabel>
					) : (
						tI18n("UserSettingsPage.SecretsPage.SecretDialog.name_dcd1d522")
					)
				}
				placeholder={tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.secret_name_5cdf573b",
				)}
				className="placeholder:text-content-disabled"
				disabled={disableName}
				aria-required={showRequiredLabels}
				ignorePasswordManagers
			/>
			<FormField
				field={getFieldHelpers("env_name", {
					helperText: tI18n(
						"UserSettingsPage.SecretsPage.SecretDialog.optional_exposes_the_secret_as_an_environment_va_cee2139f",
					),
				})}
				label={tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.environment_variable_b86ad171",
				)}
				placeholder="SERVICE_TOKEN"
				className="placeholder:text-content-disabled"
				ignorePasswordManagers
			/>
			<FormField
				field={getFieldHelpers("file_path", {
					helperText: tI18n(
						"UserSettingsPage.SecretsPage.SecretDialog.optional_exposes_the_secret_as_a_file_at_this_pa_8a07d70a",
					),
				})}
				label={tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.file_path_2fb6d386",
				)}
				placeholder={tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.api_key_txt_fdbbd460",
				)}
				className="placeholder:text-content-disabled"
				ignorePasswordManagers
			/>
			{showValue && (
				<SecretValueField
					field={getFieldHelpers("value")}
					placeholder={tI18n(
						"UserSettingsPage.SecretsPage.SecretDialog.enter_secret_value_7b3820f7",
					)}
					required={showRequiredLabels}
				/>
			)}
		</>
	);
};

type RequiredFieldLabelProps = {
	children: ReactNode;
};

const RequiredFieldLabel: FC<RequiredFieldLabelProps> = ({ children }) => {
	return (
		<span className="after:ml-1 after:text-content-destructive after:content-['*']">
			{children}
		</span>
	);
};

type SecretValueFieldProps = {
	field: ReturnType<ReturnType<typeof getFormHelpers<SecretFormValues>>>;
	placeholder: string;
	required?: boolean;
	showSavedValue?: boolean;
	clearValueRequested?: boolean;
	onClearValue?: () => void;
	onUndoClearValue?: () => void;
};

const SecretValueField: FC<SecretValueFieldProps> = ({
	field,
	placeholder,
	required,
	showSavedValue = false,
	clearValueRequested = false,
	onClearValue,
	onUndoClearValue,
}) => {
	const { t: tI18n } = useTranslation("users");

	const [hasHiddenSavedValue, setHasHiddenSavedValue] = useState(false);
	const isShowingSavedValue =
		showSavedValue && !clearValueRequested && !hasHiddenSavedValue;

	const value = clearValueRequested
		? ""
		: isShowingSavedValue
			? SAVED_SECRET_VALUE_DISPLAY
			: field.value;
	const maskTypedValue =
		!clearValueRequested &&
		!isShowingSavedValue &&
		typeof field.value === "string" &&
		field.value !== "";
	const displayField = clearValueRequested
		? {
				...field,
				helperText: field.error
					? field.helperText
					: tI18n(
							"UserSettingsPage.SecretsPage.SecretDialog.saved_value_will_be_cleared_when_you_update_2385a011",
						),
			}
		: field;
	const errorId = `${field.id}-error`;
	const helperId = `${field.id}-helper`;

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={field.id}>
				{required ? (
					<RequiredFieldLabel>
						{tI18n("UserSettingsPage.SecretsPage.SecretDialog.value_8e37953d")}
					</RequiredFieldLabel>
				) : (
					tI18n("UserSettingsPage.SecretsPage.SecretDialog.value_8e37953d")
				)}
			</Label>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start">
				<Textarea
					id={field.id}
					name={field.name}
					value={value}
					placeholder={placeholder}
					autoComplete="off"
					rows={4}
					aria-required={required}
					aria-invalid={displayField.error}
					aria-describedby={
						displayField.error
							? errorId
							: displayField.helperText
								? helperId
								: undefined
					}
					disabled={clearValueRequested}
					className={cn(
						"placeholder:text-content-disabled sm:flex-1 font-mono",
						displayField.error && "border-border-destructive",
						maskTypedValue && "[-webkit-text-security:disc]",
					)}
					onFocus={(event) => {
						if (isShowingSavedValue) {
							event.currentTarget.value = "";
							setHasHiddenSavedValue(true);
						}
					}}
					onChange={(event) => {
						if (isShowingSavedValue) {
							setHasHiddenSavedValue(true);
						}
						field.onChange(event);
					}}
					onBlur={(event) => {
						field.onBlur(event);
						if (showSavedValue && event.currentTarget.value === "") {
							setHasHiddenSavedValue(false);
						}
					}}
				/>
				{onClearValue && onUndoClearValue && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={cn(
							"h-10 w-16 shrink-0",
							!clearValueRequested &&
								"text-content-secondary hover:border-border-destructive hover:text-content-destructive",
						)}
						onClick={clearValueRequested ? onUndoClearValue : onClearValue}
					>
						{clearValueRequested
							? tI18n("UserSettingsPage.SecretsPage.SecretDialog.undo_a8283ade")
							: tI18n(
									"UserSettingsPage.SecretsPage.SecretDialog.clear_83b12c22",
								)}
					</Button>
				)}
			</div>
			{displayField.error ? (
				<span id={errorId} className="text-xs text-content-destructive">
					{displayField.helperText}
				</span>
			) : (
				displayField.helperText && (
					<span id={helperId} className="text-xs text-content-secondary">
						{displayField.helperText}
					</span>
				)
			)}
		</div>
	);
};

type SecretDescriptionFieldProps = {
	field: ReturnType<ReturnType<typeof getFormHelpers<SecretFormValues>>>;
};

const SecretDescriptionField: FC<SecretDescriptionFieldProps> = ({ field }) => {
	const { t: tI18n } = useTranslation("users");

	const errorId = `${field.id}-error`;

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={field.id}>
				{tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.description_526e0087",
				)}
			</Label>
			<Textarea
				id={field.id}
				name={field.name}
				value={field.value}
				onChange={field.onChange}
				onBlur={field.onBlur}
				placeholder={tI18n(
					"UserSettingsPage.SecretsPage.SecretDialog.optional_59be7133",
				)}
				aria-invalid={field.error}
				aria-describedby={field.error ? errorId : undefined}
				className={cn(
					"placeholder:text-content-disabled",
					field.error && "border-border-destructive",
				)}
			/>
			{field.error && (
				<span id={errorId} className="text-xs text-content-destructive">
					{field.helperText}
				</span>
			)}
		</div>
	);
};

function touchedFromFieldErrors(
	fieldErrors: SecretFieldErrors,
): FormikTouched<SecretFormValues> {
	return Object.fromEntries(
		Object.keys(fieldErrors).map((field) => [field, true]),
	) as FormikTouched<SecretFormValues>;
}

type ImportSecretsErrorProps = {
	error: unknown;
};

const ImportSecretsError: FC<ImportSecretsErrorProps> = ({ error }) => {
	const { t: tI18n } = useTranslation("users");

	const validations = getImportSecretValidations(error);
	if (validations.length === 0) {
		return <ErrorAlert error={error} showDebugDetail={false} />;
	}

	return (
		<Alert severity="error" prominent>
			<AlertTitle>
				{getErrorMessage(
					error,
					tI18n(
						"UserSettingsPage.SecretsPage.SecretDialog.failed_to_import_secrets_65200858",
					),
				)}
			</AlertTitle>
			<AlertDescription>
				<ul className="m-0 flex list-disc flex-col gap-1 pl-5">
					{validations.map((validation) => (
						<li key={validation.field}>
							<span className="font-semibold">{validation.field}</span>
							<span className="block">{validation.detail}</span>
						</li>
					))}
				</ul>
			</AlertDescription>
		</Alert>
	);
};

function getImportSecretValidations(error: unknown): FieldError[] {
	if (isApiError(error)) {
		return error.response.data.validations ?? [];
	}
	if (isApiErrorResponse(error)) {
		return error.validations ?? [];
	}
	return [];
}
