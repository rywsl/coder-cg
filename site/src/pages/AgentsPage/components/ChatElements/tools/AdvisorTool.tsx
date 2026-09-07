import { TriangleAlertIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "#/components/ScrollArea/ScrollArea";
import { Response } from "../Response";
import { ToolCall } from "./ToolCall";
import { formatModelIntentLabel, type ToolStatus } from "./utils";

export type AdvisorToolResultType = "advice" | "limit_reached" | "error";

type AdvisorToolProps = {
	question: string;
	status: ToolStatus;
	isError: boolean;
	resultType?: AdvisorToolResultType;
	advice?: string;
	errorMessage?: string;
	modelIntent?: string;
};

export const AdvisorTool: React.FC<AdvisorToolProps> = ({
	question,
	status,
	isError,
	resultType,
	advice,
	errorMessage,
	modelIntent,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const questionText = question.trim() || "No question provided.";
	const adviceText = advice?.trim() ?? "";
	const effectiveErrorMessage =
		errorMessage?.trim() || "Advisor could not return guidance.";
	const isRunning = status === "running";
	const showLimitReached = resultType === "limit_reached";
	const showError = isError || resultType === "error";

	const intent = formatModelIntentLabel(modelIntent);
	const label = showLimitReached
		? tI18n(
				"AgentsPage.components.ChatElements.tools.AdvisorTool.advisor_limit_reached_4db0991d",
			)
		: intent && !showError
			? intent
			: isRunning
				? tI18n(
						"AgentsPage.components.ChatElements.tools.AdvisorTool.consulting_the_advisor_d4648159",
					)
				: showError
					? tI18n(
							"AgentsPage.components.ChatElements.tools.AdvisorTool.failed_to_consult_the_advisor_3e68670e",
						)
					: tI18n(
							"AgentsPage.components.ChatElements.tools.AdvisorTool.consulted_the_advisor_6699030c",
						);

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={showError}
			errorMessage={effectiveErrorMessage}
			hasContent
			defaultExpanded={isRunning}
		>
			<ToolCall.Header
				iconName="advisor"
				label={label}
				secondaryLabel={
					showLimitReached ? (
						<TriangleAlertIcon className="size-3.5 shrink-0 text-content-warning" />
					) : null
				}
			/>
			<ToolCall.Content>
				<ScrollArea
					className="mt-1.5 rounded-md border border-solid border-border-default"
					viewportClassName="max-h-64"
					viewportTabIndex={0}
					viewportAriaLabel={tI18n(
						"AgentsPage.components.ChatElements.tools.AdvisorTool.advisor_response_504fdec8",
					)}
					scrollBarClassName="w-1.5"
				>
					<div className="space-y-2 px-3 py-2">
						<p className="m-0 whitespace-pre-wrap wrap-break-word text-[13px] italic leading-5 text-content-secondary wrap-anywhere">
							{questionText}
						</p>
						<div className="border-0 border-t border-solid border-border-default pt-2">
							{showError ? (
								<div role="alert" className="text-sm">
									<p className="m-0 font-medium text-content-primary">
										{tI18n(
											"AgentsPage.components.ChatElements.tools.AdvisorTool.advisor_request_failed_5ea8b26c",
										)}
									</p>
									<p className="m-0 text-content-secondary wrap-anywhere">
										{effectiveErrorMessage}
									</p>
								</div>
							) : showLimitReached ? (
								<div role="status" className="text-sm">
									<p className="m-0 font-medium text-content-primary">
										{tI18n(
											"AgentsPage.components.ChatElements.tools.AdvisorTool.advisor_limit_reached_2219b33b",
										)}
									</p>
									<p className="m-0 text-content-secondary">
										{tI18n(
											"AgentsPage.components.ChatElements.tools.AdvisorTool.you_have_reached_the_advisor_limit_for_this_conv_8c41fc38",
										)}
									</p>
								</div>
							) : isRunning && adviceText.length === 0 ? (
								<div
									role="status"
									className="text-[13px] text-content-secondary"
								>
									{tI18n(
										"AgentsPage.components.ChatElements.tools.AdvisorTool.reviewing_context_and_preparing_guidance_a22f1cc6",
									)}
								</div>
							) : (
								<Response
									streaming={isRunning}
									className="text-[13px] leading-5"
								>
									{adviceText ||
										tI18n(
											"AgentsPage.components.ChatElements.tools.AdvisorTool.advisor_returned_no_guidance_4e5b7146",
										)}
								</Response>
							)}
						</div>
					</div>
				</ScrollArea>
			</ToolCall.Content>
		</ToolCall.Root>
	);
};
