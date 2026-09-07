import { cn } from "cn";
import { ChevronDownIcon, WrenchIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "#/api/errors";
import type { ChatDebugStep } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { currentIntlLocale } from "#/i18n/locale";
import { DebugAttemptAccordion } from "./DebugAttemptAccordion";
import {
	CopyableCodeBlock,
	DebugDataSection,
	EmptyHelper,
	KeyValueGrid,
	MetadataItem,
	PillToggle,
} from "./DebugPanelPrimitives";
import {
	MessageRow,
	ToolBadge,
	ToolEventCard,
	ToolPayloadDisclosure,
} from "./DebugStepCardTooling";
import {
	coerceStepRequest,
	coerceStepResponse,
	coerceUsageRecord,
	compactDuration,
	computeDurationMs,
	extractTokenCounts,
	formatTokenSummary,
	getStatusBadgeVariant,
	normalizeAttempts,
	safeJsonStringify,
	TRANSCRIPT_PREVIEW_COUNT,
} from "./debugPanelUtils";

interface DebugStepCardProps {
	step: ChatDebugStep;
	defaultOpen?: boolean;
}

type SectionKey = "tools" | "options" | "usage" | "policy";

export const DebugStepCard: FC<DebugStepCardProps> = ({
	step,
	defaultOpen = false,
}) => {
	const { t: tI18n } = useTranslation("agents");

	// Single active metadata pill: only one section open at a time.
	const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

	// Transcript preview: show last N messages by default.
	const [showAllMessages, setShowAllMessages] = useState(false);

	const toggleSection = (key: SectionKey) => {
		setActiveSection((prev) => (prev === key ? null : key));
	};

	// Coerce payloads defensively.
	const request = coerceStepRequest(step.normalized_request);
	const response = coerceStepResponse(step.normalized_response);
	const stepUsage = coerceUsageRecord(step.usage);
	const mergedUsage =
		Object.keys(stepUsage).length > 0 ? stepUsage : response.usage;
	const tokenCounts = extractTokenCounts(mergedUsage);
	const tokenLabel = formatTokenSummary(tokenCounts.input, tokenCounts.output);
	const normalizedAttempts = normalizeAttempts(step.attempts);
	const attemptCount = normalizedAttempts.parsed.length;

	const durationMs = computeDurationMs(step.started_at, step.finished_at);
	const durationLabel = durationMs !== null ? compactDuration(durationMs) : "-";

	// Model: prefer request model, then response model.
	const model = request.model ?? response.model;

	// Counts for pill badges.
	const toolCount = request.tools.length;
	const optionCount = Object.keys(request.options).length;
	const usageEntryCount = Object.keys(mergedUsage).length;
	const policyCount = Object.keys(request.policy).length;
	const hasPills =
		toolCount > 0 || optionCount > 0 || usageEntryCount > 0 || policyCount > 0;

	// Transcript preview slicing.
	const totalMessages = request.messages.length;
	const isTruncated =
		!showAllMessages && totalMessages > TRANSCRIPT_PREVIEW_COUNT;
	const visibleMessages = isTruncated
		? request.messages.slice(-TRANSCRIPT_PREVIEW_COUNT)
		: request.messages;
	const hiddenCount = totalMessages - visibleMessages.length;

	// Detect whether there is meaningful output.
	const hasOutput =
		!!response.content ||
		response.toolCalls.length > 0 ||
		response.warnings.length > 0 ||
		!!response.finishReason;

	// Detect whether there is an error payload. `step.error` is typed
	// as an object but the runtime may deliver either a string or a
	// non-empty object, so probe both shapes via an `unknown` view.
	const rawError: unknown = step.error;
	const isStringError =
		typeof rawError === "string" && rawError.trim().length > 0;
	const hasError =
		isStringError ||
		(typeof rawError === "object" &&
			rawError !== null &&
			Object.keys(rawError).length > 0);
	const errorText = getErrorMessage(rawError, safeJsonStringify(rawError));

	return (
		<Collapsible defaultOpen={defaultOpen}>
			<div className="overflow-hidden rounded-lg border border-solid border-border-default/40 bg-surface-secondary/10">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="group flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-surface-secondary/25"
					>
						<div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
							<span className="shrink-0 text-xs font-medium text-content-tertiary">
								{tI18n(
									"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.step_474a987f",
								)}
								{step.step_number}
							</span>
							{model ? (
								<span className="min-w-0 truncate text-xs text-content-secondary">
									{model}
								</span>
							) : null}
							<span className="shrink-0 whitespace-nowrap text-xs text-content-tertiary">
								{durationLabel}
							</span>
							{tokenLabel ? (
								<span className="shrink-0 whitespace-nowrap text-xs text-content-tertiary">
									{tokenLabel}
								</span>
							) : null}
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							<Badge
								size="xs"
								variant={getStatusBadgeVariant(step.status)}
								className="shrink-0"
							>
								{step.status ||
									tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.unknown_b23a6a84",
									)}
							</Badge>
							<ChevronDownIcon
								className={cn(
									"size-3.5 shrink-0 text-content-secondary transition-transform",
									"group-data-[state=open]:rotate-180",
								)}
							/>
						</div>
					</button>
				</CollapsibleTrigger>

				<CollapsibleContent className="space-y-3 border-0 border-t border-solid border-border-default/30 bg-surface-primary/10 px-3 pb-3 pt-3">
					{/* ── Metadata bar ────────────────────────────── */}
					<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-content-secondary">
						{model ? (
							<MetadataItem
								label={tI18n(
									"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.model_5e2c614c",
								)}
								value={model}
							/>
						) : null}
						{request.options.max_output_tokens !== undefined ? (
							<MetadataItem
								label={tI18n(
									"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.max_tokens_409e75c0",
								)}
								value={String(request.options.max_output_tokens)}
							/>
						) : null}
						{request.policy.tool_choice !== undefined ? (
							<MetadataItem
								label={tI18n(
									"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.tool_choice_d3a2c6a3",
								)}
								value={(() => {
									const tc = request.policy.tool_choice;
									if (tc == null) return "";
									if (typeof tc === "string") return tc;
									try {
										return JSON.stringify(tc);
									} catch {
										return String(tc);
									}
								})()}
							/>
						) : null}
						{attemptCount > 0 ? (
							<span className="text-xs text-content-tertiary">
								{attemptCount}{" "}
								{attemptCount === 1
									? tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.attempt_c7ce66d0",
										)
									: tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.attempts_1ac7d61d",
										)}
							</span>
						) : null}
					</div>

					{/* ── Pill toggles (single active) ───────────── */}
					{hasPills ? (
						<div className="flex flex-wrap gap-1">
							{toolCount > 0 ? (
								<PillToggle
									label={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.tools_ea93d6a2",
									)}
									count={toolCount}
									isActive={activeSection === "tools"}
									onToggle={() => toggleSection("tools")}
									icon={<WrenchIcon className="size-3" />}
								/>
							) : null}
							{optionCount > 0 ? (
								<PillToggle
									label={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.options_d0db8b5e",
									)}
									count={optionCount}
									isActive={activeSection === "options"}
									onToggle={() => toggleSection("options")}
								/>
							) : null}
							{usageEntryCount > 0 ? (
								<PillToggle
									label={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.usage_8d59829c",
									)}
									count={usageEntryCount}
									isActive={activeSection === "usage"}
									onToggle={() => toggleSection("usage")}
								/>
							) : null}
							{policyCount > 0 ? (
								<PillToggle
									label={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.policy_c611981f",
									)}
									count={policyCount}
									isActive={activeSection === "policy"}
									onToggle={() => toggleSection("policy")}
								/>
							) : null}
						</div>
					) : null}

					{/* ── Active metadata section ────────────────── */}
					{activeSection === "tools" && toolCount > 0 ? (
						<div className="flex flex-col gap-1.5">
							{request.tools.map((tool) => (
								<div
									key={tool.name}
									className="rounded-md border border-solid border-border-default/40 bg-surface-secondary/10 p-2.5"
								>
									<ToolBadge label={tool.name} />
									{tool.description ? (
										<p className="mt-1 wrap-break-word text-2xs leading-4 text-content-secondary">
											{tool.description}
										</p>
									) : null}
									<ToolPayloadDisclosure
										label={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.json_schema_a07e848c",
										)}
										code={tool.inputSchema}
										copyLabel={tI18n(
											"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.copy_value0_json_schema_e489b540",
											{
												value0: tool.name,
											},
										)}
									/>
								</div>
							))}
						</div>
					) : null}

					{activeSection === "options" && optionCount > 0 ? (
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.options_d0db8b5e",
							)}
						>
							<KeyValueGrid entries={request.options} />
						</DebugDataSection>
					) : null}

					{activeSection === "usage" && usageEntryCount > 0 ? (
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.usage_8d59829c",
							)}
						>
							<KeyValueGrid
								entries={mergedUsage}
								formatValue={(v) =>
									typeof v === "number"
										? v.toLocaleString(currentIntlLocale())
										: String(v)
								}
							/>
						</DebugDataSection>
					) : null}

					{activeSection === "policy" && policyCount > 0 ? (
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.policy_c611981f",
							)}
						>
							<KeyValueGrid entries={request.policy} />
						</DebugDataSection>
					) : null}

					{/* ── Input / Output sections ──────────────────── */}
					<div className="grid gap-4">
						{/* ── Input column ────────────────────────── */}
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.input_36ecb4f8",
							)}
						>
							{totalMessages > 0 ? (
								<div className="space-y-2">
									{hiddenCount > 0 ? (
										<button
											type="button"
											onClick={() => setShowAllMessages(true)}
											className="border-0 bg-transparent p-0 text-2xs font-medium text-content-link transition-colors hover:underline"
										>
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.show_all_6134b894",
											)}
											{totalMessages}
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.messages_6e2fd28d",
											)}
										</button>
									) : null}

									{showAllMessages &&
									totalMessages > TRANSCRIPT_PREVIEW_COUNT ? (
										<button
											type="button"
											onClick={() => setShowAllMessages(false)}
											className="border-0 bg-transparent p-0 text-2xs font-medium text-content-link transition-colors hover:underline"
										>
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.show_last_8801a30e",
											)}
											{TRANSCRIPT_PREVIEW_COUNT}
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.only_e850fc29",
											)}
										</button>
									) : null}

									{visibleMessages.map((msg, idx) => (
										<MessageRow
											key={hiddenCount + idx}
											msg={msg}
											clamp={!showAllMessages}
										/>
									))}
								</div>
							) : (
								<EmptyHelper
									message={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.no_input_messages_captured_3a0e6584",
									)}
								/>
							)}
						</DebugDataSection>

						{/* ── Output column ───────────────────────── */}
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.output_b2439bcb",
							)}
						>
							{hasOutput ? (
								<div className="space-y-2">
									{/* Primary response content: visually prominent. */}
									{response.content ? (
										<p className="max-h-112 overflow-auto whitespace-pre-wrap text-sm font-medium leading-6 text-content-primary">
											{response.content}
										</p>
									) : null}

									{/* Tool calls: structured cards with arguments. */}
									{response.toolCalls.length > 0 ? (
										<div className="space-y-1.5">
											{response.toolCalls.map((tc, idx) => (
												<ToolEventCard
													key={tc.id ?? `${tc.name}-${idx}`}
													badgeLabel={tc.name}
													toolCallId={tc.id}
													payloadLabel={tI18n(
														"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.arguments_7f816072",
													)}
													payload={tc.arguments}
													copyLabel={tI18n(
														"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.copy_value0_arguments_b9512f92",
														{
															value0: tc.name,
														},
													)}
												/>
											))}
										</div>
									) : null}

									{/* Secondary metadata: finish reason + warnings. */}
									{response.finishReason ? (
										<span className="block text-2xs text-content-tertiary">
											{tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.finish_b8c20c08",
											)}
											{response.finishReason}
										</span>
									) : null}
									{response.warnings.length > 0 ? (
										<div className="space-y-0.5">
											{response.warnings.map((w, idx) => (
												<p key={idx} className="text-xs text-content-warning">
													<span aria-hidden="true">⚠</span>{" "}
													<span className="sr-only">
														{tI18n(
															"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.warning_3299fe5c",
														)}
													</span>
													{w}
												</p>
											))}
										</div>
									) : null}
								</div>
							) : (
								<EmptyHelper
									message={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.no_output_captured_74089f24",
									)}
								/>
							)}
						</DebugDataSection>
					</div>

					{/* ── Error ───────────────────────────────────── */}
					{hasError ? (
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.error_54a0e8c1",
							)}
						>
							<CopyableCodeBlock
								code={errorText}
								label={
									isStringError
										? tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.copy_error_text_54db0f62",
											)
										: tI18n(
												"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.copy_error_json_a39d2348",
											)
								}
							/>
						</DebugDataSection>
					) : null}

					{/* ── Request body JSON (lower priority) ─────── */}
					<Collapsible>
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="group/raw flex items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-medium text-content-secondary transition-colors hover:text-content-primary"
							>
								<ChevronDownIcon className="size-3 transition-transform group-data-[state=open]/raw:rotate-180" />
								{tI18n(
									"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.request_body_a9b31e37",
								)}
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="mt-1.5">
							<CopyableCodeBlock
								code={safeJsonStringify(step.normalized_request)}
								label={tI18n(
									"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.copy_request_body_json_f280bbfd",
								)}
							/>
						</CollapsibleContent>
					</Collapsible>

					{/* ── Response body JSON ──────────────────────── */}
					{step.normalized_response ? (
						<Collapsible>
							<CollapsibleTrigger asChild>
								<button
									type="button"
									className="group/raw flex items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-medium text-content-secondary transition-colors hover:text-content-primary"
								>
									<ChevronDownIcon className="size-3 transition-transform group-data-[state=open]/raw:rotate-180" />
									{tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.response_body_f736153d",
									)}
								</button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-1.5">
								<CopyableCodeBlock
									code={safeJsonStringify(step.normalized_response)}
									label={tI18n(
										"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.copy_response_body_json_a7764a78",
									)}
								/>
							</CollapsibleContent>
						</Collapsible>
					) : null}

					{/* ── Raw HTTP attempts ───────────────────────── */}
					{attemptCount > 0 ||
					(normalizedAttempts.rawFallback &&
						normalizedAttempts.rawFallback !== "{}" &&
						normalizedAttempts.rawFallback !== "[]") ? (
						<DebugDataSection
							title={tI18n(
								"AgentsPage.components.RightPanel.DebugPanel.DebugStepCard.raw_attempts_0821dc8a",
							)}
						>
							<DebugAttemptAccordion
								attempts={normalizedAttempts.parsed}
								rawFallback={normalizedAttempts.rawFallback}
							/>
						</DebugDataSection>
					) : null}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
};
