import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import {
	DATE_FORMAT,
	formatDateTime,
	relativeTimeWithoutSuffix,
} from "#/utils/time";

type WorkspaceDormantBadgeProps = {
	workspace: Workspace;
};

export const WorkspaceDormantBadge: FC<WorkspaceDormantBadgeProps> = ({
	workspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return workspace.deleting_at ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge role="status" variant="destructive" size="xs">
					{tI18n(
						"workspaces.WorkspaceDormantBadge.WorkspaceDormantBadge.deletion_pending_a0542172",
					)}
				</Badge>
			</TooltipTrigger>
			<TooltipContent side="bottom" className="max-w-xs">
				{tI18n(
					"workspaces.WorkspaceDormantBadge.WorkspaceDormantBadge.this_workspace_has_not_been_used_for_ac55990c",
				)}{" "}
				{relativeTimeWithoutSuffix(workspace.last_used_at)}
				{tI18n(
					"workspaces.WorkspaceDormantBadge.WorkspaceDormantBadge.and_has_been_marked_dormant_it_is_scheduled_to_b_6364b391",
				)}{" "}
				{formatDateTime(workspace.deleting_at, DATE_FORMAT.FULL_DATETIME)}.
			</TooltipContent>
		</Tooltip>
	) : (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge role="status" variant="warning" size="xs">
					{tI18n(
						"workspaces.WorkspaceDormantBadge.WorkspaceDormantBadge.dormant_027d0e4c",
					)}
				</Badge>
			</TooltipTrigger>
			<TooltipContent side="bottom" className="max-w-xs">
				{tI18n(
					"workspaces.WorkspaceDormantBadge.WorkspaceDormantBadge.this_workspace_has_not_been_used_for_ac55990c",
				)}{" "}
				{relativeTimeWithoutSuffix(workspace.last_used_at)}
				{tI18n(
					"workspaces.WorkspaceDormantBadge.WorkspaceDormantBadge.and_has_been_marked_dormant_it_is_not_scheduled__ac8f6739",
				)}
			</TooltipContent>
		</Tooltip>
	);
};
