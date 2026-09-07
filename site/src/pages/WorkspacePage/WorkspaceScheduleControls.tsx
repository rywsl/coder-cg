import { cn } from "cn";
import dayjs, { type Dayjs } from "dayjs";
import { ClockIcon, MinusIcon, PlusIcon } from "lucide-react";
import { type FC, type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { Link as RouterLink } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	updateDeadline,
	workspaceByOwnerAndNameKey,
} from "#/api/queries/workspaces";
import type { Template, Workspace } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { TopbarData, TopbarIcon } from "#/components/FullPageLayout/Topbar";
import { Link, type LinkProps } from "#/components/Link/Link";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useTime } from "#/hooks/useTime";
import { getWorkspaceActivityStatus } from "#/modules/workspaces/activity";
import {
	autostartDisplay,
	autostopDisplay,
	getDeadline,
	getMaxDeadline,
	getMaxDeadlineChange,
	getMinDeadline,
} from "#/utils/schedule";
import { isWorkspaceOn } from "#/utils/workspace";

interface WorkspaceScheduleContainerProps {
	children?: ReactNode;
	onClickIcon?: () => void;
}

const WorkspaceScheduleContainer: FC<WorkspaceScheduleContainerProps> = ({
	children,
	onClickIcon,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const icon = (
		<TopbarIcon>
			<ClockIcon
				aria-label={tI18n(
					"WorkspacePage.WorkspaceScheduleControls.schedule_f4830a1d",
				)}
				className="size-icon-sm"
			/>
		</TopbarIcon>
	);

	return (
		<TopbarData>
			<Tooltip>
				<TooltipTrigger asChild>
					{onClickIcon ? (
						<button
							type="button"
							data-testid="schedule-icon-button"
							onClick={onClickIcon}
							className={cn(
								"flex items-center bg-transparent border-0 p-0",
								"[font-size:inherit] leading-[inherit] cursor-pointer",
							)}
						>
							{icon}
						</button>
					) : (
						icon
					)}
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n("WorkspacePage.WorkspaceScheduleControls.schedule_f4830a1d")}
				</TooltipContent>
			</Tooltip>
			{children}
		</TopbarData>
	);
};

interface WorkspaceScheduleControlsProps {
	workspace: Workspace;
	template: Template;
	canUpdateSchedule: boolean;
}

