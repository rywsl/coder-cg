import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getErrorDetail, getErrorMessage, isApiError } from "#/api/errors";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";

interface WorkspaceErrorDialogProps {
	open: boolean;
	error?: unknown;
	onClose: () => void;
	showDetail?: boolean;
	workspaceOwner: string;
	workspaceName: string;
	templateVersionId: string;
	isDeleting: boolean;
}

export const WorkspaceErrorDialog: FC<WorkspaceErrorDialogProps> = ({
	open,
	error,
	onClose,
	showDetail = false,
	workspaceOwner,
	workspaceName,
	templateVersionId,
	isDeleting,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const navigate = useNavigate();

	if (!error) {
		return null;
	}

	const handleGoToParameters = () => {
		onClose();
		navigate(
			`/@${workspaceOwner}/${workspaceName}/settings/parameters?templateVersionId=${templateVersionId}`,
		);
	};

	const errorDetail = getErrorDetail(error);
	const validations = isApiError(error)
		? error.response.data.validations
		: undefined;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent variant="destructive">
				<DialogHeader>
					<DialogTitle>
						{tI18n(
							"workspaces.ErrorDialog.WorkspaceErrorDialog.error_4a5f25a6",
						)}
						{isDeleting
							? tI18n(
									"workspaces.ErrorDialog.WorkspaceErrorDialog.deleting_8901f3f8",
								)
							: tI18n(
									"workspaces.ErrorDialog.WorkspaceErrorDialog.building_5167e967",
								)}
						{tI18n(
							"workspaces.ErrorDialog.WorkspaceErrorDialog.workspace_4be0369b",
						)}
					</DialogTitle>
					<DialogDescription className="flex flex-row gap-4">
						<strong className="text-content-primary">
							{tI18n(
								"workspaces.ErrorDialog.WorkspaceErrorDialog.message_2f77668a",
							)}
						</strong>{" "}
						<span>
							{getErrorMessage(
								error,
								tI18n(
									"workspaces.ErrorDialog.WorkspaceErrorDialog.failed_to_build_workspace_18777c6b",
								),
							)}
						</span>
					</DialogDescription>
					{errorDetail && showDetail && (
						<DialogDescription className="flex flex-row gap-9">
							<strong className="text-content-primary">
								{tI18n(
									"workspaces.ErrorDialog.WorkspaceErrorDialog.detail_fb5f27d5",
								)}
							</strong>{" "}
							<span>{errorDetail}</span>
						</DialogDescription>
					)}
					{validations && (
						<DialogDescription className="flex flex-row gap-4">
							<strong className="text-content-primary">
								{tI18n(
									"workspaces.ErrorDialog.WorkspaceErrorDialog.validations_9bab08a2",
								)}
							</strong>{" "}
							<span>
								{validations.map((validation) => validation.detail).join(", ")}
							</span>
						</DialogDescription>
					)}
				</DialogHeader>
				<DialogFooter>
					<Button onClick={handleGoToParameters}>
						{tI18n(
							"workspaces.ErrorDialog.WorkspaceErrorDialog.review_workspace_settings_fe1e12fe",
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
