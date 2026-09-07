import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { SectionHeader } from "./components/SectionHeader";
import { UserCompactionThresholdSettings } from "./components/UserCompactionThresholdSettings";

export interface AgentSettingsCompactionPageViewProps {
	models: readonly TypesGen.ChatModel[] | undefined;
	providerTypeByID: ReadonlyMap<string, string>;
	organizations: readonly TypesGen.Organization[];
	modelsError: unknown;
	isLoadingModels: boolean;
	thresholds: readonly TypesGen.UserChatCompactionThreshold[] | undefined;
	isThresholdsLoading: boolean;
	thresholdsError: unknown;
	onSaveThreshold: (
		modelId: string,
		thresholdPercent: number,
	) => Promise<unknown>;
	onResetThreshold: (modelId: string) => Promise<unknown>;
}

export const AgentSettingsCompactionPageView: FC<
	AgentSettingsCompactionPageViewProps
> = ({
	models,
	providerTypeByID,
	organizations,
	modelsError,
	isLoadingModels,
	thresholds,
	isThresholdsLoading,
	thresholdsError,
	onSaveThreshold,
	onResetThreshold,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="flex flex-col gap-8">
			<SectionHeader
				label={tI18n(
					"AgentsPage.AgentSettingsCompactionPageView.compaction_a0ade140",
				)}
				description={tI18n(
					"AgentsPage.AgentSettingsCompactionPageView.customize_when_conversations_with_models_are_aut_f33389e3",
				)}
			/>
			<UserCompactionThresholdSettings
				models={models ?? []}
				providerTypeByID={providerTypeByID}
				organizations={organizations}
				modelsError={modelsError}
				isLoadingModels={isLoadingModels}
				thresholds={thresholds}
				isThresholdsLoading={isThresholdsLoading}
				thresholdsError={thresholdsError}
				onSaveThreshold={onSaveThreshold}
				onResetThreshold={onResetThreshold}
			/>
		</div>
	);
};
