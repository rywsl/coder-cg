import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { Link } from "#/components/Link/Link";
import { docs } from "#/utils/docs";

const concurrencyDocsUrl = docs(
	"/ai-coder/agents/platform-controls#concurrent-agents",
);

interface QueuedForCapacityCalloutProps {
	hasLicense: boolean;
	canManageLicenses: boolean;
	agentHoursHardLimit?: number;
}

export const QueuedForCapacityCallout: FC<QueuedForCapacityCalloutProps> = ({
	hasLicense,
	canManageLicenses,
	agentHoursHardLimit,
}) => {
	const { t: tI18n } = useTranslation("agents");

	let limitMessage = tI18n(
		"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.your_team_has_reached_the_community_license_limi_40a9872b",
	);
	if (hasLicense) {
		limitMessage = tI18n(
			"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.your_team_has_reached_your_license_s_limit_for_a_23e21dd7",
		);
	}
	if (agentHoursHardLimit !== undefined) {
		limitMessage = tI18n(
			"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.your_team_has_reached_the_value0_hour_agent_hour_920bc5a9",
			{
				value0: agentHoursHardLimit,
			},
		);
	}

	let action: ReactNode = (
		<>
			<Link href={concurrencyDocsUrl} target="_blank" rel="noreferrer">
				{tI18n(
					"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.learn_more_1445799c",
				)}
			</Link>
			.
		</>
	);
	if (canManageLicenses && hasLicense) {
		action = (
			<>
				{tI18n(
					"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.contact_your_coder_account_team_or_da9222ce",
				)}{" "}
				<Link href="mailto:sales@coder.com" showExternalIcon={false}>
					{tI18n(
						"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.sales_coder_com_71dc2de6",
					)}
				</Link>{" "}
				{tI18n(
					"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.to_upgrade_to_unlimited_concurrent_agents_dc6b8bfa",
				)}
			</>
		);
	} else if (canManageLicenses) {
		action = (
			<>
				<Link asChild showExternalIcon={false}>
					<RouterLink to="/deployment/premium">
						{tI18n(
							"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.start_an_unlimited_trial_158900fc",
						)}
					</RouterLink>
				</Link>{" "}
				{tI18n(
					"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.or_7175517a",
				)}{" "}
				<Link href={concurrencyDocsUrl} target="_blank" rel="noreferrer">
					{tI18n(
						"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.learn_more_d20312bc",
					)}
				</Link>
				.
			</>
		);
	}

	return (
		<Alert severity="warning" className="mt-2">
			<AlertDescription>
				{limitMessage}
				{tI18n(
					"AgentsPage.components.ChatConversation.QueuedForCapacityCallout.this_agent_is_queued_and_will_start_automaticall_94ff3462",
				)}
				{action}
			</AlertDescription>
		</Alert>
	);
};
