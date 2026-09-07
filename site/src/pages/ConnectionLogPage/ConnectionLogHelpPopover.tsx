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

export const ConnectionLogHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n(
						"ConnectionLogPage.ConnectionLogHelpPopover.why_are_some_events_missing_72fe9b21",
					)}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"ConnectionLogPage.ConnectionLogHelpPopover.the_connection_log_is_a_best_effort_log_of_works_1c074b73",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/admin/monitoring/connection-logs")}>
						{tI18n(
							"ConnectionLogPage.ConnectionLogHelpPopover.connection_log_documentation_5464f12a",
						)}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
