import type React from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import {
	StatusIndicator,
	StatusIndicatorDot,
	type StatusIndicatorProps,
} from "#/components/StatusIndicator/StatusIndicator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import {
	type DisplayWorkspaceStatusType,
	getDisplayWorkspaceStatus,
} from "#/utils/workspace";

export const variantByStatusType: Record<
	DisplayWorkspaceStatusType,
	StatusIndicatorProps["variant"]
> = {
	active: "pending",
	inactive: "inactive",
	success: "success",
	error: "failed",
	danger: "warning",
	warning: "warning",
};

type WorkspaceStatusIndicatorProps = {
	workspace: Workspace;
	children?: React.ReactNode;
};

export const WorkspaceStatusIndicator: FC<WorkspaceStatusIndicatorProps> = ({
	workspace,
	children,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	let { text, type } = getDisplayWorkspaceStatus(
		workspace.latest_build.status,
		workspace.latest_build.job,
	);

	if (!workspace.health.healthy) {
		type = "warning";
	}

	const statusIndicator = (
		<StatusIndicator variant={variantByStatusType[type]}>
			<StatusIndicatorDot />
			<span className="sr-only">
				{tI18n(
					"workspaces.WorkspaceStatusIndicator.WorkspaceStatusIndicator.workspace_status_7e474491",
				)}
			</span>{" "}
			{text}
			{children}
		</StatusIndicator>
	);

	if (workspace.health.healthy) {
		return statusIndicator;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<StatusIndicator variant={variantByStatusType[type]}>
					<StatusIndicatorDot />
					<span className="sr-only">
						{tI18n(
							"workspaces.WorkspaceStatusIndicator.WorkspaceStatusIndicator.workspace_status_7e474491",
						)}
					</span>{" "}
					{text}
					{children}
				</StatusIndicator>
			</TooltipTrigger>
			<TooltipContent>
				{tI18n(
					"workspaces.WorkspaceStatusIndicator.WorkspaceStatusIndicator.one_or_more_workspace_agents_need_attention_expa_95b5589b",
				)}
			</TooltipContent>
		</Tooltip>
	);
};