export const WorkspaceScheduleControls: FC<WorkspaceScheduleControlsProps> = ({
	workspace,
	template,
	canUpdateSchedule,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	if (!shouldDisplayScheduleControls(workspace)) {
		return null;
	}

	return (
		<div
			className="flex items-center gap-3 [font-variant-numeric:tabular-nums]"
			data-testid="schedule-controls"
		>
			{isWorkspaceOn(workspace) ? (
				<AutostopDisplay
					workspace={workspace}
					template={template}
					canUpdateSchedule={canUpdateSchedule}
				/>
			) : (
				<WorkspaceScheduleContainer>
					<ScheduleSettingsLink>
						{tI18n(
							"WorkspacePage.WorkspaceScheduleControls.starts_at_f2daa026",
						)}
						{autostartDisplay(workspace.autostart_schedule)}
					</ScheduleSettingsLink>
				</WorkspaceScheduleContainer>
			)}
		</div>
	);
};

interface AutostopDisplayProps {
	workspace: Workspace;
	template: Template;
	canUpdateSchedule: boolean;
}

const AutostopDisplay: FC<AutostopDisplayProps> = ({
	workspace,
	template,
	canUpdateSchedule,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const queryClient = useQueryClient();
	const deadline = getDeadline(workspace);
	const maxDeadlineDecrease = getMaxDeadlineChange(deadline, getMinDeadline());
	const maxDeadlineIncrease = getMaxDeadlineChange(
		getMaxDeadline(workspace),
		deadline,
	);
	const deadlinePlusEnabled = maxDeadlineIncrease >= 1;
	const deadlineMinusEnabled = maxDeadlineDecrease >= 1;
	const deadlineUpdateTimeout = useRef<number>(undefined);
	const lastStableDeadline = useRef<Dayjs>(deadline);

	const updateWorkspaceDeadlineQueryData = (deadline: Dayjs) => {
		queryClient.setQueryData(
			workspaceByOwnerAndNameKey(workspace.owner_name, workspace.name),
			{
				...workspace,
				latest_build: {
					...workspace.latest_build,
					deadline: deadline.toISOString(),
				},
			},
		);
	};

	const updateDeadlineMutation = useMutation({
		...updateDeadline(workspace),
		onSuccess: (_, updatedDeadline) => {
			toast.success(
				tI18n(
					"WorkspacePage.WorkspaceScheduleControls.shutdown_time_for_value0_updated_successfully_04ccefeb",
					{
						value0: workspace.name,
					},
				),
			);
			lastStableDeadline.current = updatedDeadline;
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(
					error,
					tI18n(
						"WorkspacePage.WorkspaceScheduleControls.failed_to_update_shutdown_time_for_value0_please_2d82dd21",
						{
							value0: workspace.name,
						},
					),
				),
				{
					description: getErrorDetail(error),
				},
			);
			updateWorkspaceDeadlineQueryData(lastStableDeadline.current);
		},
	});

	const handleDeadlineChange = (newDeadline: Dayjs) => {
		clearTimeout(deadlineUpdateTimeout.current);
		// Optimistic update
		updateWorkspaceDeadlineQueryData(newDeadline);
		deadlineUpdateTimeout.current = window.setTimeout(() => {
			updateDeadlineMutation.mutate(newDeadline);
		}, 500);
	};

	const activityStatus = useTime(() => getWorkspaceActivityStatus(workspace));
	const { message, tooltip, danger } = autostopDisplay(
		workspace,
		activityStatus,
		template,
	);

	const [showControlsAnyway, setShowControlsAnyway] = useState(false);
	let onClickScheduleIcon: (() => void) | undefined;

	if (activityStatus === "connected") {
		onClickScheduleIcon = () => setShowControlsAnyway((it) => !it);

		const now = dayjs();
		const noRequiredStopSoon =
			!workspace.latest_build.max_deadline ||
			dayjs(workspace.latest_build.max_deadline).isAfter(now.add(2, "hour"));

		// User has shown controls manually, or we should warn about a nearby required stop
		if (!showControlsAnyway && noRequiredStopSoon) {
			return <WorkspaceScheduleContainer onClickIcon={onClickScheduleIcon} />;
		}
	}

	const display = (
		<ScheduleSettingsLink
			data-testid="schedule-controls-autostop"
			className={cn(danger && "text-content-destructive!")}
		>
			{message}
		</ScheduleSettingsLink>
	);

	const controls = canUpdateSchedule && canEditDeadline(workspace) && (
		<div className="flex items-center gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						disabled={!deadlineMinusEnabled}
						variant="outline"
						size="icon"
						onClick={() => {
							handleDeadlineChange(deadline.subtract(1, "h"));
						}}
					>
						<MinusIcon />
						<span className="sr-only">
							{tI18n(
								"WorkspacePage.WorkspaceScheduleControls.subtract_1_hour_from_deadline_78e67387",
							)}
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n(
						"WorkspacePage.WorkspaceScheduleControls.subtract_1_hour_from_deadline_78e67387",
					)}
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						disabled={!deadlinePlusEnabled}
						variant="outline"
						size="icon"
						onClick={() => {
							handleDeadlineChange(deadline.add(1, "h"));
						}}
					>
						<PlusIcon />
						<span className="sr-only">
							{tI18n(
								"WorkspacePage.WorkspaceScheduleControls.add_1_hour_to_deadline_6b9bd8cf",
							)}
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n(
						"WorkspacePage.WorkspaceScheduleControls.add_1_hour_to_deadline_6b9bd8cf",
					)}
				</TooltipContent>
			</Tooltip>
		</div>
	);

	if (tooltip) {
		return (
			<WorkspaceScheduleContainer onClickIcon={onClickScheduleIcon}>
				<Tooltip>
					<TooltipTrigger asChild>{display}</TooltipTrigger>
					<TooltipContent side="bottom" className="max-w-xs">
						{tooltip}
					</TooltipContent>
				</Tooltip>
				{controls}
			</WorkspaceScheduleContainer>
		);
	}

	return (
		<WorkspaceScheduleContainer onClickIcon={onClickScheduleIcon}>
			{display}
			{controls}
		</WorkspaceScheduleContainer>
	);
};

const ScheduleSettingsLink: React.FC<LinkProps> = ({
	children,
	className,
	...props
}) => {
	return (
		<Link
			className={cn(
				"first-letter:uppercase p-0 hover:no-underline text-content-link text-xs",
				className,
			)}
			showExternalIcon={false}
			{...props}
			asChild
		>
			<RouterLink to="settings/schedule">{children}</RouterLink>
		</Link>
	);
};

const hasDeadline = (workspace: Workspace): boolean => {
	return Boolean(workspace.latest_build.deadline);
};

const hasAutoStart = (workspace: Workspace): boolean => {
	return Boolean(workspace.autostart_schedule);
};

const canEditDeadline = (workspace: Workspace): boolean => {
	return isWorkspaceOn(workspace) && hasDeadline(workspace);
};

const shouldDisplayScheduleControls = (workspace: Workspace): boolean => {
	const willAutoStop = isWorkspaceOn(workspace) && hasDeadline(workspace);
	const willAutoStart = !isWorkspaceOn(workspace) && hasAutoStart(workspace);
	return willAutoStop || willAutoStart;
};
