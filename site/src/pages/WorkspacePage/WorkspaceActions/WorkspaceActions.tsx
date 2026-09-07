import { type FC, Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { deploymentConfig } from "#/api/queries/deployment";
import type { Workspace, WorkspaceBuildParameter } from "#/api/typesGenerated";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { i18n } from "#/i18n";
import {
	type ActionType,
	abilitiesByWorkspaceStatus,
} from "#/modules/workspaces/actions";
import type { WorkspacePermissions } from "#/modules/workspaces/permissions";
import { WorkspaceMoreActions } from "#/modules/workspaces/WorkspaceMoreActions/WorkspaceMoreActions";
import {
	ActivateButton,
	CancelButton,
	DisabledButton,
	FavoriteButton,
	RestartButton,
	StartButton,
	StopButton,
	UpdateButton,
} from "./Buttons";
import { DebugButton } from "./DebugButton";
import { RetryButton } from "./RetryButton";
import { ShareButton } from "./ShareButton";

interface WorkspaceActionsProps {
	workspace: Workspace;
	isUpdating: boolean;
	isRestarting: boolean;
	permissions: WorkspacePermissions;
	handleToggleFavorite: () => void;
	handleStart: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleStop: () => void;
	handleRestart: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleUpdate: () => void;
	handleCancel: () => void;
	handleRetry: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleDebug: (buildParameters?: WorkspaceBuildParameter[]) => void;
	handleDormantActivate: () => void;
}

export const WorkspaceActions: FC<WorkspaceActionsProps> = ({
	workspace,
	isUpdating,
	isRestarting,
	permissions,
	handleToggleFavorite,
	handleStart,
	handleStop,
	handleRestart,
	handleUpdate,
	handleCancel,
	handleRetry,
	handleDebug,
	handleDormantActivate,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const {
		permissions: { viewDeploymentConfig },
		user,
	} = useAuthenticated();
	const { data: deployment } = useQuery({
		...deploymentConfig(),
		enabled: viewDeploymentConfig,
	});
	const { actions, canCancel, canAcceptJobs } = abilitiesByWorkspaceStatus(
		workspace,
		{
			canDebug: Boolean(deployment?.config.enable_terraform_debug_mode),
			isOwner: user.roles.some((role) => role.name === "owner"),
		},
	);

	const tooltipText = getTooltipText(
		workspace,
		permissions.updateWorkspaceVersion,
	);

	// A mapping of button type to the corresponding React component
	const buttonMapping: Record<ActionType, ReactNode> = {
		updateAndStart: (
			<UpdateButton
				handleAction={handleUpdate}
				isRunning={false}
				requireActiveVersion={false}
			/>
		),
		updateAndStartRequireActiveVersion: (
			<UpdateButton
				handleAction={handleUpdate}
				isRunning={false}
				requireActiveVersion
			/>
		),
		updateAndRestart: (
			<UpdateButton
				handleAction={handleUpdate}
				isRunning
				requireActiveVersion={false}
			/>
		),
		updateAndRestartRequireActiveVersion: (
			<UpdateButton
				handleAction={handleUpdate}
				isRunning
				requireActiveVersion
			/>
		),
		updating: <UpdateButton loading handleAction={handleUpdate} />,
		start: (
			<StartButton
				workspace={workspace}
				handleAction={handleStart}
				tooltipText={tooltipText}
			/>
		),
		starting: (
			<StartButton
				loading
				workspace={workspace}
				handleAction={handleStart}
				tooltipText={tooltipText}
			/>
		),

		stop: <StopButton handleAction={handleStop} />,
		stopping: <StopButton loading handleAction={handleStop} />,
		restart: (
			<RestartButton
				workspace={workspace}
				handleAction={handleRestart}
				tooltipText={tooltipText}
			/>
		),
		restarting: (
			<RestartButton
				loading
				workspace={workspace}
				handleAction={handleRestart}
				tooltipText={tooltipText}
			/>
		),

		deleting: (
			<DisabledButton
				label={tI18n(
					"WorkspacePage.WorkspaceActions.WorkspaceActions.deleting_21ed2f9e",
				)}
			/>
		),
		canceling: (
			<DisabledButton
				label={tI18n(
					"WorkspacePage.WorkspaceActions.WorkspaceActions.canceling_37b4fbc5",
				)}
			/>
		),
		deleted: (
			<DisabledButton
				label={tI18n(
					"WorkspacePage.WorkspaceActions.WorkspaceActions.deleted_b48ff39c",
				)}
			/>
		),
		pending: (
			<DisabledButton
				label={tI18n(
					"WorkspacePage.WorkspaceActions.WorkspaceActions.pending_e2018b95",
				)}
			/>
		),
		activate: <ActivateButton handleAction={handleDormantActivate} />,
		activating: <ActivateButton loading handleAction={handleDormantActivate} />,
		retry: (
			<RetryButton
				handleAction={handleRetry}
				workspace={workspace}
				enableBuildParameters={workspace.latest_build.transition === "start"}
			/>
		),
		debug: (
			<DebugButton
				handleAction={handleDebug}
				workspace={workspace}
				enableBuildParameters={workspace.latest_build.transition === "start"}
			/>
		),
	};

	return (
		<div
			className="flex flex-wrap items-center justify-end gap-2"
			data-testid="workspace-actions"
		>
			{/* Restarting must be handled separately, because it otherwise would appear as stopping */}
			{isUpdating
				? buttonMapping.updating
				: isRestarting
					? buttonMapping.restarting
					: actions.map((action) => (
							<Fragment key={action}>{buttonMapping[action]}</Fragment>
						))}

			{canCancel && <CancelButton handleAction={handleCancel} />}

			{/* Only the owner can favorite a workspace. */}
			{user.id === workspace.owner_id && (
				<FavoriteButton
					workspaceID={workspace.id}
					isFavorite={workspace.favorite}
					onToggle={handleToggleFavorite}
				/>
			)}

			{permissions.shareWorkspace && (
				<ShareButton
					workspace={workspace}
					canUpdatePermissions={permissions.updateWorkspace}
				/>
			)}

			<WorkspaceMoreActions workspace={workspace} disabled={!canAcceptJobs} />
		</div>
	);
};

function getTooltipText(
	workspace: Workspace,
	canChangeVersions: boolean,
): string {
	if (canChangeVersions && workspace.template_require_active_version) {
		return i18n.t(
			"workspaces:WorkspacePage.WorkspaceActions.WorkspaceActions.this_template_requires_automatic_updates_on_work_c41153e2",
		);
	}

	if (workspace.automatic_updates === "always") {
		return i18n.t(
			"workspaces:WorkspacePage.WorkspaceActions.WorkspaceActions.automatic_updates_are_enabled_for_this_workspace_425de450",
		);
	}

	return "";
}
