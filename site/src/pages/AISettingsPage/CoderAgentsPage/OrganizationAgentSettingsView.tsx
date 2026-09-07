import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { i18n } from "#/i18n";
import type { ProviderInfo } from "#/pages/AgentsPage/utils/modelOptions";
import { SubagentModelOverrideSettings } from "#/pages/AISettingsPage/CoderAgentsPage/components/SubagentModelOverrideSettings";

export type SaveModelOverride = (
	req: TypesGen.UpdateChatModelOverrideRequest,
	options?: { onSuccess?: () => void; onError?: () => void },
) => void;

interface OrganizationAgentSettingsViewProps {
	overrides: readonly TypesGen.ChatModelOverrideResponse[] | undefined;
	enabledModels: readonly TypesGen.ChatModel[];
	providerInfoByID: ReadonlyMap<string, ProviderInfo>;
	isLoading: boolean;
	loadError: unknown;
	refetchError: unknown;
	canEdit: boolean;
	showAdvisor: boolean;
	saveByContext: ReadonlyMap<
		TypesGen.ChatModelOverrideContext,
		SaveModelOverride
	>;
	savingContexts: ReadonlySet<TypesGen.ChatModelOverrideContext>;
	errorContexts: ReadonlySet<TypesGen.ChatModelOverrideContext>;
}

const settings: readonly {
	context: TypesGen.ChatModelOverrideContext;
	title: string;
	description: string;
	unavailableModelWarning?: string;
}[] = [
	{
		context: "general",
		title: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.general_subagent_21ad991d",
		),
		description: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.used_by_delegated_agents_that_can_edit_files_or__0b95d089",
		),
	},
	{
		context: "explore",
		title: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.explore_subagent_cd4148ac",
		),
		description: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.used_for_read_only_codebase_exploration_e01bea30",
		),
	},
	{
		context: "title_generation",
		title: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.title_generation_bd87168d",
		),
		description: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.used_to_generate_chat_titles_39a751a7",
		),
		// Title generation fails hard on a broken override instead of falling
		// back to default model selection, so the generic warning is wrong here.
		unavailableModelWarning:
			"The selected model is currently unavailable. Title generation will be skipped until you choose another model or clear this setting.",
	},
	{
		context: "compaction",
		title: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.compaction_a0ade140",
		),
		description: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.used_to_summarize_conversations_near_the_context_40be67d9",
		),
	},
	{
		context: "advisor",
		title: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.advisor_28da8c1f",
		),
		description: i18n.t(
			"agents:AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.used_by_the_advisor_for_strategic_guidance_017836c4",
		),
	},
];

const OrganizationAgentSettingsView: FC<OrganizationAgentSettingsViewProps> = ({
	overrides,
	enabledModels,
	providerInfoByID,
	isLoading,
	loadError,
	refetchError,
	canEdit,
	showAdvisor,
	saveByContext,
	savingContexts,
	errorContexts,
}) => {
	const { t: tI18n } = useTranslation("agents");

	if (loadError) {
		return <ErrorAlert error={loadError} />;
	}
	const visibleSettings = settings.filter(
		(setting) => setting.context !== "advisor" || showAdvisor,
	);

	return (
		<div className="flex flex-col gap-6">
			{refetchError != null && <ErrorAlert error={refetchError} />}
			{enabledModels.length === 0 && !isLoading && refetchError == null && (
				<p role="status" className="m-0 text-content-secondary">
					{tI18n(
						"AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.this_organization_has_no_enabled_chat_models_15083a61",
					)}
				</p>
			)}
			<div className="flex flex-col gap-6 rounded-lg border border-solid border-border px-6 py-7">
				{visibleSettings.map((setting) => {
					const saved = overrides?.find(
						(override) => override.context === setting.context,
					) ?? { context: setting.context, model_config_id: "" };
					const onSave = saveByContext.get(setting.context);
					if (!onSave) {
						return null;
					}
					return (
						<SubagentModelOverrideSettings
							key={setting.context}
							title={setting.title}
							description={setting.description}
							modelOverrideData={overrides === undefined ? undefined : saved}
							enabledModels={enabledModels}
							providerInfoByID={providerInfoByID}
							modelsError={refetchError}
							isLoading={isLoading}
							onSaveModelOverride={onSave}
							isSaving={savingContexts.has(setting.context)}
							isSaveError={errorContexts.has(setting.context)}
							saveErrorMessage={tI18n(
								"AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.failed_to_save_value0_override_64c5c010",
								{
									value0: setting.title.toLowerCase(),
								},
							)}
							unavailableModelWarning={setting.unavailableModelWarning}
							unsetPlaceholder={tI18n(
								"AISettingsPage.CoderAgentsPage.OrganizationAgentSettingsView.use_default_a769cedc",
							)}
							disabled={!canEdit}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default OrganizationAgentSettingsView;
