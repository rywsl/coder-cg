import {
	BanIcon,
	PlayIcon,
	PowerIcon,
	RotateCcwIcon,
	SquareIcon,
	StarIcon,
	StarOffIcon,
} from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace, WorkspaceBuildParameter } from "#/api/typesGenerated";
import { TopbarButton } from "#/components/FullPageLayout/Topbar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { BuildParametersPopover } from "./BuildParametersPopover";

export interface ActionButtonProps {
	loading?: boolean;
	handleAction: (buildParameters?: WorkspaceBuildParameter[]) => void;
	disabled?: boolean;
	tooltipText?: string;
	isRunning?: boolean;
	requireActiveVersion?: boolean;
}

export const UpdateButton: FC<ActionButtonProps> = ({
	handleAction,
	loading,
	isRunning,
	requireActiveVersion,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<TopbarButton
					data-testid="workspace-update-button"
					disabled={loading}
					onClick={() => handleAction()}
				>
					{requireActiveVersion ? <PlayIcon /> : <RotateCcwIcon />}
					{loading
						? tI18n("WorkspacePage.WorkspaceActions.Buttons.updating_dfe40efe")
						: isRunning
							? tI18n(
									"WorkspacePage.WorkspaceActions.Buttons.update_and_restart_9450cfaf",
								)
							: tI18n(
									"WorkspacePage.WorkspaceActions.Buttons.update_and_start_b5b2f526",
								)}
				</TopbarButton>
			</TooltipTrigger>
			<TooltipContent side="bottom" className="max-w-xs">
				{requireActiveVersion
					? tI18n(
							"WorkspacePage.WorkspaceActions.Buttons.this_template_requires_automatic_updates_on_work_2b6b3f60",
						)
					: isRunning
						? tI18n(
								"WorkspacePage.WorkspaceActions.Buttons.stop_workspace_and_restart_it_with_the_latest_te_9ca06809",
							)
						: tI18n(
								"WorkspacePage.WorkspaceActions.Buttons.start_workspace_with_the_latest_template_version_42d08e85",
							)}
			</TooltipContent>
		</Tooltip>
	);
};

export const ActivateButton: FC<ActionButtonProps> = ({
	handleAction,
	loading,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<TopbarButton disabled={loading} onClick={() => handleAction()}>
			<PowerIcon />
			{loading
				? tI18n("WorkspacePage.WorkspaceActions.Buttons.activating_230f6d1b")
				: tI18n("WorkspacePage.WorkspaceActions.Buttons.activate_24433c70")}
		</TopbarButton>
	);
};

interface ActionButtonPropsWithWorkspace extends ActionButtonProps {
	workspace: Workspace;
}

export const StartButton: FC<ActionButtonPropsWithWorkspace> = ({
	handleAction,
	workspace,
	loading,
	disabled,
	tooltipText,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	let mainButton = (
		<TopbarButton
			data-testid="workspace-start"
			onClick={() => handleAction()}
			disabled={disabled || loading}
		>
			<PlayIcon />
			{loading
				? tI18n("WorkspacePage.WorkspaceActions.Buttons.starting_bbe5fc3b")
				: tI18n("WorkspacePage.WorkspaceActions.Buttons.start_e4bb9f1e")}
		</TopbarButton>
	);

	if (tooltipText) {
		mainButton = (
			<Tooltip>
				<TooltipTrigger asChild>{mainButton}</TooltipTrigger>
				<TooltipContent side="bottom" className="max-w-xs">
					{tooltipText}
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<div className="flex gap-1 items-center">
			{mainButton}
			<BuildParametersPopover
				label={tI18n(
					"WorkspacePage.WorkspaceActions.Buttons.start_with_build_parameters_54d3f10b",
				)}
				workspace={workspace}
				disabled={loading}
			/>
		</div>
	);
};

export const StopButton: FC<ActionButtonProps> = ({
	handleAction,
	loading,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<TopbarButton
			disabled={loading}
			onClick={() => handleAction()}
			data-testid="workspace-stop-button"
		>
			<SquareIcon />
			{loading
				? tI18n("WorkspacePage.WorkspaceActions.Buttons.stopping_bbe85741")
				: tI18n("WorkspacePage.WorkspaceActions.Buttons.stop_cae7d57b")}
		</TopbarButton>
	);
};

export const RestartButton: FC<ActionButtonPropsWithWorkspace> = ({
	handleAction,
	loading,
	workspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<div className="flex gap-1 items-center">
			<TopbarButton
				onClick={() => handleAction()}
				data-testid="workspace-restart-button"
				disabled={loading}
			>
				<RotateCcwIcon />
				{loading
					? tI18n("WorkspacePage.WorkspaceActions.Buttons.restarting_75d0f146")
					: tI18n("WorkspacePage.WorkspaceActions.Buttons.restart_2c58de95")}
			</TopbarButton>
			<BuildParametersPopover
				label={tI18n(
					"WorkspacePage.WorkspaceActions.Buttons.restart_with_build_parameters_97360bde",
				)}
				workspace={workspace}
				disabled={loading}
			/>
		</div>
	);
};

export const CancelButton: FC<ActionButtonProps> = ({ handleAction }) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<TopbarButton onClick={() => handleAction()}>
			<BanIcon />
			{tI18n("WorkspacePage.WorkspaceActions.Buttons.cancel_19766ed6")}
		</TopbarButton>
	);
};

interface DisabledButtonProps {
	label: string;
}

export const DisabledButton: FC<DisabledButtonProps> = ({ label }) => {
	return (
		<TopbarButton disabled>
			<BanIcon />
			{label}
		</TopbarButton>
	);
};

interface FavoriteButtonProps {
	onToggle: (workspaceID: string) => void;
	workspaceID: string;
	isFavorite: boolean;
}

export const FavoriteButton: FC<FavoriteButtonProps> = ({
	onToggle,
	workspaceID,
	isFavorite,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<TopbarButton onClick={() => onToggle(workspaceID)}>
			{isFavorite ? <StarOffIcon /> : <StarIcon />}
			{isFavorite
				? tI18n("WorkspacePage.WorkspaceActions.Buttons.unfavorite_5e87a7bd")
				: tI18n("WorkspacePage.WorkspaceActions.Buttons.favorite_ea713ecd")}
		</TopbarButton>
	);
};
