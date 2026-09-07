import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { i18n } from "#/i18n";
import { DATE_FORMAT, formatDateTime, humanDuration } from "#/utils/time";
import {
	CopyableCodeBlock,
	DebugDataSection,
	EmptyHelper,
} from "./DebugPanelPrimitives";
import {
	computeDurationMs,
	getStatusBadgeVariant,
	type NormalizedAttempt,
	safeJsonStringify,
} from "./debugPanelUtils";

interface DebugAttemptAccordionProps {
	attempts: NormalizedAttempt[];
	rawFallback?: string;
}

interface JsonBlockProps {
	value: unknown;
	emptyMessage: string;
	copyLabel: string;
}

const JsonBlock: FC<JsonBlockProps> = ({ value, emptyMessage, copyLabel }) => {
	if (
		value === null ||
		value === undefined ||
		(typeof value === "string" && value.length === 0) ||
		(typeof value === "object" && Object.keys(value as object).length === 0)
	) {
		return <EmptyHelper message={emptyMessage} />;
	}

	const code = safeJsonStringify(value);

	return <CopyableCodeBlock code={code} label={copyLabel} />;
};

const getAttemptTimingLabel = (attempt: NormalizedAttempt): string => {
	const startedLabel = attempt.started_at
		? formatDateTime(attempt.started_at, DATE_FORMAT.TIME_24H)
		: "-";
	const finishedLabel = attempt.finished_at
		? formatDateTime(attempt.finished_at, DATE_FORMAT.TIME_24H)
		: i18n.t(
				"agents:AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.in_progress_2b6b853c",
			);

	const durationMs =
		attempt.duration_ms ??
		(attempt.started_at
			? computeDurationMs(attempt.started_at, attempt.finished_at)
			: null);
	const durationLabel =
		durationMs !== null
			? humanDuration(durationMs)
			: i18n.t(
					"agents:AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.duration_unavailable_dc621364",
				);

	return `${startedLabel} → ${finishedLabel} • ${durationLabel}`;
};

export const DebugAttemptAccordion: FC<DebugAttemptAccordionProps> = ({
	attempts,
	rawFallback,
}) => {
	const { t: tI18n } = useTranslation("agents");

	if (rawFallback) {
		// No DebugDataSection wrapper here. The parent already
		// wraps us in <DebugDataSection title="Raw attempts">.
		return (
			<div className="flex flex-col gap-1.5">
				<p className="text-xs text-content-secondary">
					{tI18n(
						"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.unable_to_parse_raw_attempts_showing_the_origina_e7a6e218",
					)}
				</p>
				<CopyableCodeBlock
					code={rawFallback}
					label={tI18n(
						"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.copy_raw_attempts_49ce7a17",
					)}
				/>
			</div>
		);
	}

	if (attempts.length === 0) {
		return (
			<p className="text-sm text-content-secondary">
				{tI18n(
					"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.no_attempts_captured_3718e1a0",
				)}
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{attempts.map((attempt, index) => (
				<Collapsible
					key={`${attempt.attempt_number}-${attempt.started_at ?? index}`}
					defaultOpen={false}
				>
					<div className="border-l border-l-border-default/50">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="group flex w-full items-start gap-3 border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-surface-secondary/20"
							>
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-sm font-semibold text-content-primary">
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.attempt_51c78c77",
											)}
											{attempt.attempt_number}
										</span>
										{attempt.method || attempt.path ? (
											<span className="truncate font-mono text-xs font-medium text-content-secondary">
												{[attempt.method, attempt.path]
													.filter(Boolean)
													.join(" ")}
											</span>
										) : null}
										{attempt.response_status ? (
											<Badge
												size="xs"
												variant={
													attempt.response_status < 400
														? "green"
														: "destructive"
												}
											>
												{attempt.response_status}
											</Badge>
										) : null}
										<Badge
											size="sm"
											variant={getStatusBadgeVariant(attempt.status)}
											className="shrink-0 sm:hidden"
										>
											{attempt.status ||
												tI18n(
													"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.unknown_b23a6a84",
												)}
										</Badge>
									</div>
									<p className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-content-secondary">
										<span>{getAttemptTimingLabel(attempt)}</span>
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<Badge
										size="sm"
										variant={getStatusBadgeVariant(attempt.status)}
										className="hidden shrink-0 sm:inline-flex"
									>
										{attempt.status ||
											tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.unknown_b23a6a84",
											)}
									</Badge>
									<ChevronDownIcon
										className={cn(
											"mt-0.5 size-4 shrink-0 text-content-secondary transition-transform",
											"group-data-[state=open]:rotate-180",
										)}
									/>
								</div>
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="px-4 pb-4 pt-2">
							<div className="space-y-3">
								<DebugDataSection
									title={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.raw_request_fd7cd1f7",
									)}
								>
									<JsonBlock
										value={attempt.raw_request}
										emptyMessage={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.no_raw_request_captured_f161acb5",
										)}
										copyLabel={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.copy_raw_request_json_167ed63f",
										)}
									/>
								</DebugDataSection>
								<DebugDataSection
									title={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.raw_response_58737239",
									)}
								>
									<JsonBlock
										value={attempt.raw_response}
										emptyMessage={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.no_raw_response_captured_ea32919e",
										)}
										copyLabel={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.copy_raw_response_json_ce4e6dbb",
										)}
									/>
								</DebugDataSection>
								<DebugDataSection
									title={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.error_54a0e8c1",
									)}
								>
									<JsonBlock
										value={attempt.error}
										emptyMessage={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.no_error_captured_eb605613",
										)}
										copyLabel={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugAttemptAccordion.copy_raw_attempt_error_4e3a5909",
										)}
									/>
								</DebugDataSection>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>
			))}
		</div>
	);
};
