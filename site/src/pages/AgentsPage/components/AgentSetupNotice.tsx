import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { docs } from "#/utils/docs";

interface AgentSetupNoticeProps {
	isAdmin: boolean;
	providerCount: number;
	modelCount: number;
	// Names of configured providers the harness cannot use, populated by
	// the page only when no supported provider is configured.
	unsupportedProviderNames?: readonly string[];
	aiGatewayDisabled?: boolean;
}

const formatProviderList = (names: readonly string[]): string => {
	if (names.length === 1) {
		return names[0];
	}
	if (names.length === 2) {
		return `${names[0]} and ${names[1]}`;
	}
	return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};

export const AgentSetupNotice: FC<AgentSetupNoticeProps> = ({
	isAdmin,
	providerCount,
	modelCount,
	unsupportedProviderNames = [],
	aiGatewayDisabled,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const hasProvider = providerCount > 0;
	const hasModel = modelCount > 0;
	const hasUnsupportedProviderNames = unsupportedProviderNames.length > 0;

	// AI Gateway can be disabled even when providers/models exist in the DB
	// catalog, so check it before the provider/model counts below. Unlike
	// the provider/model branches, there is no in-app settings page for
	// this deployment-level flag for any audience, so the message doesn't
	// vary by isAdmin.
	if (aiGatewayDisabled) {
		return (
			<NoticeContainer>
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.ai_gateway_is_disabled_enable_it_in_your_deploym_a01a236f",
				)}
			</NoticeContainer>
		);
	}

	if (hasProvider && hasModel) {
		return null;
	}

	// Configured providers exist but none are supported by Coder Agents
	// (e.g. GitHub Copilot). Say so rather than asking to set up a provider.
	if (hasUnsupportedProviderNames) {
		const providerList = formatProviderList(unsupportedProviderNames);
		const unsupportedLink = (
			<a
				href={docs("/ai-coder/agents/models#providers")}
				target="_blank"
				rel="noreferrer"
				className="text-content-link transition-colors hover:text-content-link/80"
			>
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.not_supported_by_coder_agents_f8c4b18d",
				)}
			</a>
		);
		if (!isAdmin) {
			return (
				<NoticeContainer>
					{providerList}{" "}
					{unsupportedProviderNames.length === 1
						? tI18n("AgentsPage.components.AgentSetupNotice.is_fa51fd49")
						: tI18n("AgentsPage.components.AgentSetupNotice.are_ba78973d")}{" "}
					{tI18n(
						"AgentsPage.components.AgentSetupNotice.configured_but_4cc53a86",
					)}
					{unsupportedLink}
					{tI18n(
						"AgentsPage.components.AgentSetupNotice.ask_your_admin_to_add_a_supported_provider_ffd1eec1",
					)}
				</NoticeContainer>
			);
		}
		return (
			<NoticeContainer>
				{providerList}{" "}
				{unsupportedProviderNames.length === 1
					? tI18n("AgentsPage.components.AgentSetupNotice.is_fa51fd49")
					: tI18n("AgentsPage.components.AgentSetupNotice.are_ba78973d")}{" "}
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.configured_but_4cc53a86",
				)}
				{unsupportedLink}
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.add_a_supported_16133691",
				)}{" "}
				<Link
					to="/ai/settings/providers"
					className="text-content-link transition-colors hover:text-content-link/80"
				>
					{tI18n("AgentsPage.components.AgentSetupNotice.provider_5c4c1964")}
				</Link>{" "}
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.to_chat_with_coder_agents_7c8618e8",
				)}
			</NoticeContainer>
		);
	}

	// Non-admin member: show a generic message
	if (!isAdmin) {
		return (
			<NoticeContainer>
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.ai_models_aren_t_available_yet_your_admin_is_sti_34004c34",
				)}
			</NoticeContainer>
		);
	}

	// Admin: missing provider (with or without models)
	if (!hasProvider) {
		return (
			<NoticeContainer>
				{tI18n(
					"AgentsPage.components.AgentSetupNotice.to_chat_with_coder_agents_set_up_a_01b643be",
				)}{" "}
				<Link
					to="/ai/settings/providers"
					className="text-content-link transition-colors hover:text-content-link/80"
				>
					{tI18n("AgentsPage.components.AgentSetupNotice.provider_5c4c1964")}
				</Link>
				{!hasModel && (
					<>
						{" "}
						{tI18n(
							"AgentsPage.components.AgentSetupNotice.then_add_a_6a026f52",
						)}{" "}
						<Link
							to="/ai/settings/models"
							className="text-content-link transition-colors hover:text-content-link/80"
						>
							{tI18n("AgentsPage.components.AgentSetupNotice.model_9372c470")}
						</Link>
					</>
				)}
				.
			</NoticeContainer>
		);
	}

	// Admin: has providers but no models
	return (
		<NoticeContainer>
			{tI18n(
				"AgentsPage.components.AgentSetupNotice.to_chat_with_coder_agents_set_up_a_01b643be",
			)}{" "}
			<Link
				to="/ai/settings/models"
				className="text-content-link transition-colors hover:text-content-link/80"
			>
				{tI18n("AgentsPage.components.AgentSetupNotice.model_9372c470")}
			</Link>
			.
		</NoticeContainer>
	);
};

const NoticeContainer: FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<div className="rounded-2xl bg-surface-tertiary px-4 pb-14 pt-2.5 text-[13px] text-content-primary">
			{children}
		</div>
	);
};
