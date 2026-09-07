import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";

type BatchStopConfirmationProps = {
	workspacesToStop: readonly Workspace[];
	open: boolean;
	isLoading: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export const BatchStopConfirmation: FC<BatchStopConfirmationProps> = ({
	workspacesToStop,
	open,
	onClose,
	onConfirm,
	isLoading,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const workspaceCount = `${workspacesToStop.length} ${
		workspacesToStop.length === 1 ? "workspace" : "workspaces"
	}`;

	return (
		<ConfirmDialog
			type="delete"
			open={open}
			onClose={onClose}
			title={tI18n(
				"WorkspacesPage.BatchStopConfirmation.stop_value0_ef47536e",
				{
					value0: workspaceCount,
				},
			)}
			confirmLoading={isLoading}
			confirmText={tI18n("WorkspacesPage.BatchStopConfirmation.stop_cae7d57b")}
			onConfirm={onConfirm}
			description={tI18n(
				"WorkspacesPage.BatchStopConfirmation.are_you_sure_you_want_to_stop_value0_this_will_t_e39da500",
				{
					value0: workspaceCount,
				},
			)}
		/>
	);
};
