import { cn } from "cn";
import { saveAs } from "file-saver";
import { ChevronDownIcon, DownloadIcon } from "lucide-react";
import { type FC, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { chatDebugRun } from "#/api/queries/chats";
import type { ChatDebugRunSummary } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { Spinner } from "#/components/Spinner/Spinner";
import { DebugStepCard } from "./DebugStepCard";
import {
	buildDebugExportBlob,
	buildRunDebugExport,
	type DownloadDebugFile,
	debugExportFilename,
} from "./debugExport";
import {
	clampContent,
	coerceRunSummary,
	compactDuration,
	computeDurationMs,
	formatTokenSummary,
	getRunKindLabel,
	getStatusBadgeVariant,
	isActiveStatus,
} from "./debugPanelUtils";

interface DebugRunCardProps {
	run: ChatDebugRunSummary;
	chatId: string;
	isVisible: boolean;
	download?: DownloadDebugFile;
}

// Max characters shown in the run header label before truncation.
const RUN_LABEL_CLAMP_CHARS = 80;

const getDurationLabel = (startedAt: string, finishedAt?: string): string => {
	const durationMs = computeDurationMs(startedAt, finishedAt);
	return durationMs !== null ? compactDuration(durationMs) : "-";
};

const getMCPOutcomeBadgeVariant = (outcome: string) => {
	switch (outcome) {
		case "connected":
			return "green";
		case "no_tools":
			return "default";
		default:
			return "destructive";
	}
};

export const DebugRunCard: FC<DebugRunCardProps> = ({
	run,
	chatId,
	isVisible,
	download = saveAs,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const [isExpanded, setIsExpanded] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const mcpConnectHeadingId = useId();
	const runDetailQuery = useQuery({
		...chatDebugRun(chatId, run.id),
		enabled: isVisible && isExpanded,
	});

	const steps = runDetailQuery.data?.steps ?? [];

	// Coerce summary from detail (preferred) → props → empty.
	const summaryVm = coerceRunSummary(
		runDetailQuery.data?.summary ?? run.summary,
	);
	const modelLabel = summaryVm.model?.trim() || run.model?.trim() || "";

	// Primary label fallback chain: firstMessage → kind.
	const primaryLabel = clampContent(
		summaryVm.primaryLabel.trim() || getRunKindLabel(run.kind),
		RUN_LABEL_CLAMP_CHARS,
	);

	// Token summary for the header.
	const tokenLabel = formatTokenSummary(
		summaryVm.totalInputTokens,
		summaryVm.totalOutputTokens,
	);

	// Step count from detail or summary.
	const stepCount = steps.length > 0 ? steps.length : summaryVm.stepCount;
	const durationLabel = getDurationLabel(run.started_at, run.finished_at);
	// Non-chat-turn runs (title generation, quickgen, compaction)
	// usually carry a first_message label that hides the kind, so
	// surface the kind in the metadata; otherwise a failed title
	// generation is indistinguishable from a failed chat turn.
	const kindLabel =
		run.kind !== "chat_turn" && summaryVm.primaryLabel.trim()
			? getRunKindLabel(run.kind)
			: undefined;
	const metadataItems = [
		kindLabel,
		modelLabel || undefined,
		stepCount !== undefined && stepCount > 0
			? `${stepCount} ${stepCount === 1 ? "step" : "steps"}`
			: undefined,
		durationLabel,
		tokenLabel || undefined,
	].filter((item) => item !== undefined);
	// Prefer the detail query's status while the card is expanded so
	// the badge and spinner flip to the final state as soon as the
	// detail refetch observes the transition, rather than waiting for
	// the list query to catch up on its own polling cycle. When the
	// card is collapsed the detail query is disabled, so any cached
	// `runDetailQuery.data` is stale; fall back to `run.status` from
	// the list query in that case.
	const effectiveStatus = isExpanded
		? (runDetailQuery.data?.status ?? run.status)
		: run.status;
	const running = isActiveStatus(effectiveStatus);

	const exportDebugRun = async () => {
		if (!runDetailQuery.data) {
			return;
		}
		try {
			const exportedAt = new Date();
			const payload = buildRunDebugExport(
				chatId,
				runDetailQuery.data,
				exportedAt,
			);
			await download(
				buildDebugExportBlob(payload),
				debugExportFilename({
					chatId,
					runId: run.id,
					exportedAt,
				}),
			);
		} catch (error) {
			console.error(error);
			toast.error(
				tI18n(
					"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.failed_to_export_debug_run_eb306b22",
				),
				{
					description: getErrorDetail(error),
				},
			);
		}
	};

	return (
		<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
			<div className="overflow-hidden rounded-lg border border-solid border-border-default/40">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="group flex w-full items-center gap-2 border-0 bg-transparent px-3 py-0.5 text-left transition-colors hover:bg-surface-secondary/20"
					>
						<div className="min-w-0 flex flex-1 items-center gap-2.5 overflow-hidden">
							<p className="min-w-0 flex-1 truncate text-sm font-semibold text-content-primary">
								{primaryLabel}
							</p>
							<div className="flex shrink-0 items-center gap-2 text-xs leading-5 text-content-secondary">
								{metadataItems.map((item, index) => (
									<span
										key={`${item}-${index}`}
										className="shrink-0 whitespace-nowrap"
									>
										{item}
									</span>
								))}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							{running ? <Spinner size="sm" loading /> : null}
							<Badge
								size="sm"
								variant={getStatusBadgeVariant(effectiveStatus)}
								className="shrink-0"
							>
								{effectiveStatus ||
									tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.unknown_b23a6a84",
									)}
							</Badge>
							<ChevronDownIcon
								className={cn(
									"size-4 shrink-0 text-content-secondary transition-transform",
									"group-data-[state=open]:rotate-180",
								)}
							/>
						</div>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent className="px-3 pb-3 pt-1">
					{runDetailQuery.isLoading ? (
						<div className="flex items-center gap-2 text-sm text-content-secondary">
							<Spinner size="sm" loading />
							{tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.loading_run_details_e4e81257",
							)}
						</div>
					) : runDetailQuery.isError && !runDetailQuery.data ? (
						<Alert severity="error" prominent>
							<p className="text-sm text-content-primary">
								{getErrorMessage(
									runDetailQuery.error,
									tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.unable_to_load_debug_run_details_056d26d4",
									),
								)}
							</p>
						</Alert>
					) : (
						<div className="space-y-2">
							{runDetailQuery.isError ? (
								<Alert severity="warning">
									<p className="text-sm text-content-primary">
										{getErrorMessage(
											runDetailQuery.error,
											tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.unable_to_refresh_debug_run_details_showing_cach_71ee2d49",
											),
										)}
									</p>
								</Alert>
							) : null}
							{summaryVm.mcpConnect.length > 0 ? (
								<section
									aria-labelledby={mcpConnectHeadingId}
									className="rounded-md border border-solid border-border-default/40 px-2.5 py-1.5"
								>
									<h4
										id={mcpConnectHeadingId}
										className="m-0 text-xs font-medium text-content-secondary"
									>
										{tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.mcp_server_connections_1d980e0c",
										)}
									</h4>
									<ul className="m-0 list-none space-y-1 p-0 pt-1.5">
										{summaryVm.mcpConnect.map((server, index) => (
											<li
												key={`${server.slug}-${index}`}
												className="flex min-w-0 items-center gap-2 text-xs"
											>
												<span className="shrink-0 font-medium text-content-primary">
													{server.slug}
												</span>
												<Badge
													size="sm"
													variant={getMCPOutcomeBadgeVariant(server.outcome)}
													className="shrink-0"
												>
													{server.outcome}
												</Badge>
												{server.durationMs !== undefined ? (
													<span className="shrink-0 text-content-secondary">
														{compactDuration(server.durationMs)}
													</span>
												) : null}
												{server.toolCount !== undefined &&
												server.toolCount > 0 ? (
													<span className="shrink-0 text-content-secondary">
														{server.toolCount}{" "}
														{server.toolCount === 1
															? tI18n(
																	"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.tool_7c9bbe5e",
																)
															: tI18n(
																	"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.tools_f9d35d43",
																)}
													</span>
												) : null}
												{server.error ? (
													<span
														className="min-w-0 truncate text-content-secondary"
														title={server.error}
													>
														{server.error}
													</span>
												) : null}
											</li>
										))}
									</ul>
									{summaryVm.mcpConnectDropped > 0 ? (
										<p className="m-0 pt-1.5 text-xs text-content-secondary">
											{summaryVm.mcpConnectDropped}
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.earlier_connection_b1932b7f",
											)}{" "}
											{summaryVm.mcpConnectDropped === 1
												? tI18n(
														"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.sample_af2bdbe1",
													)
												: tI18n(
														"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.samples_24baa7a7",
													)}{" "}
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.omitted_f34912a1",
											)}
										</p>
									) : null}
								</section>
							) : null}
							{steps.map((step) => (
								<DebugStepCard key={step.id} step={step} defaultOpen={false} />
							))}
							{steps.length === 0 ? (
								<p className="text-sm text-content-secondary">
									{tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.no_steps_recorded_1d94e72e",
									)}
								</p>
							) : null}
							{runDetailQuery.data ? (
								<div className="flex justify-end pt-1">
									<Button
										variant="outline"
										size="sm"
										disabled={isExporting}
										onClick={() => {
											setIsExporting(true);
											void exportDebugRun().finally(() =>
												setIsExporting(false),
											);
										}}
									>
										{isExporting ? (
											<Spinner size="sm" loading />
										) : (
											<DownloadIcon className="size-4" />
										)}
										{tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugRunCard.export_this_run_810490d3",
										)}
									</Button>
								</div>
							) : null}
						</div>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
};
