import { BanIcon, CheckIcon, ChevronRightIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
	AgentFirewallLog,
	AIBridgeSessionNetworkCallSummary,
} from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import { currentIntlLocale } from "#/i18n/locale";
import { formatDateTime } from "#/utils/time";

interface NetworkCallsTableProps {
	/**
	 * Drives the header count and blocked badge. Reflects the whole session, so
	 * its total can exceed the number of rows in `calls`, which is capped
	 * server-side.
	 */
	summary: AIBridgeSessionNetworkCallSummary;
	calls: readonly AgentFirewallLog[];
}

export const NetworkCallsTable: FC<NetworkCallsTableProps> = ({
	summary,
	calls,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<Collapsible defaultOpen className="border border-solid rounded-md">
			<div className="flex items-center justify-between gap-2 px-2 py-1">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="group flex items-center gap-4 p-1 bg-transparent border-none cursor-pointer text-sm font-normal text-content-secondary"
					>
						<ChevronRightIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
						<span>
							{tI18n(
								"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.network_calls_1f939110",
							)}
							{summary.total.toLocaleString(currentIntlLocale())})
						</span>
					</button>
				</CollapsibleTrigger>
				{summary.blocked > 0 && (
					<Badge svgSize="xs" className="gap-1 text-content-warning">
						<BanIcon className="shrink-0" />
						<span className="sr-only">
							{tI18n(
								"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.blocked_network_calls_701e81eb",
							)}
						</span>
						{summary.blocked.toLocaleString(currentIntlLocale())}
					</Badge>
				)}
			</div>
			<CollapsibleContent className="border-0 border-t border-solid">
				<NetworkCallsList summary={summary} calls={calls} />
			</CollapsibleContent>
		</Collapsible>
	);
};

const NetworkCallsList: FC<NetworkCallsTableProps> = ({ summary, calls }) => {
	const { t: tI18n } = useTranslation("agents");

	if (calls.length === 0) {
		return (
			<p className="m-0 px-4 py-3 text-sm font-normal text-content-secondary">
				{tI18n(
					"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.no_network_calls_were_recorded_for_this_session_492b47ef",
				)}
			</p>
		);
	}

	const hiddenCount = summary.total - calls.length;

	return (
		<>
			<ul className="m-0 p-0 list-none">
				{calls.map((call) => (
					<NetworkCallRow key={call.id} call={call} />
				))}
			</ul>
			{hiddenCount > 0 && (
				<p className="m-0 px-4 py-2 text-xs font-normal text-content-secondary border-0 border-t border-solid">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.showing_the_first_92eb9ae1",
					)}
					{calls.length.toLocaleString(currentIntlLocale())}
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.of_88eb5a7e",
					)}{" "}
					{summary.total.toLocaleString(currentIntlLocale())}
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.network_calls_38dd03f6",
					)}
				</p>
			)}
		</>
	);
};

interface NetworkCallRowProps {
	call: AgentFirewallLog;
}

const NetworkCallRow: FC<NetworkCallRowProps> = ({ call }) => {
	const { t: tI18n } = useTranslation("agents");

	const timestamp = formatDateTime(new Date(call.created_at));

	return (
		<li className="border-0 border-t border-solid first:border-t-0">
			<Collapsible>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="group flex items-center gap-3 w-full px-2 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-surface-secondary"
					>
						<ChevronRightIcon className="size-3.5 shrink-0 text-content-secondary transition-transform group-data-[state=open]:rotate-90" />
						{call.method && (
							<Badge size="sm" className="shrink-0 font-mono">
								{call.method}
							</Badge>
						)}
						<NetworkCallStatusBadge allowed={call.allowed} />
						<span
							className="flex-1 min-w-0 truncate font-mono text-xs text-content-primary"
							title={call.detail}
						>
							{call.detail ||
								tI18n(
									"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.n_a_e2f79e5b",
								)}
						</span>
						<span className="hidden md:flex items-center gap-2 shrink-0 text-sm font-normal text-content-secondary">
							{tI18n(
								"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.timestamp_115a2cc9",
							)}
							<span className="font-mono text-xs text-content-primary">
								{timestamp}
							</span>
						</span>
					</button>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<dl className="flex flex-col gap-2 m-0 px-9 pb-3 text-sm font-normal text-content-secondary">
						<NetworkCallDetailRow label="URL">
							<span
								className="min-w-0 truncate font-mono text-xs text-content-primary"
								title={call.detail}
							>
								{call.detail ||
									tI18n(
										"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.n_a_e2f79e5b",
									)}
							</span>
							{call.detail && (
								<CopyButton
									text={call.detail}
									label={tI18n(
										"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.copy_network_call_url_a565f2a5",
									)}
								/>
							)}
						</NetworkCallDetailRow>
						<NetworkCallDetailRow
							label={tI18n(
								"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.protocol_cf088334",
							)}
						>
							<span className="font-mono text-xs text-content-primary">
								{call.proto ||
									tI18n(
										"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.n_a_e2f79e5b",
									)}
							</span>
						</NetworkCallDetailRow>
						<NetworkCallDetailRow
							label={tI18n(
								"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.matched_rule_b1713e73",
							)}
						>
							<span
								className="min-w-0 truncate font-mono text-xs text-content-primary"
								title={call.matched_rule ?? undefined}
							>
								{call.matched_rule ??
									tI18n(
										"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.none_dc937b59",
									)}
							</span>
						</NetworkCallDetailRow>
						<NetworkCallDetailRow
							label={tI18n(
								"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.timestamp_115a2cc9",
							)}
						>
							<span className="font-mono text-xs text-content-primary">
								{timestamp}
							</span>
						</NetworkCallDetailRow>
					</dl>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
};

const NetworkCallStatusBadge: FC<{ allowed: boolean }> = ({ allowed }) => {
	const { t: tI18n } = useTranslation("agents");

	return allowed ? (
		<Badge size="sm" svgSize="xs" className="shrink-0 gap-1">
			<CheckIcon className="shrink-0" />
			{tI18n(
				"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.allowed_1bb201d1",
			)}
		</Badge>
	) : (
		<Badge
			size="sm"
			svgSize="xs"
			className="shrink-0 gap-1 text-content-warning"
		>
			<BanIcon className="shrink-0" />
			{tI18n(
				"AIBridgePage.SessionThreadsPage.SessionTimeline.NetworkCallsTable.blocked_18f2a094",
			)}
		</Badge>
	);
};

interface NetworkCallDetailRowProps {
	label: string;
	children: ReactNode;
}

const NetworkCallDetailRow: FC<NetworkCallDetailRowProps> = ({
	label,
	children,
}) => (
	<div className="flex items-center justify-between gap-4">
		<dt className="shrink-0 whitespace-nowrap">{label}</dt>
		<dd className="flex items-center gap-2 m-0 min-w-0">{children}</dd>
	</div>
);
