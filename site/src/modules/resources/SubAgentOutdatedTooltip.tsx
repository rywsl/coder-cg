import { RotateCcwIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	WorkspaceAgent,
	WorkspaceAgentDevcontainer,
} from "#/api/typesGenerated";
import {
	HelpPopover,
	HelpPopoverAction,
	HelpPopoverContent,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
	HelpPopoverTrigger,
} from "#/components/HelpPopover/HelpPopover";

type SubAgentOutdatedTooltipProps = {
	devcontainer: WorkspaceAgentDevcontainer;
	agent: WorkspaceAgent;
	onUpdate: () => void;
};

export const SubAgentOutdatedTooltip: FC<SubAgentOutdatedTooltipProps> = ({
	devcontainer,
	agent,
	onUpdate,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	if (!devcontainer.agent || devcontainer.agent.id !== agent.id) {
		return null;
	}
	if (!devcontainer.dirty) {
		return null;
	}

	return (
		<HelpPopover>
			<HelpPopoverTrigger className="px-0 py-1 bg-transparent text-inherit border-none opacity-50 hover:opacity-100">
				<span role="status" className="cursor-pointer">
					{tI18n("resources.SubAgentOutdatedTooltip.outdated_c759f42e")}
				</span>
			</HelpPopoverTrigger>
			<HelpPopoverContent>
				<div className="flex flex-col gap-2">
					<div>
						<HelpPopoverTitle>
							{tI18n(
								"resources.SubAgentOutdatedTooltip.dev_container_outdated_9b22108e",
							)}
						</HelpPopoverTitle>
						<HelpPopoverText>
							{tI18n(
								"resources.SubAgentOutdatedTooltip.this_dev_container_is_outdated_this_can_happen_i_982e2de3",
							)}
						</HelpPopoverText>
					</div>

					<HelpPopoverLinksGroup>
						<HelpPopoverAction
							icon={RotateCcwIcon}
							onClick={onUpdate}
							ariaLabel={tI18n(
								"resources.SubAgentOutdatedTooltip.rebuild_dev_container_1d25dd70",
							)}
						>
							{tI18n(
								"resources.SubAgentOutdatedTooltip.rebuild_dev_container_1d25dd70",
							)}
						</HelpPopoverAction>
					</HelpPopoverLinksGroup>
				</div>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
