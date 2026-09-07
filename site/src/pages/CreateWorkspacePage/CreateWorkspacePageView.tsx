import { type FormikContextType, useFormik } from "formik";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import {
	type FC,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import * as Yup from "yup";
import type * as TypesGen from "#/api/typesGenerated";
import type {
	FriendlyDiagnostic,
	PreviewParameter,
} from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { WorkspaceUserAutocomplete } from "#/components/Autocomplete/WorkspaceUserAutocomplete";
import { Avatar } from "#/components/Avatar/Avatar";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import {
	Combobox,
	ComboboxButton,
	ComboboxContent,
	ComboboxItem,
	ComboboxTrigger,
} from "#/components/Combobox/Combobox";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
} from "#/components/HelpPopover/HelpPopover";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { Spinner } from "#/components/Spinner/Spinner";
import { Switch } from "#/components/Switch/Switch";
import { useDebouncedFunction } from "#/hooks/debounce";
import type { ExternalAuthPollingState } from "#/hooks/useExternalAuth";
import { useSyncFormParameters } from "#/modules/hooks/useSyncFormParameters";
import {
	Diagnostics,
	DynamicParameter,
	getInitialParameterValues,
	useValidationSchemaForDynamicParameters,
} from "#/modules/workspaces/DynamicParameter/DynamicParameter";
import { generateWorkspaceName } from "#/modules/workspaces/generateWorkspaceName";
import { docs } from "#/utils/docs";
import { nameValidator } from "#/utils/formUtils";
import type { AutofillBuildParameter } from "#/utils/richParameters";
import type { CreateWorkspaceMode } from "./CreateWorkspacePage";
import { ExternalAuthButton } from "./ExternalAuthButton";
import type { CreateWorkspacePermissions } from "./permissions";

interface CreateWorkspacePageViewProps {
	autofillParameters: AutofillBuildParameter[];
	canUpdateTemplate?: boolean;
	creatingWorkspace: boolean;
	defaultName?: string | null;
	defaultOwner: TypesGen.MinimalUser;
	diagnostics: readonly FriendlyDiagnostic[];
	disabledParams?: string[];
	error: unknown;
	externalAuth: TypesGen.TemplateVersionExternalAuth[];
	externalAuthPollingState: Record<string, ExternalAuthPollingState>;
	hasAllRequiredExternalAuth: boolean;
	hasIgnoredUrlParams?: boolean;
	mode: CreateWorkspaceMode;
	parameters: PreviewParameter[];
	permissions: CreateWorkspacePermissions;
	presets: TypesGen.Preset[];
	template: TypesGen.Template;
	urlPreset?: TypesGen.Preset;
	urlPresetError?: string;
	versionId?: string;
	versionName?: string;
	onCancel: () => void;
	onSubmit: (
		req: TypesGen.CreateWorkspaceRequest,
		owner: TypesGen.MinimalUser,
	) => void;
	resetMutation: () => void;
	sendMessage: (message: Record<string, string>, ownerId?: string) => void;
	startPollingExternalAuth: (providerId: string) => void;
	owner: TypesGen.MinimalUser;
	setOwner: (user: TypesGen.MinimalUser) => void;
}

