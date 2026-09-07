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

export const AuditHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n("AuditPage.AuditHelpPopover.what_is_an_audit_log_8658a1a2")}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"AuditPage.AuditHelpPopover.an_audit_log_is_a_record_of_events_and_changes_m_3ef70f91",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/admin/security/audit-logs")}>
						{tI18n("AuditPage.AuditHelpPopover.events_we_track_72404306")}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
