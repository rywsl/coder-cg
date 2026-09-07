import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	getOrganizationLabel,
	OrganizationAutocomplete,
} from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import type { ModelSelectorOption } from "./components/ChatElements";
import {
	PersonalModelOverrideRow,
	type SavePersonalOverride,
} from "./components/PersonalModelOverrideRow";
import { SectionHeader } from "./components/SectionHeader";

export interface AgentSettingsUserAgentsPageViewProps {
	overridesData?: TypesGen.UserChatPersonalModelOverridesResponse;
	overridesError: unknown;
	onRetryOverrides?: () => void;
	isRetryingOverrides?: boolean;
	isLoadingOverrides: boolean;
	modelOptions: readonly ModelSelectorOption[];
	models: readonly TypesGen.ChatModel[];
	modelsError: unknown;
	isLoadingModels: boolean;
	organizations: readonly TypesGen.Organization[];
	selectedOrganization: TypesGen.Organization | undefined;
	onSelectOrganization: (organization: TypesGen.Organization) => void;
	isOrganizationUnresolved: boolean;
	hasNoOrganizationModels: boolean;
	onSaveRootModelOverride: SavePersonalOverride;
	isSavingRootModelOverride: boolean;
	isSaveRootModelOverrideError: boolean;
	onSaveGeneralModelOverride: SavePersonalOverride;
	isSavingGeneralModelOverride: boolean;
	isSaveGeneralModelOverrideError: boolean;
	onSaveExploreModelOverride: SavePersonalOverride;
	isSavingExploreModelOverride: boolean;
	isSaveExploreModelOverrideError: boolean;
}

export const AgentSettingsUserAgentsPageView: FC<
	AgentSettingsUserAgentsPageViewProps
> = ({
	overridesData,
	overridesError,
	onRetryOverrides,
	isRetryingOverrides = false,
	isLoadingOverrides,
	modelOptions,
	models,
	modelsError,
	isLoadingModels,
	organizations,
	selectedOrganization,
	onSelectOrganization,
	isOrganizationUnresolved,
	hasNoOrganizationModels,
	onSaveRootModelOverride,
	isSavingRootModelOverride,
	isSaveRootModelOverrideError,
	onSaveGeneralModelOverride,
	isSavingGeneralModelOverride,
	isSaveGeneralModelOverrideError,
	onSaveExploreModelOverride,
	isSavingExploreModelOverride,
	isSaveExploreModelOverrideError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const personalOverridesEnabled = overridesData?.enabled ?? true;
	const isLoading = isLoadingOverrides || isLoadingModels;
	// Rows stay enabled when the organization has no models so the model-free
	// default modes can still replace a stale saved model override; mode
	// "model" cannot be saved without a valid model anyway.
	const isDisabled =
		isLoading || !personalOverridesEnabled || isOrganizationUnresolved;

	return (
		<div className="flex flex-col gap-8">
			<SectionHeader
				label={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.agents_279b44d2",
				)}
				description={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.choose_personal_model_defaults_for_root_agents_a_49b67c8d",
				)}
			/>
			{organizations.length > 1 && selectedOrganization && (
				<OrganizationAutocomplete
					value={selectedOrganization}
					options={organizations}
					ariaLabel={tI18n(
						"AgentsPage.AgentSettingsUserAgentsPageView.organization_value0_792b6bda",
						{
							value0: getOrganizationLabel(selectedOrganization, organizations),
						},
					)}
					triggerClassName="w-60"
					optionsTabbable
					onChange={(organization) => {
						if (organization) onSelectOrganization(organization);
					}}
				/>
			)}
			{overridesError ? (
				<div className="flex flex-col gap-2">
					<ErrorAlert error={overridesError} />
					{onRetryOverrides && (
						<Button
							disabled={isRetryingOverrides}
							onClick={onRetryOverrides}
							size="sm"
							type="button"
							variant="outline"
						>
							{tI18n(
								"AgentsPage.AgentSettingsUserAgentsPageView.retry_942087cc",
							)}
						</Button>
					)}
				</div>
			) : null}
			{!personalOverridesEnabled && (
				<Alert severity="info">
					<AlertDescription>
						{tI18n(
							"AgentsPage.AgentSettingsUserAgentsPageView.personal_model_overrides_are_disabled_by_an_admi_2e770eb6",
						)}
					</AlertDescription>
				</Alert>
			)}
			{isOrganizationUnresolved && (
				<Alert severity="info">
					<AlertDescription>
						{tI18n(
							"AgentsPage.AgentSettingsUserAgentsPageView.an_organization_is_not_available_personal_model__4e518075",
						)}
					</AlertDescription>
				</Alert>
			)}
			{hasNoOrganizationModels && (
				<Alert severity="info">
					<AlertDescription>
						{tI18n(
							"AgentsPage.AgentSettingsUserAgentsPageView.the_selected_organization_has_no_available_chat__7cdd1fe9",
						)}
					</AlertDescription>
				</Alert>
			)}
			<PersonalModelOverrideRow
				context="root"
				title={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.root_agent_model_a7c6a856",
				)}
				description={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.choose_the_model_behavior_for_new_root_agents_f2f613d3",
				)}
				overrideData={overridesData?.root}
				modelOptions={modelOptions}
				models={models}
				modelsError={modelsError}
				isLoading={isLoading}
				onSave={onSaveRootModelOverride}
				isSaving={isSavingRootModelOverride}
				isSaveError={isSaveRootModelOverrideError}
				saveErrorMessage={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.failed_to_save_root_agent_model_override_24991e92",
				)}
				disabled={isDisabled}
			/>
			<PersonalModelOverrideRow
				context="general"
				title={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.general_subagent_model_7c7b2d70",
				)}
				description={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.choose_the_model_behavior_for_delegated_agents_w_22cbd5f3",
				)}
				overrideData={overridesData?.general}
				deploymentDefault={overridesData?.deployment_defaults.general}
				modelOptions={modelOptions}
				models={models}
				modelsError={modelsError}
				isLoading={isLoading}
				onSave={onSaveGeneralModelOverride}
				isSaving={isSavingGeneralModelOverride}
				isSaveError={isSaveGeneralModelOverrideError}
				saveErrorMessage={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.failed_to_save_general_subagent_model_override_7e7cb1d0",
				)}
				disabled={isDisabled}
			/>
			<PersonalModelOverrideRow
				context="explore"
				title={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.explore_subagent_model_bdc09e4a",
				)}
				description={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.choose_the_model_behavior_for_read_only_explore__eb2c7098",
				)}
				overrideData={overridesData?.explore}
				deploymentDefault={overridesData?.deployment_defaults.explore}
				modelOptions={modelOptions}
				models={models}
				modelsError={modelsError}
				isLoading={isLoading}
				onSave={onSaveExploreModelOverride}
				isSaving={isSavingExploreModelOverride}
				isSaveError={isSaveExploreModelOverrideError}
				saveErrorMessage={tI18n(
					"AgentsPage.AgentSettingsUserAgentsPageView.failed_to_save_explore_subagent_model_override_0d30275c",
				)}
				disabled={isDisabled}
			/>
		</div>
	);
};
