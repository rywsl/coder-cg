import { TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import type { useUnsavedChangesPrompt } from "#/hooks/useUnsavedChangesPrompt";

interface MCPServerFormDialogsProps {
	server?: TypesGen.MCPServerConfig;
	confirmingDelete: boolean;
	setConfirmingDelete: (open: boolean) => void;
	onDeleteServer?: (serverId: string) => Promise<void>;
	isDeleting: boolean;
	unsavedChanges: ReturnType<typeof useUnsavedChangesPrompt>;
}

export const MCPServerFormDialogs: FC<MCPServerFormDialogsProps> = ({
	server,
	confirmingDelete,
	setConfirmingDelete,
	onDeleteServer,
	isDeleting,
	unsavedChanges,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			{server && onDeleteServer && (
				<ConfirmDialog
					type="delete"
					open={confirmingDelete}
					onClose={() => setConfirmingDelete(false)}
					title={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerFormDialogs.delete_mcp_server_1a969bef",
					)}
					confirmText={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerFormDialogs.delete_mcp_server_1a969bef",
					)}
					description={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerFormDialogs.delete_value0_agents_will_no_longer_be_able_to_u_7f15e6a9",
						{
							value0: server.display_name,
						},
					)}
					onConfirm={() => void onDeleteServer(server.id)}
					confirmLoading={isDeleting}
				/>
			)}
			<ConfirmDialog
				type="info"
				hideCancel={false}
				open={unsavedChanges.isOpen}
				onClose={unsavedChanges.onCancel}
				onConfirm={unsavedChanges.onConfirm}
				title={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerFormDialogs.unsaved_changes_a710c2b9",
				)}
				confirmText={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerFormDialogs.confirm_eebdd24a",
				)}
				description={
					<div className="flex items-start gap-3">
						<TriangleAlertIcon className="size-icon-sm mt-1 shrink-0" />
						<p className="m-0">
							{tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormDialogs.your_updates_haven_t_been_saved_leave_anyway_0230d6de",
							)}
						</p>
					</div>
				}
			/>
		</>
	);
};
