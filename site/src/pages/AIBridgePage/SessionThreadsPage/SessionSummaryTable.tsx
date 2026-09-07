import { BanIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
	AIBridgeSessionNetworkCallSummary,
	AIBridgeSessionNetworkDomain,
	MinimalUser,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Badge } from "#/components/Badge/Badge";
import { currentIntlLocale } from "#/i18n/locale";
import { AIBridgeClientIcon } from "#/pages/AIBridgePage/icons/AIBridgeClientIcon";
import { AIBridgeProviderIcon } from "#/pages/AIBridgePage/icons/AIBridgeProviderIcon";
import { formatDateTime } from "#/utils/time";
import {
	NetworkMonitoringDisabled,
	NetworkNoActivity,
} from "../NetworkRequestStates";
import { TokenBadges } from "../TokenBadges";
import { getProviderDisplayName } from "../utils";

const Separator = () => <div className="border-0 border-t border-solid my-1" />;

interface SessionSummaryTableProps {
	sessionId: string;
	startTime: Date;
	endTime?: Date;
	initiator: MinimalUser;
	client: string;
	providers: readonly string[];
	inputTokens: number;
	outputTokens: number;
	threadCount: number;
	toolCallCount: number;
	tokenUsageMetadata?: Record<string, unknown>;
	// networkCalls is undefined when the session did not pass through Agent
	// Firewall, which renders as "Disabled".
	networkCalls?: AIBridgeSessionNetworkCallSummary;
	// networkDomains is undefined when the session contacted no destination
	// hosts. totalCount is the number of distinct domains contacted, which
	// renders as a "+N more" overflow beyond topDomain.
	networkDomains?: {
		readonly topDomain: AIBridgeSessionNetworkDomain;
		readonly totalCount: number;
	};
}

