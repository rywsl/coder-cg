import { RotateCcwIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceAgent } from "#/api/typesGenerated";
import {
	HelpPopover,
	HelpPopoverAction,
	HelpPopoverContent,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
	HelpPopoverTrigger,
} from "#/components/HelpPopover/HelpPopover";
import { agentVersionStatus } from "../../utils/workspace";

type AgentOutdatedTooltipProps = {
	agent: WorkspaceAgent;
	serverVersion: string;
	status: agentVersionStatus;
	onUpdate: () => void;
};

export const AgentOutdatedTooltip: FC<AgentOutdatedTooltipProps> = ({
	agent,
	serverVersion,
	status,
	onUpdate,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [isOpen, setIsOpen] = useState(false);

	const title =
		status === agentVersionStatus.Outdated
			? tI18n("resources.AgentOutdatedTooltip.agent_outdated_d83cd971")
			: tI18n("resources.AgentOutdatedTooltip.agent_deprecated_6f0745d6");
	const opener =
		status === agentVersionStatus.Outdated
			? "This agent is an older version than the Coder server."
			: "This agent is using a deprecated version of the API.";
	const text = `${opener} This can happen after you update Coder with running workspaces. To fix this, you can stop and start the workspace.`;

	return (
		<HelpPopover open={isOpen} onOpenChange={setIsOpen}>
			<HelpPopoverTrigger asChild>
				<span role="status" className="cursor-pointer">
					{status === agentVersionStatus.Outdated
						? tI18n("resources.AgentOutdatedTooltip.outdated_c759f42e")
						: tI18n("resources.AgentOutdatedTooltip.deprecated_6b2e8f83")}
				</span>
			</HelpPopoverTrigger>
			<HelpPopoverContent>
				<div className="flex flex-col gap-2">
					<div>
						<HelpPopoverTitle>{title}</HelpPopoverTitle>
						<HelpPopoverText>{text}</HelpPopoverText>
					</div>

					<div className="flex flex-col gap-1">
						<span className="font-semibold text-content-primary">
							{tI18n("resources.AgentOutdatedTooltip.agent_version_4ab6ac4a")}
						</span>
						<span>{agent.version}</span>
					</div>

					<div className="flex flex-col gap-1">
						<span className="font-semibold text-content-primary">
							{tI18n("resources.AgentOutdatedTooltip.server_version_3f34bb23")}
						</span>
						<span>{serverVersion}</span>
					</div>

					<HelpPopoverLinksGroup>
						<HelpPopoverAction
							icon={RotateCcwIcon}
							onClick={() => {
								onUpdate();
								setIsOpen(false);
							}}
							ariaLabel={tI18n(
								"resources.AgentOutdatedTooltip.update_workspace_397e1c3f",
							)}
						>
							{tI18n(
								"resources.AgentOutdatedTooltip.update_workspace_397e1c3f",
							)}
						</HelpPopoverAction>
					</HelpPopoverLinksGroup>
				</div>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
