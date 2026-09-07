import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";

interface WorkspaceBuildCancelDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	workspace: Workspace;
}

export const WorkspaceBuildCancelDialog: FC<
	WorkspaceBuildCancelDialogProps
> = ({ open, onClose, onConfirm, workspace }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const action =
		workspace.latest_build.status === "pending"
			? "remove the current build from the build queue"
			: "stop the current build process";

	return (
		<ConfirmDialog
			open={open}
			title={tI18n(
				"workspaces.WorkspaceBuildCancelDialog.WorkspaceBuildCancelDialog.cancel_workspace_build_dd8ead6c",
			)}
			description={tI18n(
				"workspaces.WorkspaceBuildCancelDialog.WorkspaceBuildCancelDialog.are_you_sure_you_want_to_cancel_the_build_for_wo_cb488208",
				{
					value0: workspace.name,
					value1: action,
				},
			)}
			confirmText={tI18n(
				"workspaces.WorkspaceBuildCancelDialog.WorkspaceBuildCancelDialog.confirm_eebdd24a",
			)}
			cancelText={tI18n(
				"workspaces.WorkspaceBuildCancelDialog.WorkspaceBuildCancelDialog.cancel_19766ed6",
			)}
			onClose={onClose}
			onConfirm={onConfirm}
			type="delete"
		/>
	);
};