export const SessionSummaryTable = ({
	sessionId,
	startTime,
	endTime,
	initiator,
	providers,
	client,
	inputTokens,
	outputTokens,
	threadCount,
	toolCallCount,
	tokenUsageMetadata,
	networkCalls,
	networkDomains,
}: SessionSummaryTableProps) => {
	const { t: tI18n } = useTranslation("agents");

	const durationInMs =
		endTime !== undefined
			? new Date(endTime).getTime() - new Date(startTime).getTime()
			: undefined;

	let networkCallsValue: ReactNode;
	if (networkCalls === undefined) {
		networkCallsValue = <NetworkMonitoringDisabled />;
	} else if (networkCalls.total === 0) {
		networkCallsValue = <NetworkNoActivity />;
	} else {
		networkCallsValue = (
			<Badge>{networkCalls.total.toLocaleString(currentIntlLocale())}</Badge>
		);
	}

	return (
		<dl className="text-sm text-content-secondary m-0 flex flex-col gap-y-2">
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.session_id_cb9ac5c5",
					)}
				</dt>
				<dd
					className="ml-4 min-w-0 truncate text-content-primary text-xs font-mono"
					title={sessionId}
				>
					{sessionId}
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.start_time_babe9dda",
					)}
				</dt>
				<dd
					className="ml-4 min-w-0 truncate text-content-primary text-xs font-mono"
					title={formatDateTime(startTime)}
				>
					{formatDateTime(startTime)}
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.end_time_2e46006a",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary text-xs font-mono">
					{endTime ? formatDateTime(endTime) : "—"}
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.duration_4fc52a3c",
					)}
				</dt>
				<dd
					className="ml-4 min-w-0 truncate text-content-primary text-xs font-mono"
					title={
						durationInMs !== undefined
							? tI18n(
									"AIBridgePage.SessionThreadsPage.SessionSummaryTable.value0_ms_55077da6",
									{
										value0: durationInMs,
									},
								)
							: undefined
					}
				>
					{durationInMs !== undefined
						? tI18n(
								"AIBridgePage.SessionThreadsPage.SessionSummaryTable.value0_s_5eed7d4d",
								{
									value0: Math.round(durationInMs / 1000),
								},
							)
						: "—"}
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.initiator_69d86af5",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary flex items-center gap-2">
					<Avatar
						size="sm"
						src={initiator.avatar_url}
						fallback={initiator.name}
					/>
					<span className="truncate min-w-0" title={initiator.name}>
						{initiator.name}
					</span>
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.client_0c77fe09",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary">
					<Badge className="gap-1.5 max-w-full min-w-0 overflow-hidden">
						<div className="shrink-0 flex items-center">
							<AIBridgeClientIcon client={client} className="size-icon-xs" />
						</div>
						<span
							className="truncate min-w-0 flex-1"
							title={
								client ??
								tI18n(
									"AIBridgePage.SessionThreadsPage.SessionSummaryTable.unknown_b764cdc0",
								)
							}
						>
							{client ??
								tI18n(
									"AIBridgePage.SessionThreadsPage.SessionSummaryTable.unknown_b764cdc0",
								)}
						</span>
					</Badge>
				</dd>
			</div>
			<div className="flex items-start justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap mt-1">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.provider_472590ae",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary flex flex-wrap gap-1">
					{providers.map((p) => (
						<Badge
							key={p}
							className="gap-1.5 max-w-full min-w-0 overflow-hidden"
						>
							<AIBridgeProviderIcon provider={p} className="size-icon-xs" />
							<span
								className="truncate min-w-0 flex-1"
								title={getProviderDisplayName(p)}
							>
								{getProviderDisplayName(p)}
							</span>
						</Badge>
					))}
				</dd>
			</div>
			<Separator />
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.in_out_tokens_6ffefed3",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary">
					<TokenBadges
						inputTokens={inputTokens}
						outputTokens={outputTokens}
						tokenUsageMetadata={tokenUsageMetadata}
					/>
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.threads_3e42e385",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary">
					<Badge>{threadCount}</Badge>
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.tool_calls_da5122dc",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary">
					<Badge>{toolCallCount}</Badge>
				</dd>
			</div>
			<Separator />
			<div className="flex items-center justify-between">
				<dt className="shrink-0 font-normal whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionSummaryTable.network_requests_49b8dd6b",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate text-content-primary">
					{networkCallsValue}
				</dd>
			</div>
			{networkCalls !== undefined && networkCalls.total > 0 && (
				<div className="flex items-center justify-between">
					<dt className="shrink-0 font-normal whitespace-nowrap">
						{tI18n(
							"AIBridgePage.SessionThreadsPage.SessionSummaryTable.blocked_network_requests_83676b93",
						)}
					</dt>
					<dd className="ml-4 min-w-0 truncate text-content-primary">
						{networkCalls.blocked > 0 ? (
							<Badge svgSize="xs" className="gap-1 text-content-warning">
								<BanIcon className="shrink-0" />
								{networkCalls.blocked.toLocaleString(currentIntlLocale())}
							</Badge>
						) : (
							<Badge>
								{networkCalls.blocked.toLocaleString(currentIntlLocale())}
							</Badge>
						)}
					</dd>
				</div>
			)}
			{networkDomains !== undefined && (
				<div className="flex items-start justify-between">
					<dt className="shrink-0 font-normal whitespace-nowrap mt-px">
						{tI18n(
							"AIBridgePage.SessionThreadsPage.SessionSummaryTable.top_domains_47336137",
						)}
					</dt>
					<dd className="ml-4 min-w-0 text-content-primary text-right">
						<div className="truncate" title={networkDomains.topDomain.domain}>
							{networkDomains.topDomain.domain}
						</div>
						{networkDomains.totalCount > 1 && (
							<div className="text-content-secondary text-xs">
								+
								{(networkDomains.totalCount - 1).toLocaleString(
									currentIntlLocale(),
								)}
								{tI18n(
									"AIBridgePage.SessionThreadsPage.SessionSummaryTable.more_226ba18b",
								)}
							</div>
						)}
					</dd>
				</div>
			)}
		</dl>
	);
};
