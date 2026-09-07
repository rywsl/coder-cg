import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	chatPlanModeInstructions,
	chatSystemPrompt,
	updateChatPlanModeInstructions,
	updateChatSystemPrompt,
} from "#/api/queries/chats";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { InstructionsPageView } from "./InstructionsPageView";

const InstructionsPage: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { permissions } = useAuthenticated();
	const queryClient = useQueryClient();

	const systemPromptQuery = useQuery({
		...chatSystemPrompt(),
		enabled: permissions.editDeploymentConfig,
	});
	const planModeInstructionsQuery = useQuery({
		...chatPlanModeInstructions(),
		enabled: permissions.editDeploymentConfig,
	});
	const saveSystemPromptMutation = useMutation(
		updateChatSystemPrompt(queryClient),
	);
	const savePlanModeInstructionsMutation = useMutation(
		updateChatPlanModeInstructions(queryClient),
	);

	return (
		<RequirePermission isFeatureVisible={permissions.editDeploymentConfig}>
			<title>
				{pageTitle(
					tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPage.instructions_934652dc",
					),
					tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPage.ai_settings_a8e5e2c6",
					),
				)}
			</title>
			<InstructionsPageView
				systemPromptData={systemPromptQuery.data}
				planModeInstructionsData={planModeInstructionsQuery.data}
				onSaveSystemPrompt={saveSystemPromptMutation.mutateAsync}
				onSavePlanModeInstructions={
					savePlanModeInstructionsMutation.mutateAsync
				}
				onResetSystemPromptSave={saveSystemPromptMutation.reset}
				onResetPlanModeInstructionsSave={savePlanModeInstructionsMutation.reset}
				isSaving={
					saveSystemPromptMutation.isPending ||
					savePlanModeInstructionsMutation.isPending
				}
				isSaveSystemPromptError={saveSystemPromptMutation.isError}
				isSavePlanModeInstructionsError={
					savePlanModeInstructionsMutation.isError
				}
			/>
		</RequirePermission>
	);
};

export default InstructionsPage;
