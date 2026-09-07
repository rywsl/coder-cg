import { useTranslation } from "react-i18next";
import { PaywallSmall } from "#/components/Paywall/PaywallSmall";
import { i18n } from "#/i18n";
import type { PaywallProps } from "./Paywall";

type PaywallAIGovernanceVariant = "governance" | "sessions";

const PAYWALL_AIGOVERNANCE_COPY: Record<
	PaywallAIGovernanceVariant,
	{ description: string; features: string[] }
> = {
	governance: {
		description: i18n.t(
			"components:Paywall.PaywallAIGovernance.get_a_full_audit_trail_of_every_prompt_tool_call_caa5356c",
		),
		features: [
			"Centralized auth, no scattered API keys",
			"Approve MCP servers & tools org-wide",
			"Per-user token spend & usage tracking",
		],
	},
	sessions: {
		description: i18n.t(
			"components:Paywall.PaywallAIGovernance.trace_every_ai_coding_session_step_by_step_to_se_c9d80183",
		),
		features: [
			"Full session & thread-level detail",
			"Attribute every action to a user",
			"Filter by user, project, or date",
		],
	},
};

type PaywallAIGovernanceProps = Pick<PaywallProps, "onCTAClick"> & {
	variant?: PaywallAIGovernanceVariant;
};

const PaywallAIGovernance = ({
	variant = "governance",
	onCTAClick,
}: PaywallAIGovernanceProps) => {
	const { t: tI18n } = useTranslation("components");

	const { description, features } = PAYWALL_AIGOVERNANCE_COPY[variant];

	return (
		<PaywallSmall
			message={tI18n("Paywall.PaywallAIGovernance.ai_gateway_47219de2")}
			canViewPremium
			description={description}
			features={features}
			onCTAClick={onCTAClick}
		/>
	);
};

export { PaywallAIGovernance };