export const CreateWorkspacePageView: FC<CreateWorkspacePageViewProps> = ({
	autofillParameters,
	canUpdateTemplate,
	creatingWorkspace,
	defaultName,
	defaultOwner,
	diagnostics,
	disabledParams,
	error,
	externalAuth,
	externalAuthPollingState,
	hasAllRequiredExternalAuth,
	hasIgnoredUrlParams,
	mode,
	parameters,
	permissions,
	presets = [],
	template,
	urlPreset,
	urlPresetError,
	versionId,
	versionName,
	onSubmit,
	onCancel,
	resetMutation,
	sendMessage,
	startPollingExternalAuth,
	owner,
	setOwner,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [suggestedName, setSuggestedName] = useState(generateWorkspaceName);
	const [showPresetParameters, setShowPresetParameters] = useState(false);
	const id = useId();
	const workspaceNameInputRef = useRef<HTMLInputElement>(null);
	const rerollSuggestedName = useCallback(() => {
		setSuggestedName(() => generateWorkspaceName());
	}, []);

	const autofillByName = Object.fromEntries(
		autofillParameters.map((param) => [param.name, param]),
	);

	// Only touched fields are sent to the websocket
	// Autofilled parameters are marked as touched since they have been modified
	const initialTouched = Object.fromEntries(
		parameters.filter((p) => autofillByName[p.name]).map((p) => [p.name, true]),
	);
	if (defaultName) {
		initialTouched.name = true;
	}

	// The form parameters values hold the working state of the parameters that will be submitted when creating a workspace
	// 1. The form parameter values are initialized from the websocket response when the form is mounted
	// 2. Only touched form fields are sent to the websocket, a field is touched if edited by the user or set by autofill
	// 3. The websocket response may add or remove parameters, these are added or removed from the form values in the useSyncFormParameters hook
	// 4. All existing form parameters are updated to match the websocket response
	//    in the useSyncFormParameters hook, unless they have been touched by the
	//    user or auto-filled.
	const form: FormikContextType<TypesGen.CreateWorkspaceRequest> =
		useFormik<TypesGen.CreateWorkspaceRequest>({
			initialValues: {
				name: defaultName ?? "",
				template_id: template.id,
				rich_parameter_values: getInitialParameterValues(
					parameters,
					autofillParameters,
				),
			},
			initialTouched,
			validationSchema: Yup.object({
				name: nameValidator(
					tI18n(
						"CreateWorkspacePage.CreateWorkspacePageView.workspace_name_6fa5a5b1",
					),
				),
				rich_parameter_values:
					useValidationSchemaForDynamicParameters(parameters),
			}),
			enableReinitialize: false,
			validateOnChange: true,
			validateOnBlur: true,
			onSubmit: (request) => {
				if (!hasAllRequiredExternalAuth) {
					return;
				}

				onSubmit(request, owner);
			},
		});

	useEffect(() => {
		if (error) {
			window.scrollTo(0, 0);
		}
	}, [error]);

	useEffect(() => {
		if (form.submitCount > 0 && Object.keys(form.errors).length > 0) {
			workspaceNameInputRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
			workspaceNameInputRef.current?.focus();
		}
	}, [form.submitCount, form.errors]);

	const [presetOptions, setPresetOptions] = useState([
		{
			label: tI18n("CreateWorkspacePage.CreateWorkspacePageView.none_dc937b59"),
			value: "undefined",
			icon: "",
			description: "",
		},
	]);
	const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
	// Build options and keep default label/value in sync
	useEffect(() => {
		const options = [
			{
				label: tI18n(
					"CreateWorkspacePage.CreateWorkspacePageView.none_dc937b59",
				),
				value: "undefined",
				icon: "",
				description: "",
			},
			...presets.map((preset) => ({
				label: preset.Default
					? tI18n(
							"CreateWorkspacePage.CreateWorkspacePageView.value0_default_5f4eaa09",
							{
								value0: preset.Name,
							},
						)
					: preset.Name,
				value: preset.ID,
				icon: preset.Icon,
				description: preset.Description,
			})),
		];
		setPresetOptions(options);

		// URL preset takes precedence over default preset.
		if (urlPreset) {
			const idx = presets.findIndex((p) => p.ID === urlPreset.ID) + 1;
			setSelectedPresetIndex(idx);
			form.setFieldValue("template_version_preset_id", urlPreset.ID);
			return;
		}

		const defaultPreset = presets.find((p) => p.Default);
		if (defaultPreset) {
			const idx = presets.indexOf(defaultPreset) + 1; // +1 for "None"
			setSelectedPresetIndex(idx);
			form.setFieldValue("template_version_preset_id", defaultPreset.ID);
		} else {
			setSelectedPresetIndex(0); // Explicitly set to "None"
			form.setFieldValue("template_version_preset_id", undefined);
		}
	}, [presets, form.setFieldValue, urlPreset]);

	const [presetParameterNames, setPresetParameterNames] = useState<string[]>(
		[],
	);

	// include any modified parameters and all touched parameters to the websocket request
	const { debounced: sendDynamicParamsRequest } = useDebouncedFunction(
		(
			parameters: Array<{ parameter: PreviewParameter; value: string }>,
			ownerId?: string,
		) => {
			const formInputs: Record<string, string> = {};
			const formParameters = form.values.rich_parameter_values ?? [];

			for (const { parameter, value } of parameters) {
				formInputs[parameter.name] = value;
			}

			for (const [fieldName, isTouched] of Object.entries(form.touched)) {
				if (
					isTouched &&
					!parameters.some((p) => p.parameter.name === fieldName)
				) {
					const param = formParameters.find((p) => p.name === fieldName);
					if (param?.value) {
						formInputs[fieldName] = param.value;
					}
				}
			}

			sendMessage(formInputs, ownerId);
		},
		(
			parameters: Array<{ parameter: PreviewParameter; value: string }>,
			_ownerId?: string,
		) => {
			// Return a debounce for string fields (those that involve typing) and
			// zero debounce for all others (so the UI can react immediately).
			return parameters.some(
				({ parameter }) =>
					parameter.form_type === "input" || parameter.form_type === "textarea",
			)
				? 500
				: 0;
		},
	);

	useEffect(() => {
		const selectedPresetOption = presetOptions[selectedPresetIndex];
		let selectedPreset: TypesGen.Preset | undefined;
		for (const preset of presets) {
			if (preset.ID === selectedPresetOption.value) {
				selectedPreset = preset;
				break;
			}
		}

		if (!selectedPreset?.Parameters) {
			setPresetParameterNames([]);
			return;
		}

		setPresetParameterNames(selectedPreset.Parameters.map((p) => p.Name));

		const currentValues = form.values.rich_parameter_values ?? [];

		const updates: Array<{
			field: string;
			fieldValue: TypesGen.WorkspaceBuildParameter;
			parameter: PreviewParameter;
			presetValue: string;
		}> = [];

		for (const presetParameter of selectedPreset.Parameters) {
			const parameterIndex = parameters.findIndex(
				(p) => p.name === presetParameter.Name,
			);
			if (parameterIndex === -1) continue;

			const parameterField = `rich_parameter_values.${parameterIndex}`;
			const parameter = parameters[parameterIndex];
			const currentValue = currentValues.find(
				(p) => p.name === presetParameter.Name,
			)?.value;

			if (currentValue !== presetParameter.Value) {
				updates.push({
					field: parameterField,
					fieldValue: {
						name: presetParameter.Name,
						value: presetParameter.Value,
					},
					parameter,
					presetValue: presetParameter.Value,
				});
			}
		}

		if (updates.length > 0) {
			for (const update of updates) {
				form.setFieldValue(update.field, update.fieldValue);
				form.setFieldTouched(update.parameter.name, true);
			}

			sendDynamicParamsRequest(
				updates.map((update) => ({
					parameter: update.parameter,
					value: update.presetValue,
				})),
			);
		}
	}, [
		presetOptions,
		selectedPresetIndex,
		presets,
		form.setFieldValue,
		form.setFieldTouched,
		parameters,
		form.values.rich_parameter_values,
		sendDynamicParamsRequest,
	]);

	const handleOwnerChange = (user: TypesGen.MinimalUser) => {
		setOwner(user);
		sendDynamicParamsRequest([], user.id);
	};

	const handleChange = async (
		parameter: PreviewParameter,
		parameterField: string,
		value: string,
	) => {
		const currentFormValue = form.values.rich_parameter_values?.find(
			(p) => p.name === parameter.name,
		)?.value;

		await form.setFieldValue(parameterField, {
			name: parameter.name,
			value,
		});

		// Only send the request if the value has changed from the form value
		if (currentFormValue !== value) {
			form.setFieldTouched(parameter.name, true);
			sendDynamicParamsRequest([{ parameter, value }]);
		}
	};

	useSyncFormParameters({
		parameters,
		formValues: form.values.rich_parameter_values ?? [],
		touched: form.touched,
		setFieldValue: form.setFieldValue,
	});

	const disabled =
		creatingWorkspace ||
		!hasAllRequiredExternalAuth ||
		diagnostics.some((diagnostic) => diagnostic.severity === "error") ||
		parameters.some((parameter) =>
			parameter.diagnostics.some(
				(diagnostic) => diagnostic.severity === "error",
			),
		);

	// External auth is connected to the workspace owner. When creating a
	// workspace for another user, the form reflects that owner's auth state and
	// the requester cannot authenticate on their behalf.
	const isCreatingForSelf = owner.id === defaultOwner.id;

	return (
		<section className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,800px)_1fr] gap-x-4 gap-y-6">
			<div>
				<Button variant="subtle" onClick={onCancel} className="-ml-3">
					<ArrowLeftIcon />
					<span>
						{tI18n(
							"CreateWorkspacePage.CreateWorkspacePageView.go_back_6aadac2f",
						)}
					</span>
				</Button>
			</div>
			<div className="flex flex-col gap-6 w-full max-w-(--breakpoint-md) mx-auto pb-96">
				<header className="flex flex-col items-start gap-3 mt-10">
					<div className="flex items-center gap-2 justify-between w-full">
						<span className="flex items-center gap-2">
							<Avatar
								variant="icon"
								size="md"
								src={template.icon}
								fallback={template.name}
							/>
							<p className="text-base font-medium m-0">
								{template.display_name.length > 0
									? template.display_name
									: template.name}
							</p>
							{template.deprecated && (
								<Badge variant="warning" size="sm">
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.deprecated_6b2e8f83",
									)}
								</Badge>
							)}
						</span>
						{canUpdateTemplate && versionName && (
							<Button asChild size="sm" variant="outline">
								<RouterLink
									to={`/templates/${template.organization_name}/${template.name}/versions/${versionName}/edit`}
								>
									<ExternalLinkIcon />
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.view_source_6ee818aa",
									)}
								</RouterLink>
							</Button>
						)}
					</div>
					<span className="flex flex-row items-center gap-2">
						<h1 className="text-3xl font-semibold m-0">
							{tI18n(
								"CreateWorkspacePage.CreateWorkspacePageView.new_workspace_df0caf1b",
							)}
						</h1>

						<HelpPopover>
							<HelpPopoverIconTrigger />
							<HelpPopoverContent className="max-w-xs text-sm">
								{tI18n(
									"CreateWorkspacePage.CreateWorkspacePageView.dynamic_parameters_enhances_coder_s_existing_par_58661a17",
								)}
								<br />
								<Link
									href={docs(
										"/admin/templates/extending-templates/dynamic-parameters",
									)}
								>
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.view_docs_61479fda",
									)}
								</Link>
							</HelpPopoverContent>
						</HelpPopover>
					</span>
				</header>

				<form
					onSubmit={form.handleSubmit}
					aria-label={tI18n(
						"CreateWorkspacePage.CreateWorkspacePageView.create_workspace_form_53922a4c",
					)}
					className="flex flex-col gap-10 w-full border border-border-default border-solid rounded-lg p-6"
					data-testid="form"
				>
					{Boolean(error) && <ErrorAlert error={error} />}

					{template.use_classic_parameter_flow && (
						<Alert
							severity="warning"
							prominent
							actions={
								canUpdateTemplate && (
									<Button asChild size="sm">
										<RouterLink
											to={`/templates/${template.organization_name}/${template.name}/settings/parameters`}
										>
											{tI18n(
												"CreateWorkspacePage.CreateWorkspacePageView.open_template_settings_6ef057ef",
											)}
										</RouterLink>
									</Button>
								)
							}
						>
							<AlertTitle>
								{tI18n(
									"CreateWorkspacePage.CreateWorkspacePageView.this_template_uses_deprecated_parameters_700efe5b",
								)}
							</AlertTitle>
							<AlertDescription>
								{tI18n(
									"CreateWorkspacePage.CreateWorkspacePageView.some_features_like_real_time_validation_and_cond_290806f2",
								)}{" "}
								<Link
									href={docs(
										"/admin/templates/extending-templates/dynamic-parameters",
									)}
									target="_blank"
									rel="noreferrer"
								>
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.view_docs_61479fda",
									)}
									<span className="sr-only">
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.opens_in_new_tab_541f18a6",
										)}
									</span>
								</Link>
							</AlertDescription>
						</Alert>
					)}

					{urlPresetError && (
						<Alert severity="warning" dismissible>
							{urlPresetError}
						</Alert>
					)}

					{hasIgnoredUrlParams && urlPreset && (
						<Alert severity="info" dismissible>
							{tI18n(
								"CreateWorkspacePage.CreateWorkspacePageView.preset_selected_c294532c",
							)}
							<code>param.*</code>
							{tI18n(
								"CreateWorkspacePage.CreateWorkspacePageView.url_parameters_have_been_ignored_use_either_4d8980d8",
							)}
							<code>preset</code>
							{tI18n("CreateWorkspacePage.CreateWorkspacePageView.or_e1a3e78c")}
							<code>param.*</code>
							{tI18n(
								"CreateWorkspacePage.CreateWorkspacePageView.not_both_1c755013",
							)}
						</Alert>
					)}

					{mode === "duplicate" && (
						<Alert
							severity="info"
							dismissible
							data-testid="duplication-warning"
						>
							{tI18n(
								"CreateWorkspacePage.CreateWorkspacePageView.duplicating_a_workspace_only_copies_its_paramete_ff3e7a40",
							)}
						</Alert>
					)}

					<section className="flex flex-col gap-4">
						<hgroup>
							<h2 className="text-xl font-semibold m-0">
								{tI18n(
									"CreateWorkspacePage.CreateWorkspacePageView.general_c910d474",
								)}
							</h2>
							<p className="text-sm text-content-secondary mt-0">
								{permissions.createWorkspaceForAny
									? tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.only_admins_can_create_workspaces_for_other_user_624d5e89",
										)
									: tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.the_name_of_your_new_workspace_a5328103",
										)}
							</p>
						</hgroup>
						<div>
							{versionId && versionId !== template.active_version_id && (
								<div className="flex flex-col gap-2 pb-4">
									<Label className="text-sm" htmlFor={`${id}-version-id`}>
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.version_id_727fd609",
										)}
									</Label>
									<Input id={`${id}-version-id`} value={versionId} disabled />
									<span className="text-xs text-content-secondary">
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.this_parameter_has_been_preset_and_cannot_be_mod_3df8760e",
										)}
									</span>
								</div>
							)}
							<div className="flex gap-4 flex-wrap">
								<div className="flex flex-col gap-2 flex-1">
									<Label className="text-sm" htmlFor={`${id}-workspace-name`}>
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.workspace_name_9619649d",
										)}
									</Label>
									<div className="flex flex-col">
										<Input
											id={`${id}-workspace-name`}
											ref={workspaceNameInputRef}
											value={form.values.name}
											onChange={(e) => {
												form.setFieldValue("name", e.target.value.trim());
												resetMutation();
											}}
											disabled={creatingWorkspace}
										/>
										{form.touched.name && form.errors.name && (
											<div className="text-content-destructive text-xs mt-2">
												{form.errors.name}
											</div>
										)}
										<div className="flex gap-2 text-xs text-content-secondary items-center">
											{tI18n(
												"CreateWorkspacePage.CreateWorkspacePageView.need_a_suggestion_2a72e622",
											)}
											<Button
												variant="subtle"
												size="sm"
												onClick={async () => {
													await form.setFieldValue("name", suggestedName);
													rerollSuggestedName();
												}}
											>
												{suggestedName}
											</Button>
										</div>
									</div>
								</div>
								{permissions.createWorkspaceForAny && (
									<div className="flex flex-col gap-2 flex-1">
										<Label className="text-sm" htmlFor={`${id}-workspace-name`}>
											{tI18n(
												"CreateWorkspacePage.CreateWorkspacePageView.owner_4b1b8aa3",
											)}
										</Label>
										<WorkspaceUserAutocomplete
											organizationId={template.organization_id}
											value={owner}
											onChange={(user) => {
												handleOwnerChange(user ?? defaultOwner);
											}}
										/>
									</div>
								)}
							</div>
						</div>
					</section>

					{externalAuth && externalAuth.length > 0 && (
						<section>
							<hgroup>
								<h2 className="text-xl font-semibold m-0">
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.external_authentication_1b308ef4",
									)}
								</h2>
								<p className="text-sm text-content-secondary mt-0">
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.this_template_uses_external_services_for_authent_4d1de52e",
									)}
								</p>
							</hgroup>
							<div className="flex flex-col gap-4">
								{Boolean(error) && !hasAllRequiredExternalAuth && (
									<Alert severity="error" prominent>
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.to_create_a_workspace_using_this_template_please_6d2b2dd0",
										)}
									</Alert>
								)}
								{!isCreatingForSelf && (
									<Alert severity="info">
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.this_shows_the_external_authentication_state_for_cdf90ec7",
										)}{" "}
										{owner.username}
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.they_must_connect_any_required_providers_themsel_4a0ce5dc",
										)}
									</Alert>
								)}
								{externalAuth.map((auth) => (
									<ExternalAuthButton
										key={auth.id}
										error={error}
										auth={auth}
										canAuthenticate={isCreatingForSelf}
										isLoading={externalAuthPollingState[auth.id] === "polling"}
										onStartPolling={() => startPollingExternalAuth(auth.id)}
										displayRetry={
											externalAuthPollingState[auth.id] === "abandoned"
										}
									/>
								))}
							</div>
						</section>
					)}

					{parameters.length === 0 && diagnostics.length > 0 && (
						<Diagnostics diagnostics={diagnostics} />
					)}

					{parameters.length > 0 && (
						<section className="flex flex-col gap-9">
							<hgroup>
								<h2 className="text-xl font-semibold m-0">
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.parameters_e68b36b1",
									)}
								</h2>
								<p className="text-sm text-content-secondary m-0">
									{tI18n(
										"CreateWorkspacePage.CreateWorkspacePageView.these_are_the_settings_used_by_your_template_imm_7a61d218",
									)}
									<Link
										href={docs(
											"/admin/templates/extending-templates/dynamic-parameters",
										)}
									>
										{tI18n(
											"CreateWorkspacePage.CreateWorkspacePageView.view_docs_61479fda",
										)}
									</Link>
								</p>
							</hgroup>
							{diagnostics.length > 0 && (
								<Diagnostics diagnostics={diagnostics} />
							)}
							{presets.length > 0 && (
								<div className="flex flex-col gap-2">
									<div className="flex gap-2 items-center">
										<Label className="text-sm">
											{tI18n(
												"CreateWorkspacePage.CreateWorkspacePageView.preset_7252e7ce",
											)}
										</Label>
									</div>
									<div className="flex flex-col gap-4">
										<div className="max-w-lg">
											<Combobox
												value={presetOptions[selectedPresetIndex]?.value}
												onValueChange={(value) => {
													const index = presetOptions.findIndex(
														(preset) => preset.value === value,
													);
													if (index === -1) {
														return;
													}
													setSelectedPresetIndex(index);
													form.setFieldValue(
														"template_version_preset_id",
														// "undefined" string is equivalent to using None option.
														// Combobox requires a value in order to correctly
														// highlight the None option.
														presetOptions[index].value === "undefined"
															? undefined
															: presetOptions[index].value,
													);
												}}
											>
												<ComboboxTrigger asChild>
													<ComboboxButton
														selectedOption={{
															label:
																presetOptions[selectedPresetIndex]?.label || "",
															value:
																presetOptions[selectedPresetIndex]?.value || "",
														}}
														placeholder={tI18n(
															"CreateWorkspacePage.CreateWorkspacePageView.select_a_preset_7b64acc8",
														)}
													/>
												</ComboboxTrigger>
												<ComboboxContent align="start">
													{presetOptions.map((preset) => (
														<ComboboxItem
															key={preset.value}
															value={preset.value}
														>
															{preset.icon && (
																<ExternalImage
																	src={preset.icon}
																	alt={preset.label}
																	className="size-4"
																/>
															)}
															{preset.label}
														</ComboboxItem>
													))}
												</ComboboxContent>
											</Combobox>
										</div>
										{/* Only show the preset parameter visibility toggle if preset parameters are actually being modified, otherwise it is ineffectual */}
										{presetParameterNames.length > 0 && (
											<span className="flex items-center gap-3">
												<Switch
													id="show-preset-parameters"
													checked={showPresetParameters}
													onCheckedChange={setShowPresetParameters}
												/>
												<Label htmlFor="show-preset-parameters">
													{tI18n(
														"CreateWorkspacePage.CreateWorkspacePageView.show_preset_parameters_66d4189d",
													)}
												</Label>
											</span>
										)}
									</div>
								</div>
							)}

							<div className="flex flex-col gap-9">
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
									const isPresetParameter = presetParameterNames.includes(
										parameter.name,
									);
									const isDisabled =
										disabledParams?.includes(
											parameter.name.toLowerCase().replace(/ /g, "_"),
										) ||
										parameter.styling?.disabled ||
										creatingWorkspace ||
										isPresetParameter;

									// Always show preset parameters if they have any diagnostics
									if (
										!showPresetParameters &&
										isPresetParameter &&
										parameter.diagnostics.length === 0
									) {
										return null;
									}

									return (
										<DynamicParameter
											key={parameter.name}
											parameter={parameter}
											onChange={(value) =>
												handleChange(parameter, parameterField, value)
											}
											disabled={isDisabled}
											isPreset={isPresetParameter}
											autofill={
												!isPresetParameter &&
												autofillByName[parameter.name] !== undefined
											}
											value={formValue}
										/>
									);
								})}
							</div>
						</section>
					)}

					<div className="flex flex-row justify-end">
						<Button type="submit" disabled={disabled}>
							<Spinner loading={creatingWorkspace} />
							{tI18n(
								"CreateWorkspacePage.CreateWorkspacePageView.create_workspace_4b892277",
							)}
						</Button>
					</div>
				</form>
			</div>
		</section>
	);
};
