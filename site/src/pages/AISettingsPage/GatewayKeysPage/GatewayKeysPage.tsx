import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorMessage } from "#/api/errors";
import {
	aiGatewayKeysList,
	createAIGatewayKeyMutation,
	deleteAIGatewayKeyMutation,
} from "#/api/queries/aiGatewayKeys";
import type { AIGatewayKey } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { CreateGatewayKeyDialog } from "./CreateGatewayKeyDialog";
import { GatewayKeysPageView } from "./GatewayKeysPageView";

const GatewayKeysPage: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { permissions } = useAuthenticated();
	const featureVisibility = useFeatureVisibility();
	const showPaywall = !featureVisibility.aibridge;

	const queryClient = useQueryClient();
	const keysQuery = useQuery({
		...aiGatewayKeysList(),
		enabled: !showPaywall,
	});
	const createMutation = useMutation(createAIGatewayKeyMutation(queryClient));
	const deleteMutation = useMutation(deleteAIGatewayKeyMutation(queryClient));

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [keyToDelete, setKeyToDelete] = useState<AIGatewayKey | undefined>(
		undefined,
	);

	return (
		<RequirePermission isFeatureVisible={permissions.viewAIGatewayKeys}>
			<title>
				{pageTitle(
					tI18n(
						"AISettingsPage.GatewayKeysPage.GatewayKeysPage.ai_gateway_keys_a24b1342",
					),
				)}
			</title>
			<GatewayKeysPageView
				keys={keysQuery.data ?? []}
				isLoading={keysQuery.isLoading}
				error={keysQuery.error}
				showPaywall={showPaywall}
				permissions={permissions}
				onCreateKey={() => setIsCreateOpen(true)}
				onDeleteKey={setKeyToDelete}
			/>
			<CreateGatewayKeyDialog
				open={isCreateOpen}
				onClose={() => {
					createMutation.reset();
					setIsCreateOpen(false);
				}}
				onCreate={(name) => createMutation.mutate({ name })}
				createdKey={createMutation.data}
				submitError={createMutation.error}
				isSubmitting={createMutation.isPending}
			/>
			<ConfirmDialog
				type="delete"
				title={tI18n(
					"AISettingsPage.GatewayKeysPage.GatewayKeysPage.delete_ai_gateway_key_02d939d5",
				)}
				description={
					<>
						{tI18n(
							"AISettingsPage.GatewayKeysPage.GatewayKeysPage.are_you_sure_you_want_to_permanently_delete_key_cf468ed7",
						)}{" "}
						<strong>{keyToDelete?.name}</strong>
						{tI18n(
							"AISettingsPage.GatewayKeysPage.GatewayKeysPage.any_ai_gateway_replica_using_it_will_no_longer_b_3186c49a",
						)}
					</>
				}
				open={Boolean(keyToDelete)}
				confirmLoading={deleteMutation.isPending}
				onConfirm={() => {
					if (!keyToDelete) {
						return;
					}
					const name = keyToDelete.name;
					deleteMutation.mutate(keyToDelete.id, {
						onSuccess: () => {
							toast.success(
								tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPage.deleted_ai_gateway_key_value0_successfully_9e750843",
									{
										value0: name,
									},
								),
							);
							setKeyToDelete(undefined);
						},
						onError: (error) => {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"AISettingsPage.GatewayKeysPage.GatewayKeysPage.failed_to_delete_ai_gateway_key_9c609405",
									),
								),
							);
						},
					});
				}}
				onClose={() => setKeyToDelete(undefined)}
			/>
		</RequirePermission>
	);
};

export default GatewayKeysPage;
