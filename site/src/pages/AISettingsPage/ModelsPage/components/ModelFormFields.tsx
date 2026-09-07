import { cn } from "cn";
import type { FormikContextType } from "formik";
import { ChevronDownIcon, ChevronRightIcon, InfoIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	Link as RouterLink,
	useLocation,
	useNavigate,
	useSearchParams,
} from "react-router";
import { getVisibleProviderFields } from "#/api/chatModelOptions";
import type * as TypesGen from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { Input } from "#/components/Input/Input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/InputGroup/InputGroup";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { OrganizationField } from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import type { ProviderState } from "#/modules/aiModels/providerStates";
import {
	GeneralModelConfigFields,
	ModelConfigFields,
	PricingEstimateFields,
	ReasoningEffortConfigFields,
} from "#/pages/AgentsPage/components/ChatModelAdminPanel/ModelConfigFields";
import { ModelIdentifierField } from "#/pages/AgentsPage/components/ChatModelAdminPanel/ModelIdentifierField";
import type {
	ModelConfigFormBuildResult,
	ModelFormValues,
} from "#/pages/AgentsPage/components/ChatModelAdminPanel/modelConfigFormLogic";
import { docs } from "#/utils/docs";
import type { FormHelpers } from "#/utils/formUtils";
import {
	creatableModelOrganizations,
	selectModelOrganizationPath,
	useOrganizationModels,
	useOrganizationModelsPath,
} from "../organizationModels";
import { ModelFormProviderSelect } from "./ModelFormProviderSelect";

