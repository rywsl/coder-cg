import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { Link } from "#/components/Link/Link";
import { docs } from "#/utils/docs";

const concurrencyDocsUrl = docs(
	"/ai-coder/agents/platform-controls#concurrent-agents",
);

interface QueuedForCapacityCalloutProps {
	agentHoursHardLimit?: number;
}

export const QueuedForCapacityCallout: FC<QueuedForCapacityCalloutProps> = ({
	agentHoursHardLimit,
}) => {
	const { t: tI18n } = useTranslation("agents");

	let limitMessage = tI18n(
		"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.all_available_agent_capacity_is_currently_in_use_de2b1fa5",
	);
	if (agentHoursHardLimit !== undefined) {
		limitMessage = tI18n(
			"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.your_team_has_reached_the_value0_hour_agent_hour_920bc5a9",
			{
				value0: agentHoursHardLimit,
			},
		);
	}

	return (
		<Alert severity="warning" className="mt-2">
			<AlertDescription>
				{limitMessage}
				{tI18n(
					"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.this_agent_is_queued_and_will_start_automaticall_94ff3462",
				)}
				<Link href={concurrencyDocsUrl} target="_blank" rel="noreferrer">
					{tI18n(
						"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.learn_more_1445799c",
					)}
				</Link>
				.
			</AlertDescription>
		</Alert>
	);
};
