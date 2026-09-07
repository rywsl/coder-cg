import {
	MonitorDotIcon,
	MonitorIcon,
	MonitorPauseIcon,
	MonitorXIcon,
} from "lucide-react";
import type { FC } from "react";
import type { Workspace, WorkspaceAgent } from "#/api/typesGenerated";
import { i18n } from "#/i18n";
import {
	type DisplayWorkspaceStatusType,
	getDisplayWorkspaceStatus,
} from "#/utils/workspace";

const iconMap: Record<
	DisplayWorkspaceStatusType,
	FC<{ className?: string }>
> = {
	success: MonitorIcon,
	active: MonitorDotIcon,
	inactive: MonitorPauseIcon,
	error: MonitorXIcon,
	danger: MonitorXIcon,
	warning: MonitorXIcon,
};

export const StatusIcon: FC<{
	type: DisplayWorkspaceStatusType;
	className?: string;
}> = ({ type, className = "size-3" }) => {
	const Icon = iconMap[type];
	return <Icon className={className} />;
};

export function getWorkspaceStatus(
	workspace: Workspace,
	agent?: WorkspaceAgent | null,
): { effectiveType: DisplayWorkspaceStatusType; statusLabel: string } {
	let { type, text } = getDisplayWorkspaceStatus(
		workspace.latest_build.status,
		workspace.latest_build.job,
	);

	const agentPreparing =
		workspace.latest_build.status === "running" &&
		(agent?.lifecycle_state === "created" ||
			agent?.lifecycle_state === "starting");
	const agentStartupFailed =
		workspace.latest_build.status === "running" &&
		(agent?.lifecycle_state === "start_error" ||
			agent?.lifecycle_state === "start_timeout");
	if (agentPreparing) {
		type = "active";
		text = "Preparing";
	} else if (agentStartupFailed) {
		type = "warning";
		text = "Startup failed";
	}

	const effectiveType = workspace.health.healthy ? type : "warning";
	const statusLabel = workspace.health.healthy
		? i18n.t(
				"agents:AgentsPage.components.StatusIcon.workspace_value0_1a86d83e",
				{
					value0: text.toLowerCase(),
				},
			)
		: i18n.t(
				"agents:AgentsPage.components.StatusIcon.workspace_value0_unhealthy_ddea792f",
				{
					value0: text.toLowerCase(),
				},
			);
	return { effectiveType, statusLabel };
}
