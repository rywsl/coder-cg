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

export const AIBridgeHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n(
						"AIBridgePage.AIBridgeHelpPopover.what_is_ai_gateway_f25a1c17",
					)}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"AIBridgePage.AIBridgeHelpPopover.ai_gateway_is_a_smart_gateway_for_ai_that_provid_20e0afc6",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/ai-coder/ai-gateway")}>
						{tI18n("AIBridgePage.AIBridgeHelpPopover.read_the_docs_559b1cc4")}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
