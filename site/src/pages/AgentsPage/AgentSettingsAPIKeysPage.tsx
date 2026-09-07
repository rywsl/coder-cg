import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	deleteUserChatProviderKey,
	upsertUserChatProviderKey,
	userChatProviderConfigs,
} from "#/api/queries/chats";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { AgentSettingsAPIKeysPageView } from "./AgentSettingsAPIKeysPageView";
import { useOrganizationChatModels } from "./hooks/useOrganizationChatModels";

const incrementResetToken = (
	current: Record<string, number>,
	providerConfigId: string,
) => ({
	...current,
	[providerConfigId]: (current[providerConfigId] ?? 0) + 1,
});

const AgentSettingsAPIKeysPage: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const queryClient = useQueryClient();
	const { organizations } = useDashboard();
	const organizationModels = useOrganizationChatModels(
		organizations.map((organization) => organization.id),
	);
	const [providerPanelResetTokens, setProviderPanelResetTokens] = useState<
		Record<string, number>
	>({});

	const providersQuery = useQuery(userChatProviderConfigs());

	const upsertMutationOptions = upsertUserChatProviderKey(queryClient);
	const upsertMutation = useMutation({
		...upsertMutationOptions,
		onSuccess: async (_data, variables) => {
			await upsertMutationOptions.onSuccess?.();
			setProviderPanelResetTokens((current) =>
				incrementResetToken(current, variables.providerConfigId),
			);
			toast.success(
				tI18n("AgentsPage.AgentSettingsAPIKeysPage.api_key_saved_9aa6f707"),
			);
		},
		onError: (mutationError) => {
			toast.error(
				getErrorMessage(
					mutationError,
					tI18n(
						"AgentsPage.AgentSettingsAPIKeysPage.error_saving_api_key_eabd44d4",
					),
				),
				{
					description: getErrorDetail(mutationError),
				},
			);
		},
	});

	const deleteMutationOptions = deleteUserChatProviderKey(queryClient);
	const deleteMutation = useMutation({
		...deleteMutationOptions,
		onSuccess: async (_data, variables) => {
			await deleteMutationOptions.onSuccess?.();
			setProviderPanelResetTokens((current) =>
				incrementResetToken(current, variables),
			);
			toast.success(
				tI18n("AgentsPage.AgentSettingsAPIKeysPage.api_key_removed_bcec69c0"),
			);
		},
		onError: (mutationError) => {
			toast.error(
				getErrorMessage(
					mutationError,
					tI18n(
						"AgentsPage.AgentSettingsAPIKeysPage.error_removing_api_key_7690c078",
					),
				),
				{
					description: getErrorDetail(mutationError),
				},
			);
		},
	});

	const providerItems = (providersQuery.data ?? []).map((provider) => ({
		provider,
		renderKey: `${provider.provider_id}-${provider.has_user_api_key}-${providerPanelResetTokens[provider.provider_id] ?? 0}`,
		isSaving:
			upsertMutation.isPending &&
			upsertMutation.variables?.providerConfigId === provider.provider_id,
		isRemoving:
			deleteMutation.isPending &&
			deleteMutation.variables === provider.provider_id,
	}));

	return (
		<AgentSettingsAPIKeysPageView
			error={providersQuery.error}
			isLoading={providersQuery.isLoading}
			providerItems={providerItems}
			models={organizationModels.models}
			isModelsLoading={organizationModels.isLoading}
			areModelsUnavailable={Boolean(
				organizationModels.error ?? organizationModels.partialError,
			)}
			onSave={(providerConfigId, apiKey) => {
				upsertMutation.mutate({
					providerConfigId,
					req: { api_key: apiKey },
				});
			}}
			onRemove={(providerConfigId) => {
				deleteMutation.mutate(providerConfigId);
			}}
		/>
	);
};

export default AgentSettingsAPIKeysPage;
