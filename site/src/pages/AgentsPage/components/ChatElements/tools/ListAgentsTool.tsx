import { ExternalLinkIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { safeBuildAgentChatPath } from "../../../utils/navigation";
import { ToolCall } from "./ToolCall";
import { asRecord, asString, type ToolStatus } from "./utils";

/**
 * Collapsed-by-default rendering for `list_agents` tool calls. Shows
 * "Listed N of M agents" with a chevron; expanding reveals the agent
 * list with links to each agent's chat.
 */
export const ListAgentsTool: React.FC<{
	agents: unknown[];
	total: number;
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
}> = ({ agents, total, status, isError, errorMessage }) => {
	const { t: tI18n } = useTranslation("agents");

	const location = useLocation();
	const hasContent = agents.length > 0;
	const isRunning = status === "running";

	const label = isRunning
		? tI18n(
				"AgentsPage.components.ChatElements.tools.ListAgentsTool.listing_agents_f94b70c2",
			)
		: hasContent
			? tI18n(
					"AgentsPage.components.ChatElements.tools.ListAgentsTool.listed_value0_of_value1_agents_f541c5c9",
					{
						value0: agents.length,
						value1: total,
					},
				)
			: tI18n(
					"AgentsPage.components.ChatElements.tools.ListAgentsTool.listed_0_agents_3257b770",
				);

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.ListAgentsTool.failed_to_list_agents_325b5838",
				)
			}
			hasContent={hasContent}
		>
			<ToolCall.Header iconName="list_agents" label={label} />
			<ToolCall.Content>
				<div className="mt-1.5">
					{agents.map((agent, index) => {
						const rec = asRecord(agent);
						if (!rec) {
							return null;
						}
						const title = asString(rec.title) || "untitled";
						const chatStatus = asString(rec.status) || "unknown";
						const type = asString(rec.type) || "general";
						const chatId = asString(rec.chat_id);
						const agentChatPath = chatId
							? safeBuildAgentChatPath({ chatId })
							: null;

						const row = (
							<span>
								{title} ({type}, {chatStatus})
							</span>
						);

						if (!agentChatPath) {
							return (
								<div key={index} className="text-[13px] text-content-secondary">
									{row}
								</div>
							);
						}

						return (
							<div key={chatId || index} className="flex items-center gap-1.5">
								<Link
									to={{
										pathname: agentChatPath,
										search: location.search,
									}}
									className="flex items-center gap-1.5 text-[13px] text-content-secondary opacity-50 transition-opacity hover:opacity-100"
								>
									{row}
									<ExternalLinkIcon className="size-3 shrink-0" />
								</Link>
							</div>
						);
					})}
				</div>
			</ToolCall.Content>
		</ToolCall.Root>
	);
};
