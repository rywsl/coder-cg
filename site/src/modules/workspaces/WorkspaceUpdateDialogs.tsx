import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { Link } from "react-router";
import { ParameterValidationError } from "#/api/api";
import { updateWorkspace } from "#/api/queries/workspaces";
import type {
	TemplateVersion,
	Workspace,
	WorkspaceBuild,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { MemoizedInlineMarkdown } from "#/components/Markdown/InlineMarkdown";

type UseWorkspaceUpdateOptions = {
	workspace: Workspace;
	latestVersion: TemplateVersion | undefined;
	onSuccess?: (build: WorkspaceBuild) => void;
	onError?: (error: unknown) => void;
};

type UseWorkspaceUpdateResult = {
	update: () => void;
	isUpdating: boolean;
	dialogProps: WorkspaceUpdateDialogsProps;
};

export const useWorkspaceUpdate = ({
	workspace,
	latestVersion,
	onSuccess,
	onError,
}: UseWorkspaceUpdateOptions): UseWorkspaceUpdateResult => {
	const queryClient = useQueryClient();
	const [isConfirmingUpdate, setIsConfirmingUpdate] = useState(false);

	const updateWorkspaceOptions = updateWorkspace(workspace, queryClient);
	const updateWorkspaceMutation = useMutation({
		...updateWorkspaceOptions,
		onSuccess: (build: WorkspaceBuild) => {
			updateWorkspaceOptions.onSuccess(build);
			onSuccess?.(build);
		},
		onError,
	});

	const update = () => {
		setIsConfirmingUpdate(true);
	};

	const confirmUpdate = () => {
		updateWorkspaceMutation.mutate({
			buildParameters: [],
		});
		setIsConfirmingUpdate(false);
	};

	return {
		update,
		isUpdating: updateWorkspaceMutation.isPending,
		dialogProps: {
			confirmUpdateDialogProps: {
				open: isConfirmingUpdate,
				onClose: () => setIsConfirmingUpdate(false),
				onConfirm: () => confirmUpdate(),
				latestVersion,
			},
			updateBuildParametersDialogProps:
				updateWorkspaceMutation.error instanceof ParameterValidationError
					? {
							workspace,
							error: updateWorkspaceMutation.error,
							onClose: () => {
								updateWorkspaceMutation.reset();
							},
						}
					: undefined,
		},
	};
};

type WorkspaceUpdateDialogsProps = {
	confirmUpdateDialogProps: ConfirmUpdateDialogProps;
	updateBuildParametersDialogProps?: UpdateBuildParametersDialogProps;
};

export const WorkspaceUpdateDialogs: FC<WorkspaceUpdateDialogsProps> = ({
	confirmUpdateDialogProps,
	updateBuildParametersDialogProps,
}) => {
	return (
		<>
			<ConfirmUpdateDialog {...confirmUpdateDialogProps} />
			{updateBuildParametersDialogProps && (
				<UpdateBuildParametersDialog {...updateBuildParametersDialogProps} />
			)}
		</>
	);
};

type ConfirmUpdateDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	latestVersion?: TemplateVersion;
};

const ConfirmUpdateDialog: FC<ConfirmUpdateDialogProps> = ({
	latestVersion,
	...dialogProps
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<ConfirmDialog
			{...dialogProps}
			hideCancel={false}
			title={tI18n(
				"workspaces.WorkspaceUpdateDialogs.update_workspace_8aac5ce8",
			)}
			confirmText={tI18n("workspaces.WorkspaceUpdateDialogs.update_c1c1009d")}
			description={
				<div className="flex flex-col gap-2">
					<p>
						{tI18n(
							"workspaces.WorkspaceUpdateDialogs.updating_your_workspace_will_start_the_workspace_fb5564bd",
						)}{" "}
						<strong>
							{tI18n(
								"workspaces.WorkspaceUpdateDialogs.delete_non_persistent_data_4a841ebd",
							)}
						</strong>
						.
					</p>
					<div>
						{latestVersion?.message && (
							<MemoizedInlineMarkdown allowedElements={["ol", "ul", "li"]}>
								{latestVersion.message}
							</MemoizedInlineMarkdown>
						)}
					</div>
				</div>
			}
		/>
	);
};

type UpdateBuildParametersDialogProps = {
	workspace: Workspace;
	error: ParameterValidationError;
	onClose: () => void;
};

export const UpdateBuildParametersDialog: FC<
	UpdateBuildParametersDialogProps
> = ({ workspace, error, onClose }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const templateVersionId = error.versionId;
	const validations = error.validations;

	return (
		<Dialog open onOpenChange={() => onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{tI18n(
							"workspaces.WorkspaceUpdateDialogs.update_workspace_parameters_baee9b3e",
						)}
					</DialogTitle>
					<DialogDescription>
						{tI18n(
							"workspaces.WorkspaceUpdateDialogs.this_workspace_has_72a46463",
						)}{" "}
						<strong className="text-content-primary">
							{validations.length}
							{tI18n("workspaces.WorkspaceUpdateDialogs.parameter_956de17a")}
							{validations.length === 1
								? ""
								: tI18n("workspaces.WorkspaceUpdateDialogs.s_043a7187")}
						</strong>{" "}
						{tI18n(
							"workspaces.WorkspaceUpdateDialogs.that_must_be_configured_to_complete_the_update_55204867",
						)}
					</DialogDescription>
					<DialogDescription>
						{tI18n(
							"workspaces.WorkspaceUpdateDialogs.would_you_like_to_go_to_the_workspace_parameters_eafe61e8",
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={onClose} variant="outline">
						{tI18n("workspaces.WorkspaceUpdateDialogs.cancel_19766ed6")}
					</Button>
					<Button asChild>
						<Link
							to={`/@${workspace.owner_name}/${workspace.name}/settings/parameters?templateVersionId=${templateVersionId}`}
						>
							{tI18n(
								"workspaces.WorkspaceUpdateDialogs.go_to_workspace_parameters_1986a430",
							)}
						</Link>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
