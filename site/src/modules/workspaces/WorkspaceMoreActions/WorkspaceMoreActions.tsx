import {
	CopyIcon,
	DownloadIcon,
	EllipsisVerticalIcon,
	HistoryIcon,
	SettingsIcon,
	SquareIcon,
	TrashIcon,
} from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link as RouterLink } from "react-router";
import { toast } from "sonner";
import { ParameterValidationError } from "#/api/api";
import {
	type ApiError,
	getErrorDetail,
	getErrorMessage,
	isApiError,
} from "#/api/errors";
import {
	changeVersion,
	deleteWorkspace,
	workspacePermissions,
} from "#/api/queries/workspaces";
import type { Workspace } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { WorkspaceErrorDialog } from "../ErrorDialog/WorkspaceErrorDialog";
import { UpdateBuildParametersDialog } from "../WorkspaceUpdateDialogs";
import { ChangeWorkspaceVersionDialog } from "./ChangeWorkspaceVersionDialog";
import { DownloadLogsDialog } from "./DownloadLogsDialog";
import { useWorkspaceDuplication } from "./useWorkspaceDuplication";
import { WorkspaceDeleteDialog } from "./WorkspaceDeleteDialog";

type WorkspaceMoreActionsProps = {
	workspace: Workspace;
	disabled: boolean;
	onStop?: () => void;
	isStopping?: boolean;
	onActionSuccess?: () => Promise<void> | void;
};

export const WorkspaceMoreActions: FC<WorkspaceMoreActionsProps> = ({
	workspace,
	disabled,
	onStop,
	isStopping,
	onActionSuccess,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const queryClient = useQueryClient();

	const [workspaceErrorDialog, setWorkspaceErrorDialog] = useState<{
		open: boolean;
		error?: ApiError;
	}>({ open: false });

	// Permissions
	const { data: permissions } = useQuery(workspacePermissions(workspace));

	// Download logs
	const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

	// Change version
	const [changeVersionDialogOpen, setChangeVersionDialogOpen] = useState(false);
	const changeVersionMutation = useMutation(
		changeVersion(workspace, queryClient),
	);

	const handleError = (error: unknown) => {
		if (isApiError(error) && error.code === "ERR_BAD_REQUEST") {
			setWorkspaceErrorDialog({
				open: true,
				error: error,
			});
		} else {
			toast.error(
				getErrorMessage(
					error,
					tI18n(
						"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.failed_to_delete_workspace_value0_7c221751",
						{
							value0: workspace.name,
						},
					),
				),
				{
					description: getErrorDetail(error),
				},
			);
		}
	};

	// Delete
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const deleteWorkspaceOptions = deleteWorkspace(workspace, queryClient);
	const deleteWorkspaceMutation = useMutation({
		...deleteWorkspaceOptions,
		onSuccess: async (build) => {
			await deleteWorkspaceOptions.onSuccess?.(build);
			await onActionSuccess?.();
		},
		onError: (error: unknown) => {
			handleError(error);
		},
	});

	// Duplicate
	const { duplicateWorkspace, isDuplicationReady } =
		useWorkspaceDuplication(workspace);

	// Since the workspace state is not updated immediately after the mutation, we
	// need to be sure the menu is closed when the action gets disabled.
	// Reference: https://github.com/coder/coder/pull/17775#discussion_r2087273706
	const [open, setOpen] = useState(false);
	useEffect(() => {
		setOpen((open) => (disabled ? false : open));
	});

	return (
		<>
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						size="icon-lg"
						variant="subtle"
						data-testid="workspace-options-button"
						aria-controls="workspace-options"
						disabled={disabled}
					>
						<EllipsisVerticalIcon aria-hidden="true" />
						<span className="sr-only">
							{tI18n(
								"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.workspace_actions_66f56cc7",
							)}
						</span>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent id="workspace-options" align="end">
					{onStop && (
						<DropdownMenuItem onClick={onStop} disabled={isStopping}>
							<SquareIcon />
							{tI18n(
								"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.stop_6b4c3354",
							)}
						</DropdownMenuItem>
					)}

					<DropdownMenuItem asChild>
						<RouterLink
							to={`/@${workspace.owner_name}/${workspace.name}/settings`}
						>
							<SettingsIcon />
							{tI18n(
								"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.settings_74a883a0",
							)}
						</RouterLink>
					</DropdownMenuItem>

					{permissions?.updateWorkspaceVersion && (
						<DropdownMenuItem
							onClick={() => {
								setChangeVersionDialogOpen(true);
							}}
						>
							<HistoryIcon />
							{tI18n(
								"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.change_version_1ed5322e",
							)}
						</DropdownMenuItem>
					)}

					<DropdownMenuItem
						onClick={duplicateWorkspace}
						disabled={!isDuplicationReady}
					>
						<CopyIcon />
						{tI18n(
							"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.duplicate_5d202208",
						)}
					</DropdownMenuItem>

					<DropdownMenuItem onClick={() => setIsDownloadDialogOpen(true)}>
						<DownloadIcon />
						{tI18n(
							"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.download_logs_6213204d",
						)}
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						className="text-content-destructive focus:text-content-destructive"
						onClick={() => {
							setIsConfirmingDelete(true);
						}}
						data-testid="delete-button"
					>
						<TrashIcon />
						{tI18n(
							"workspaces.WorkspaceMoreActions.WorkspaceMoreActions.delete_9ce78fe3",
						)}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<DownloadLogsDialog
				workspace={workspace}
				open={isDownloadDialogOpen}
				onClose={() => setIsDownloadDialogOpen(false)}
			/>
			{changeVersionMutation.error instanceof ParameterValidationError && (
				<UpdateBuildParametersDialog
					workspace={workspace}
					error={changeVersionMutation.error}
					onClose={() => {
						changeVersionMutation.reset();
					}}
				/>
			)}
			<ChangeWorkspaceVersionDialog
				workspace={workspace}
				open={changeVersionDialogOpen}
				onClose={() => {
					setChangeVersionDialogOpen(false);
				}}
				onConfirm={(version) => {
					setChangeVersionDialogOpen(false);
					changeVersionMutation.mutate({ versionId: version.id });
				}}
			/>
			<WorkspaceDeleteDialog
				workspace={workspace}
				canDeleteFailedWorkspace={Boolean(permissions?.deleteFailedWorkspace)}
				isOpen={isConfirmingDelete}
				onCancel={() => {
					setIsConfirmingDelete(false);
				}}
				onConfirm={(orphan) => {
					deleteWorkspaceMutation.mutate({ orphan });
					setIsConfirmingDelete(false);
				}}
			/>
			<WorkspaceErrorDialog
				open={workspaceErrorDialog.open}
				error={workspaceErrorDialog.error}
				onClose={() => setWorkspaceErrorDialog({ open: false })}
				workspaceOwner={workspace.owner_name}
				workspaceName={workspace.name}
				templateVersionId={workspace.latest_build.template_version_id}
				isDeleting
			/>
		</>
	);
};
