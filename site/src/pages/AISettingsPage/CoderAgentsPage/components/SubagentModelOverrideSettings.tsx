import { useFormik } from "formik";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { useTemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";
import { i18n } from "#/i18n";
import { ModelSelector } from "#/pages/AgentsPage/components/ChatElements/ModelSelector";
import { ModelOverrideAlerts } from "#/pages/AgentsPage/components/ModelOverrideAlerts";
import type { ProviderInfo } from "#/pages/AgentsPage/utils/modelOptions";
import { pickReasoningEffort } from "#/pages/AgentsPage/utils/reasoningEffort";
import { AgentSettingLayout } from "./AgentSettingLayout";

export interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface ModelOverrideData {
	readonly model_config_id: string;
	readonly reasoning_effort?: string;
}

interface UpdateModelOverrideRequest {
	readonly model_config_id: string;
	readonly reasoning_effort?: string;
}

interface SubagentModelOverrideSettingsProps {
	title: string;
	description?: ReactNode;
	modelOverrideData: ModelOverrideData | undefined;
	enabledModels: readonly TypesGen.ChatModel[];
	providerInfoByID: ReadonlyMap<string, ProviderInfo>;
	modelsError: unknown;
	isLoading: boolean;
	onSaveModelOverride: (
		req: UpdateModelOverrideRequest,
		options?: MutationCallbacks,
	) => void;
	isSaving: boolean;
	isSaveError: boolean;
	saveErrorMessage: string;
	unsetPlaceholder?: string;
	unavailableModelWarning?: string;
	disabled?: boolean;
}

export const SubagentModelOverrideSettings: FC<
	SubagentModelOverrideSettingsProps
> = ({
	title,
	description,
	modelOverrideData,
	enabledModels,
	providerInfoByID,
	modelsError,
	isLoading,
	onSaveModelOverride,
	isSaving,
	isSaveError,
	saveErrorMessage,
	unsetPlaceholder = i18n.t(
		"agents:AISettingsPage.CoderAgentsPage.components.SubagentModelOverrideSettings.use_chat_default_c22d4ca2",
	),
	unavailableModelWarning = i18n.t(
		"agents:AISettingsPage.CoderAgentsPage.components.SubagentModelOverrideSettings.the_saved_model_is_no_longer_enabled_and_will_be_fdd3e148",
	),
	disabled = false,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSavedVisible, showSavedState } = useTemporarySavedState();
	const hasLoadedModelOverride = modelOverrideData !== undefined;
	const enabledModelOptions = enabledModels.map((modelConfig) => {
		const providerInfo = providerInfoByID.get(modelConfig.ai_provider_id);
		const reasoningEffort = modelConfig.model_config?.reasoning_effort;
		const reasoningEfforts = modelConfig.reasoning_efforts ?? [];
		return {
			id: modelConfig.id,
			provider: providerInfo?.provider ?? "",
			providerId: modelConfig.ai_provider_id,
			providerLabel: providerInfo?.displayName,
			providerIcon: providerInfo?.icon,
			model: modelConfig.model,
			displayName: modelConfig.display_name.trim() || modelConfig.model,
			contextLimit: modelConfig.context_limit,
			...(reasoningEffort?.default
				? { reasoningEffortDefault: reasoningEffort.default }
				: {}),
			...(reasoningEfforts.length > 0 ? { reasoningEfforts } : {}),
		};
	});

	const form = useFormik({
		enableReinitialize: true,
		initialValues: {
			model_config_id: modelOverrideData?.model_config_id ?? "",
			reasoning_effort: modelOverrideData?.reasoning_effort ?? "",
		},
		onSubmit: (values, { resetForm }) => {
			onSaveModelOverride(
				{
					model_config_id: values.model_config_id,
					...(values.reasoning_effort
						? { reasoning_effort: values.reasoning_effort }
						: {}),
				},
				{
					onSuccess: () => {
						showSavedState();
						resetForm({ values });
					},
				},
			);
		},
	});
	const isFormDisabled =
		disabled || isSaving || isLoading || !hasLoadedModelOverride;
	const canSave = hasLoadedModelOverride && !disabled && form.dirty;

	const selectedModelOption = enabledModelOptions.find(
		(option) => option.id === form.values.model_config_id,
	);
	const selectedReasoningEffort = selectedModelOption
		? pickReasoningEffort(
				form.values.reasoning_effort,
				selectedModelOption.reasoningEfforts ?? [],
				selectedModelOption.reasoningEffortDefault,
			)
		: undefined;
	const isUnavailableSavedModel =
		form.values.model_config_id !== "" && selectedModelOption === undefined;

	return (
		<AgentSettingLayout
			title={title}
			description={description}
			showSave={canSave}
			isSaving={isSaving}
			isSavedVisible={isSavedVisible}
			saveDisabled={isFormDisabled || !canSave}
			onSubmit={form.handleSubmit}
			error={
				isSaveError ? <p className="m-0">{saveErrorMessage}</p> : undefined
			}
		>
			<div className="flex w-88 max-w-full flex-col gap-2">
				<ModelSelector
					options={enabledModelOptions}
					value={form.values.model_config_id}
					onValueChange={(value) => {
						const option = enabledModelOptions.find(
							(option) => option.id === value,
						);
						void form.setValues({
							model_config_id: value,
							reasoning_effort:
								pickReasoningEffort(
									"",
									option?.reasoningEfforts ?? [],
									option?.reasoningEffortDefault,
								) ?? "",
						});
					}}
					disabled={isFormDisabled}
					placeholder={
						isUnavailableSavedModel
							? tI18n(
									"AISettingsPage.CoderAgentsPage.components.SubagentModelOverrideSettings.unavailable_model_45052f31",
								)
							: unsetPlaceholder
					}
					emptyMessage={
						isLoading
							? tI18n(
									"AISettingsPage.CoderAgentsPage.components.SubagentModelOverrideSettings.loading_models_80243524",
								)
							: tI18n(
									"AISettingsPage.CoderAgentsPage.components.SubagentModelOverrideSettings.no_enabled_models_found_bd30f5d9",
								)
					}
					className="h-10 w-full justify-between rounded-md border border-border border-solid bg-transparent px-3 text-sm"
					contentClassName="min-w-[18rem]"
					reasoningEffort={selectedReasoningEffort}
					onReasoningEffortChange={(value) =>
						void form.setFieldValue("reasoning_effort", value)
					}
				/>
				<ModelOverrideAlerts
					isUnavailableSavedModel={isUnavailableSavedModel}
					unavailableMessage={unavailableModelWarning}
					modelsError={modelsError}
				/>
			</div>
			<Button
				size="lg"
				variant="outline"
				type="button"
				onClick={() => {
					void form.setValues({
						model_config_id: "",
						reasoning_effort: "",
					});
				}}
				disabled={isFormDisabled}
				className="h-10"
			>
				{tI18n(
					"AISettingsPage.CoderAgentsPage.components.SubagentModelOverrideSettings.clear_83b12c22",
				)}
			</Button>
		</AgentSettingLayout>
	);
};
