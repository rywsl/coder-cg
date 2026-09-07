import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverLink,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
} from "#/components/HelpPopover/HelpPopover";
import { docs } from "#/utils/docs";

export const WorkspaceHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n(
						"WorkspacesPage.WorkspaceHelpPopover.what_is_a_workspace_140e3cae",
					)}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"WorkspacesPage.WorkspaceHelpPopover.a_workspace_is_your_development_environment_in_t_b4e28a02",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/user-guides")}>
						{tI18n(
							"WorkspacesPage.WorkspaceHelpPopover.create_workspaces_ca9fcf97",
						)}
					</HelpPopoverLink>
					<HelpPopoverLink href={docs("/user-guides/workspace-access")}>
						{tI18n(
							"WorkspacesPage.WorkspaceHelpPopover.connect_with_ssh_97beca79",
						)}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
