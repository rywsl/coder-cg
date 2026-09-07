import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { formatCostMicros } from "#/utils/currency";
import { DATE_FORMAT, formatDateTime } from "#/utils/time";

const EMPTY_VALUE = "-";

interface ChatSummaryProps {
	summary: string | null;
	createdAt: string;
	updatedAt: string;
	/** Cost of the whole chat tree in microdollars (1 USD = 1,000,000). */
	costMicros?: number | null;
	isCostLoading?: boolean;
	costError?: boolean;
	/** Requests with usage the gateway could not price, so the reported cost is partial. */
	unpricedRequestCount?: number;
	showCost: boolean;
	/** Subagent summaries are the agent's final report, persisted when it completes, so the empty state reads as pending rather than absent. */
	isSubagent?: boolean;
}

export const ChatSummary: FC<ChatSummaryProps> = ({
	summary,
	createdAt,
	updatedAt,
	costMicros,
	isCostLoading,
	costError,
	unpricedRequestCount,
	showCost,
	isSubagent,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const trimmedSummary = summary?.trim();
	const hasCost =
		showCost && !isCostLoading && !costError && costMicros != null;
	const hasUnpricedRequests =
		hasCost && unpricedRequestCount != null && unpricedRequestCount > 0;

	return (
		<div className="flex flex-col gap-4">
			{trimmedSummary ? (
				<p className="m-0 font-sans text-pretty text-sm font-normal leading-6 text-content-primary">
					{trimmedSummary}
				</p>
			) : (
				<p className="m-0 font-sans text-sm font-normal leading-6 text-content-secondary">
					{isSubagent
						? tI18n(
								"AgentsPage.components.ChatSummary.summary_pending_agent_completion_0ac51777",
							)
						: tI18n(
								"AgentsPage.components.ChatSummary.no_summary_yet_95909797",
							)}
				</p>
			)}
			<dl className="m-0 flex flex-col gap-1.5">
				<ChatSummaryRow
					label={tI18n("AgentsPage.components.ChatSummary.created_22d435a3")}
				>
					{formatDateTime(createdAt, DATE_FORMAT.MEDIUM_DATE)}
				</ChatSummaryRow>
				<ChatSummaryRow
					label={tI18n("AgentsPage.components.ChatSummary.updated_29d0051d")}
				>
					{formatDateTime(updatedAt, DATE_FORMAT.MEDIUM_DATE)}
				</ChatSummaryRow>
				{showCost && (
					<ChatSummaryRow
						label={tI18n("AgentsPage.components.ChatSummary.cost_97c94eff")}
					>
						{isCostLoading ? (
							<Skeleton
								aria-label={tI18n(
									"AgentsPage.components.ChatSummary.loading_cost_98ca5ad6",
								)}
								className="my-1 h-4 w-16"
							/>
						) : costError ? (
							<span className="text-content-secondary">
								{tI18n(
									"AgentsPage.components.ChatSummary.unavailable_ca184496",
								)}
							</span>
						) : costMicros != null ? (
							formatCostMicros(costMicros)
						) : (
							EMPTY_VALUE
						)}
					</ChatSummaryRow>
				)}
			</dl>
			{isSubagent && hasCost && (
				<p className="m-0 text-xs italic text-content-secondary">
					{tI18n(
						"AgentsPage.components.ChatSummary.cost_covers_this_agent_s_whole_chat_including_th_e35ff904",
					)}
				</p>
			)}
			{hasUnpricedRequests && (
				<p className="m-0 text-xs italic text-content-secondary">
					{tI18n(
						"AgentsPage.components.ChatSummary.excludes_unpriced_usage_from_8bc33937",
					)}
					{unpricedRequestCount}
					{tI18n("AgentsPage.components.ChatSummary.request_578bd76a")}
					{unpricedRequestCount === 1
						? ""
						: tI18n("AgentsPage.components.ChatSummary.s_043a7187")}
					.
				</p>
			)}
		</div>
	);
};

interface ChatSummaryRowProps {
	label: string;
	children: ReactNode;
}

const ChatSummaryRow: FC<ChatSummaryRowProps> = ({ label, children }) => (
	<div className="grid grid-cols-[65px_minmax(0,1fr)] gap-x-2 text-sm leading-6">
		<dt className="text-content-secondary">{label}</dt>
		<dd className="m-0 font-sans text-sm font-normal leading-6 text-content-primary">
			{children}
		</dd>
	</div>
);