const CollapsibleSection: FC<{
	title: string;
	description: ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	className?: string;
	contentClassName?: string;
	children: ReactNode;
}> = ({
	title,
	description,
	open,
	onOpenChange,
	className,
	contentClassName,
	children,
}) => {
	return (
		<Collapsible
			open={open}
			onOpenChange={onOpenChange}
			className={cn("p-4", className)}
		>
			<CollapsibleTrigger className="flex w-full cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left transition-colors hover:text-content-primary">
				{open ? (
					<ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-content-secondary" />
				) : (
					<ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-content-secondary" />
				)}
				<div>
					<h3 className="m-0 text-sm font-medium text-content-primary">
						{title}
					</h3>
					<p className="m-0 text-xs text-content-secondary">{description}</p>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className={contentClassName}>{children}</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

export const ModelFormFields: FC<{
	form: FormikContextType<ModelFormValues>;
	mode: "add" | "edit" | "duplicate";
	providerStates: readonly ProviderState[];
	selectedProviderState: ProviderState;
	selectedProviderKey: string;
	selectedProviderType: string;
	onProviderChange: (providerKey: string) => void;
	isDuplicating: boolean;
	isEditing: boolean;
	isSaving: boolean;
	isReadOnly: boolean;
	canSubmit: boolean;
	initialModel?: TypesGen.ChatModel;
	modelField: FormHelpers;
	contextLimitField: FormHelpers;
	compressionThresholdField: FormHelpers;
	displayNameField: FormHelpers;
	setDefaultDisabled: boolean;
	modelConfigFormBuildResult: ModelConfigFormBuildResult;
	showCostEstimate: boolean;
	setShowCostEstimate: (open: boolean) => void;
	showProviderConfig: boolean;
	setShowProviderConfig: (open: boolean) => void;
	showAdvanced: boolean;
	setShowAdvanced: (open: boolean) => void;
}> = ({
	form,
	mode,
	providerStates,
	selectedProviderState,
	selectedProviderKey,
	selectedProviderType,
	onProviderChange,
	isDuplicating,
	isEditing,
	isSaving,
	isReadOnly,
	canSubmit,
	initialModel,
	modelField,
	contextLimitField,
	compressionThresholdField,
	displayNameField,
	setDefaultDisabled,
	modelConfigFormBuildResult,
	showCostEstimate,
	setShowCostEstimate,
	showProviderConfig,
	setShowProviderConfig,
	showAdvanced,
	setShowAdvanced,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const modelsPath = useOrganizationModelsPath();
	const { organization, accessibleOrganizations, permissionsByOrganization } =
		useOrganizationModels();
	const location = useLocation();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const selectableOrganizations = isEditing
		? accessibleOrganizations
		: creatableModelOrganizations(
				accessibleOrganizations,
				permissionsByOrganization,
			);
	const organizationField = isEditing ? (
		<OrganizationField
			id="model-form-organization"
			organization={organization}
			organizations={accessibleOrganizations}
			readOnly
		/>
	) : selectableOrganizations.length > 1 ? (
		<OrganizationField
			id="model-form-organization"
			organization={organization}
			organizations={selectableOrganizations}
			optionsTabbable
			onChange={(nextOrganization) => {
				void navigate(
					selectModelOrganizationPath(
						location.pathname,
						nextOrganization,
						searchParams,
					),
				);
			}}
		/>
	) : null;
	const hasProviderConfigFields =
		getVisibleProviderFields(selectedProviderState.provider).length > 0;

	return (
		<div className="border border-solid p-6 rounded-lg">
			<form
				onSubmit={form.handleSubmit}
				spellCheck={false}
				autoComplete="off"
				className="flex flex-col gap-6"
			>
				<div className="grid items-start gap-4 sm:grid-cols-2">
					<ModelFormProviderSelect
						providerStates={providerStates}
						selectedProviderKey={selectedProviderKey}
						isEditing={mode === "edit"}
						onProviderChange={onProviderChange}
						disabled={
							isDuplicating || isReadOnly || providerStates.length === 0
						}
					/>
					<div className="flex flex-col gap-1">
						<ModelIdentifierField
							form={form}
							modelField={modelField}
							mode={mode}
							selectedProvider={selectedProviderType}
							disabled={isSaving || isReadOnly}
							controlClassName="shadow-none"
						/>
						<label
							htmlFor="isDefault"
							className="flex w-fit cursor-pointer items-center gap-2 font-normal text-sm leading-6 text-content-secondary"
						>
							<Checkbox
								id="isDefault"
								checked={form.values.isDefault}
								onCheckedChange={(checked) =>
									form.setFieldValue("isDefault", checked === true)
								}
								disabled={setDefaultDisabled || isReadOnly}
							/>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.set_as_coder_agents_default_model_99a2d16e",
							)}
						</label>
					</div>
					<div className="grid gap-1.5">
						<Label
							htmlFor={displayNameField.id}
							className="flex items-center gap-1 leading-6 text-content-primary"
						>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.display_name_2b7f6a84",
							)}{" "}
							<span className="text-xs font-bold text-content-destructive">
								*
							</span>
						</Label>
						<p className="m-0 text-xs text-content-secondary">
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.friendly_name_defaults_to_identifier_if_blank_887625da",
							)}
						</p>
						<Input
							id={displayNameField.id}
							name={displayNameField.name}
							className="placeholder:text-content-disabled shadow-none"
							placeholder={
								initialModel?.model ??
								tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormFields.model_name_a3c3370c",
								)
							}
							value={displayNameField.value}
							onChange={displayNameField.onChange}
							onBlur={displayNameField.onBlur}
							disabled={isSaving || isReadOnly}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label
							htmlFor={contextLimitField.id}
							className="flex items-center gap-1 leading-6 text-content-primary"
						>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.context_limit_284d7b18",
							)}{" "}
							<span className="text-xs font-bold text-content-destructive">
								*
							</span>
						</Label>
						{contextLimitField.error ? (
							<p className="m-0 text-xs text-content-destructive">
								{contextLimitField.helperText}
							</p>
						) : (
							<p className="m-0 text-xs text-content-secondary">
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormFields.max_tokens_in_the_context_window_0a35073e",
								)}
							</p>
						)}
						<InputGroup
							className={cn(
								contextLimitField.error && "border-border-destructive",
							)}
						>
							<InputGroupInput
								id={contextLimitField.id}
								name={contextLimitField.name}
								className="min-w-0 placeholder:text-content-disabled"
								placeholder="200000"
								value={contextLimitField.value}
								onChange={contextLimitField.onChange}
								onBlur={contextLimitField.onBlur}
								disabled={isSaving || isReadOnly}
								aria-invalid={contextLimitField.error}
							/>
							<InputGroupAddon align="inline-end">
								<span className="text-xs text-content-disabled">
									{tI18n(
										"AISettingsPage.ModelsPage.components.ModelFormFields.tokens_a039dfb9",
									)}
								</span>
							</InputGroupAddon>
						</InputGroup>
					</div>
					{organizationField}
				</div>

				<div className="overflow-hidden rounded-lg border border-solid border-border">
					<CollapsibleSection
						title={tI18n(
							"AISettingsPage.ModelsPage.components.ModelFormFields.cost_estimate_dd62e871",
						)}
						description={
							<>
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormFields.estimated_price_per_million_tokens_in_usd_prices_b0c662b0",
								)}{" "}
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormFields.model_prices_are_managed_by_ai_gateway_d6f4012c",
								)}{" "}
								<Link
									href={docs(
										"/ai-coder/ai-gateway/cost-controls#configure-model-prices",
									)}
									size="sm"
								>
									{tI18n(
										"AISettingsPage.ModelsPage.components.ModelFormFields.learn_how_to_configure_model_prices_9f021805",
									)}
								</Link>
							</>
						}
						open={showCostEstimate}
						onOpenChange={setShowCostEstimate}
						contentClassName="grid grid-cols-2 gap-3 pt-3 pl-6 sm:grid-cols-4"
					>
						<PricingEstimateFields
							provider={selectedProviderType}
							model={form.values.model}
						/>
					</CollapsibleSection>

					{hasProviderConfigFields && (
						<CollapsibleSection
							title={tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.provider_configuration_0e3159fc",
							)}
							description={tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.tune_provider_specific_behavior_like_reasoning_t_2c776324",
							)}
							open={showProviderConfig}
							onOpenChange={setShowProviderConfig}
							className="border-0 border-t border-solid border-border"
							contentClassName="pt-3 pl-6"
						>
							<ModelConfigFields
								provider={selectedProviderState.provider}
								form={form}
								fieldErrors={modelConfigFormBuildResult.fieldErrors}
								disabled={isSaving || isReadOnly}
							>
								<ReasoningEffortConfigFields
									provider={selectedProviderState.provider}
									form={form}
									fieldErrors={modelConfigFormBuildResult.fieldErrors}
									disabled={isSaving || isReadOnly}
								/>
							</ModelConfigFields>
						</CollapsibleSection>
					)}

					<CollapsibleSection
						title={tI18n(
							"AISettingsPage.ModelsPage.components.ModelFormFields.advanced_9f088dbe",
						)}
						description={tI18n(
							"AISettingsPage.ModelsPage.components.ModelFormFields.low_level_parameters_like_temperature_and_penalt_d7ad6dd5",
						)}
						open={showAdvanced}
						onOpenChange={setShowAdvanced}
						className="border-0 border-t border-solid border-border"
						contentClassName="grid grid-cols-2 gap-3 pt-3 pl-6 sm:grid-cols-3"
					>
						<GeneralModelConfigFields
							provider={selectedProviderState.provider}
							form={form}
							fieldErrors={modelConfigFormBuildResult.fieldErrors}
							disabled={isSaving || isReadOnly}
						/>
						<div className="flex min-w-0 flex-col gap-1.5">
							<Label
								htmlFor={compressionThresholdField.id}
								className="flex items-center gap-1 leading-6 text-content-primary"
							>
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormFields.compression_threshold_7b81a3bf",
								)}
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className="size-3 text-content-secondary" />
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-[240px]">
										{tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormFields.percentage_at_which_context_is_compressed_c2a4b7d5",
										)}
									</TooltipContent>
								</Tooltip>
							</Label>
							<InputGroup
								className={cn(
									compressionThresholdField.error &&
										"border-border-destructive",
								)}
							>
								<InputGroupInput
									id={compressionThresholdField.id}
									name={compressionThresholdField.name}
									className="placeholder:text-content-disabled"
									placeholder="70"
									value={compressionThresholdField.value}
									onChange={compressionThresholdField.onChange}
									onBlur={compressionThresholdField.onBlur}
									disabled={isSaving || isReadOnly}
									aria-invalid={compressionThresholdField.error}
								/>
								<InputGroupAddon align="inline-end">
									<span className="text-xs text-content-disabled">%</span>
								</InputGroupAddon>
							</InputGroup>
							{compressionThresholdField.error && (
								<p className="m-0 text-xs text-content-destructive">
									{compressionThresholdField.helperText}
								</p>
							)}
						</div>
					</CollapsibleSection>
				</div>

				<div className="flex items-center justify-end gap-3">
					<RouterLink to={modelsPath}>
						<Button variant="outline" type="button">
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormFields.cancel_19766ed6",
							)}
						</Button>
					</RouterLink>
					{!isReadOnly && (
						<Button type="submit" disabled={!canSubmit}>
							{isSaving && <Spinner loading />}
							{isEditing
								? tI18n(
										"AISettingsPage.ModelsPage.components.ModelFormFields.update_model_34cc9254",
									)
								: isDuplicating
									? tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormFields.create_duplicate_a60883c6",
										)
									: tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormFields.add_model_7060e824",
										)}
						</Button>
					)}
				</div>
			</form>
		</div>
	);
};
