import { cn } from "cn";
import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	PreviewParameter,
	Workspace,
	WorkspaceBuildParameter,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { Spinner } from "#/components/Spinner/Spinner";
import { useDebouncedFunction } from "#/hooks/debounce";
import { useSyncFormParameters } from "#/modules/hooks/useSyncFormParameters";
import {
	DynamicParameter,
	getInitialParameterValues,
	useValidationSchemaForDynamicParameters,
} from "#/modules/workspaces/DynamicParameter/DynamicParameter";
import { docs } from "#/utils/docs";
import type { AutofillBuildParameter } from "#/utils/richParameters";

type WorkspaceParametersPageViewProps = {
	workspace: Workspace;
	autofillParameters: AutofillBuildParameter[];
	parameters: PreviewParameter[];
	diagnostics: PreviewParameter["diagnostics"];
	canChangeVersions: boolean;
	isSubmitting: boolean;
	submitLabel: string;
	onCancel: () => void;
	onSubmit: (values: {
		rich_parameter_values: WorkspaceBuildParameter[];
	}) => void;
	sendMessage: (formValues: Record<string, string>) => void;
	templateVersionId: string | undefined;
};

export const WorkspaceParametersPageView: FC<
	WorkspaceParametersPageViewProps
> = ({
	workspace,
	autofillParameters,
	parameters,
	diagnostics,
	canChangeVersions,
	isSubmitting,
	submitLabel,
	onSubmit,
	sendMessage,
	onCancel,
	templateVersionId,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const form = useFormik({
		onSubmit,
		initialValues: {
			rich_parameter_values: getInitialParameterValues(
				parameters,
				autofillParameters,
			),
		},
		initialTouched: Object.fromEntries(
			autofillParameters.map((p) => [p.name, true]),
		),
		validationSchema: useValidationSchemaForDynamicParameters(parameters),
		enableReinitialize: false,
		validateOnChange: true,
		validateOnBlur: true,
	});

	const disabled =
		workspace.outdated &&
		workspace.template_require_active_version &&
		!canChangeVersions;

	// Debounce websocket sends to avoid stale responses overwriting
	// the form while the user is still typing.
	const { debounced: sendDynamicParamsRequest } = useDebouncedFunction(
		(parameter: PreviewParameter, value: string) => {
			const formInputs: Record<string, string> = {};
			const formParameters = form.values.rich_parameter_values ?? [];
			for (const param of formParameters) {
				if (param?.name && param?.value !== undefined) {
					formInputs[param.name] = param.value;
				}
			}
			formInputs[parameter.name] = value;
			sendMessage(formInputs);
		},
		(parameter: PreviewParameter, _value: string) => {
			// Return a debounce for string fields (those that involve typing) and
			// zero debounce for all others (so the UI can react immediately).
			return parameter.form_type === "input" ||
				parameter.form_type === "textarea"
				? 500
				: 0;
		},
	);

	const handleChange = async (
		parameter: PreviewParameter,
		parameterField: string,
		value: string,
	) => {
		await form.setFieldValue(parameterField, {
			name: parameter.name,
			value,
		});
		form.setFieldTouched(parameter.name, true);
		sendDynamicParamsRequest(parameter, value);
	};

	useSyncFormParameters({
		parameters,
		formValues: form.values.rich_parameter_values ?? [],
		touched: form.touched,
		setFieldValue: form.setFieldValue,
	});

	// True when the form holds values the backend hasn't evaluated
	// yet (debounce pending or WS round-trip in flight).
	const hasUnsyncedParameters = (form.values.rich_parameter_values ?? []).some(
		(formParam) => {
			const responseParam = parameters.find((p) => p.name === formParam.name);
			if (!responseParam) {
				return true;
			}
			const responseValue = responseParam.value.valid
				? responseParam.value.value
				: "";
			return formParam.value !== responseValue;
		},
	);

	const hasIncompatibleParameters = parameters.some((parameter) => {
		if (!parameter.mutable && parameter.diagnostics.length > 0) {
			return true;
		}
		return false;
	});

	return (
		<>
			{disabled && (
				<Alert severity="warning" className="mb-8" prominent>
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.the_template_for_this_workspace_requires_automat_c80f1153",
					)}
				</Alert>
			)}
			{hasIncompatibleParameters && (
				<Alert severity="error" prominent>
					<p className="text-lg leading-normal font-bold m-0">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.workspace_update_blocked_2db85b3a",
						)}
					</p>
					<p className="mb-0">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.the_new_template_version_includes_parameter_chan_8c22138c",
						)}
					</p>
					<ul className="mb-0 pl-4 space-y-1">
						<li>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.new_277e39a2",
							)}
							<strong>
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.required_d0a36305",
								)}
							</strong>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.parameters_that_cannot_be_provided_after_workspa_f4f75427",
							)}
						</li>
						<li>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.changes_to_e6694ea7",
							)}
							<strong>
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.valid_options_or_validations_d9ce5f5a",
								)}
							</strong>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.for_existing_parameters_db963f73",
							)}
						</li>
						<li>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.logic_changes_that_conflict_with_previously_sele_4f020521",
							)}
						</li>
					</ul>
					<p className="mb-0">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.please_contact_the_5a1f1f34",
						)}
						<strong>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.template_administrator_bdc00e1f",
							)}
						</strong>
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.to_review_the_changes_and_ensure_compatibility_f_a78ca067",
						)}
					</p>
					<p className="mb-0">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.consider_supplying_defaults_for_new_parameters_o_80b9952c",
						)}
					</p>
				</Alert>
			)}
			{diagnostics && diagnostics.length > 0 && (
				<div className="flex flex-col gap-4 mb-8">
					{diagnostics.map((diagnostic, index) => (
						<div
							key={`diagnostic-${diagnostic.summary}-${index}`}
							className={cn(
								"text-xs flex flex-col rounded-md border px-4 pb-3 border-solid",
								diagnostic.severity === "error"
									? "text-content-destructive border-border-destructive"
									: "text-content-warning border-border-warning",
							)}
						>
							<div className="flex items-center m-0">
								<p className="font-medium">{diagnostic.summary}</p>
							</div>
							{diagnostic.detail && (
								<p className="m-0 pb-0">{diagnostic.detail}</p>
							)}
						</div>
					))}
				</div>
			)}
			{(templateVersionId || workspace.latest_build.template_version_id) && (
				<div className="flex flex-col gap-2">
					<Label className="text-sm text-content-secondary">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.version_id_727fd609",
						)}
					</Label>
					<p className="m-0 text-xs font-medium font-mono">
						{templateVersionId ?? workspace.latest_build.template_version_id}
					</p>
				</div>
			)}
			<form
				onSubmit={form.handleSubmit}
				className="flex flex-col gap-8"
				data-testid="form"
			>
				{parameters.length > 0 && (
					<section className="flex flex-col gap-9">
						<hgroup>
							<h2 className="text-xl font-medium mb-0">
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.parameters_e68b36b1",
								)}
							</h2>
							<p className="text-sm text-content-secondary m-0">
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.these_are_the_settings_used_by_your_template_imm_7a61d218",
								)}
								<Link
									href={docs(
										"/admin/templates/extending-templates/dynamic-parameters",
									)}
								>
									{tI18n(
										"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.view_docs_61479fda",
									)}
								</Link>
							</p>
						</hgroup>
						{parameters.map((parameter, index) => {
							const currentParameterValueIndex =
								form.values.rich_parameter_values?.findIndex(
									(p) => p.name === parameter.name,
								);
							const parameterFieldIndex =
								currentParameterValueIndex !== undefined
									? currentParameterValueIndex
									: index;
							// Get the form value by parameter name to ensure correct value mapping
							const formValue =
								currentParameterValueIndex !== undefined
									? form.values?.rich_parameter_values?.[
											currentParameterValueIndex
										]?.value || ""
									: "";

							const parameterField = `rich_parameter_values.${parameterFieldIndex}`;
							const isDisabled =
								disabled ||
								parameter.styling?.disabled ||
								!parameter.mutable ||
								isSubmitting;

							return (
								<DynamicParameter
									key={parameter.name}
									parameter={parameter}
									onChange={(value) =>
										handleChange(parameter, parameterField, value)
									}
									autofill={false}
									disabled={isDisabled}
									value={formValue}
								/>
							);
						})}
					</section>
				)}

				<div className="flex justify-end gap-2">
					<Button onClick={onCancel} variant="outline" disabled={isSubmitting}>
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceParametersPage.WorkspaceParametersPageView.cancel_19766ed6",
						)}
					</Button>
					<Button
						type="submit"
						disabled={
							isSubmitting ||
							disabled ||
							hasUnsyncedParameters ||
							diagnostics.some(
								(diagnostic) => diagnostic.severity === "error",
							) ||
							parameters.some((parameter) =>
								parameter.diagnostics.some(
									(diagnostic) => diagnostic.severity === "error",
								),
							)
						}
					>
						<Spinner loading={isSubmitting} />
						{submitLabel}
					</Button>
				</div>
			</form>
		</>
	);
};
