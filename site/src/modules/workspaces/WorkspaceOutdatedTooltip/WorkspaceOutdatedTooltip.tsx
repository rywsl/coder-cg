import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { templateVersion } from "#/api/queries/templates";
import type { Workspace } from "#/api/typesGenerated";
import {
	HelpPopover,
	HelpPopoverAction,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
	HelpPopoverTrigger,
} from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import {
	useWorkspaceUpdate,
	WorkspaceUpdateDialogs,
} from "../WorkspaceUpdateDialogs";

interface WorkspaceOutdatedTooltipProps {
	workspace: Workspace;
	children?: ReactNode;
}

export const WorkspaceOutdatedTooltip: FC<WorkspaceOutdatedTooltipProps> = ({
	workspace,
	children,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [isOpen, setIsOpen] = useState(false);

	// Stop activation from bubbling to a parent `useClickableTableRow` row,
	// which navigates on click, Enter (onKeyDown), and Space (onKeyUp). Radix
	// composes its own click handler, so the popover still opens.
	const stopPropagation = (event: React.SyntheticEvent) => {
		event.stopPropagation();
	};

	return (
		<HelpPopover open={isOpen} onOpenChange={setIsOpen}>
			{children ? (
				<HelpPopoverTrigger asChild>
					<span
						className="flex items-center gap-1.5 cursor-help"
						onClick={stopPropagation}
						onKeyDown={stopPropagation}
						onKeyUp={stopPropagation}
					>
						<CircleAlertIcon className="text-content-secondary" size={14} />
						<span>{children}</span>
					</span>
				</HelpPopoverTrigger>
			) : (
				<HelpPopoverIconTrigger
					size="small"
					hoverEffect={false}
					onClick={stopPropagation}
					onKeyDown={stopPropagation}
					onKeyUp={stopPropagation}
				>
					<CircleAlertIcon className="text-content-secondary" />
					<span className="sr-only">
						{tI18n(
							"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.outdated_info_0740ff9f",
						)}
					</span>
				</HelpPopoverIconTrigger>
			)}
			<WorkspaceOutdatedTooltipContent isOpen={isOpen} workspace={workspace} />
		</HelpPopover>
	);
};

type TooltipContentProps = WorkspaceOutdatedTooltipProps & { isOpen: boolean };

const WorkspaceOutdatedTooltipContent: FC<TooltipContentProps> = ({
	workspace,
	isOpen,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const getLink = useLinks();
	const { data: activeVersion } = useQuery({
		...templateVersion(workspace.template_active_version_id),
		enabled: isOpen,
	});
	const updateWorkspace = useWorkspaceUpdate({
		workspace,
		latestVersion: activeVersion,
		onError: (error) => {
			toast.error(
				getErrorMessage(
					error,
					tI18n(
						"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.error_updating_workspace_value0_5d8f4fb2",
						{
							value0: workspace.name,
						},
					),
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	const versionLink = `${getLink(
		linkToTemplate(workspace.organization_name, workspace.template_name),
	)}`;

	return (
		<>
			<HelpPopoverContent disablePortal={false}>
				<HelpPopoverTitle>
					{tI18n(
						"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.outdated_c759f42e",
					)}
				</HelpPopoverTitle>
				<HelpPopoverText className="text-xs font-normal">
					{tI18n(
						"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.this_workspace_version_is_outdated_and_a_newer_v_e48d03ce",
					)}
				</HelpPopoverText>

				<div className="flex flex-col gap-2 py-2 text-xs font-normal">
					<div className="leading-[1.6]">
						<div className="text-content-primary text-sm font-semibold">
							{tI18n(
								"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.new_version_7246e01b",
							)}
						</div>
						<div>
							{activeVersion ? (
								<Link
									href={`${versionLink}/versions/${activeVersion.name}`}
									target="_blank"
									rel="noreferrer"
									size="sm"
									className="p-0"
									showExternalIcon={false}
								>
									{activeVersion.name}
								</Link>
							) : (
								<Skeleton variant="text" height={20} width={100} />
							)}
						</div>
					</div>

					<div className="leading-[1.6]">
						<div className="text-content-primary text-sm font-semibold">
							{tI18n(
								"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.message_2f77668a",
							)}
						</div>
						<div>
							{activeVersion ? (
								activeVersion.message ||
								tI18n(
									"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.no_message_f4e72a06",
								)
							) : (
								<Skeleton variant="text" height={20} width={150} />
							)}
						</div>
					</div>
				</div>

				<HelpPopoverLinksGroup>
					<HelpPopoverAction
						icon={RotateCcwIcon}
						onClick={updateWorkspace.update}
					>
						{tI18n(
							"workspaces.WorkspaceOutdatedTooltip.WorkspaceOutdatedTooltip.update_c1c1009d",
						)}
					</HelpPopoverAction>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
			<WorkspaceUpdateDialogs {...updateWorkspace.dialogProps} />
		</>
	);
};
