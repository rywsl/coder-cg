import { LoaderIcon, PlayIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { skipToken, useMutation, useQuery } from "react-query";
import { API } from "#/api/api";
import { chatFilesKey, chatFileTextKey } from "#/api/queries/chats";
import { Button } from "#/components/Button/Button";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { getPathBasename } from "../../../utils/path";
import { Response } from "../Response";
import { TranscriptRow } from "../TranscriptRow";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";

export const ProposePlanTool: React.FC<{
	content?: string;
	fileID?: string;
	path: string;
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
	onImplementPlan?: () => Promise<void> | void;
}> = ({
	content: inlineContent,
	fileID,
	path,
	status,
	isError,
	errorMessage,
	onImplementPlan,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const hasInlineContent = (inlineContent?.trim().length ?? 0) > 0;
	const fileQuery = useQuery({
		queryKey: fileID ? chatFileTextKey(fileID) : chatFilesKey,
		queryFn:
			fileID && !hasInlineContent
				? () => API.experimental.getChatFileText(fileID)
				: skipToken,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const fetchError = fileQuery.isError
		? fileQuery.error instanceof Error
			? fileQuery.error.message
			: tI18n(
					"AgentsPage.components.ChatElements.tools.ProposePlanTool.failed_to_load_plan_1125bd67",
				)
		: undefined;
	const fetchLoading = fileQuery.isLoading;
	const displayContent = hasInlineContent
		? (inlineContent ?? "")
		: (fileQuery.data ?? "");
	const isRunning = status === "running";
	const filename = getPathBasename(path || "PLAN.md") || "PLAN.md";
	const effectiveError = isError || Boolean(fetchError);
	const effectiveErrorMessage = errorMessage || fetchError;
	const hasDisplayContent = displayContent.trim().length > 0;
	const implementPlanMutation = useMutation({
		mutationFn: async () => {
			if (!onImplementPlan) return;
			await onImplementPlan();
		},
	});
	const canImplementPlan =
		status === "completed" &&
		!effectiveError &&
		!fetchLoading &&
		hasDisplayContent &&
		Boolean(onImplementPlan);

	return (
		<div className="w-full">
			<ToolCall.Root
				status={status}
				isError={effectiveError}
				errorMessage={
					effectiveErrorMessage ||
					tI18n(
						"AgentsPage.components.ChatElements.tools.ProposePlanTool.failed_to_propose_plan_5cef41a5",
					)
				}
				hasContent={false}
			>
				<ToolCall.Header
					iconName="propose_plan"
					label={
						isRunning
							? tI18n(
									"AgentsPage.components.ChatElements.tools.ProposePlanTool.proposing_value0_f241d05a",
									{
										value0: filename,
									},
								)
							: tI18n(
									"AgentsPage.components.ChatElements.tools.ProposePlanTool.proposed_value0_68d0bc8b",
									{
										value0: filename,
									},
								)
					}
				/>
			</ToolCall.Root>
			{hasDisplayContent ? (
				<>
					<Response>{displayContent}</Response>
					<div className="group/plan-actions flex items-center gap-2">
						<CopyButton
							text={displayContent}
							label={tI18n(
								"AgentsPage.components.ChatElements.tools.ProposePlanTool.copy_plan_be6f750a",
							)}
							className="opacity-0 transition-opacity group-hover/plan-actions:opacity-100 focus-visible:opacity-100"
						/>
						{canImplementPlan && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="subtle"
										size="sm"
										onClick={() => {
											implementPlanMutation.mutate();
										}}
										disabled={
											!canImplementPlan || implementPlanMutation.isPending
										}
										aria-label={tI18n(
											"AgentsPage.components.ChatElements.tools.ProposePlanTool.implement_plan_515c393e",
										)}
									>
										{implementPlanMutation.isPending ? (
											<LoaderIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
										) : (
											<PlayIcon />
										)}
										{implementPlanMutation.isPending
											? tI18n(
													"AgentsPage.components.ChatElements.tools.ProposePlanTool.implementing_8643bb07",
												)
											: tI18n(
													"AgentsPage.components.ChatElements.tools.ProposePlanTool.implement_c7a2b3bc",
												)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{tI18n(
										"AgentsPage.components.ChatElements.tools.ProposePlanTool.implement_plan_515c393e",
									)}
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</>
			) : (
				!fetchLoading &&
				!effectiveError && (
					<p className="text-[13px] text-content-secondary italic">
						{tI18n(
							"AgentsPage.components.ChatElements.tools.ProposePlanTool.no_plan_content_969842f1",
						)}
					</p>
				)
			)}
			{fetchLoading && (
				<TranscriptRow className="gap-2 text-[13px] text-content-secondary">
					<LoaderIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
					{tI18n(
						"AgentsPage.components.ChatElements.tools.ProposePlanTool.loading_plan_c9773eb9",
					)}
				</TranscriptRow>
			)}
		</div>
	);
};
