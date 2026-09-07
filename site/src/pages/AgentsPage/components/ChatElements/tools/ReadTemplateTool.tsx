import type React from "react";
import { useTranslation } from "react-i18next";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";

/**
 * Simple inline rendering for `read_template` tool calls.
 * Shows "Read template <name>" with no expandable content.
 */
export const ReadTemplateTool: React.FC<{
	templateName: string;
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
}> = ({ templateName, status, isError, errorMessage }) => {
	const { t: tI18n } = useTranslation("agents");

	const isRunning = status === "running";

	const label = isRunning
		? tI18n(
				"AgentsPage.components.ChatElements.tools.ReadTemplateTool.reading_template_4bbfee20",
			)
		: templateName
			? tI18n(
					"AgentsPage.components.ChatElements.tools.ReadTemplateTool.read_template_value0_a7dfc289",
					{
						value0: templateName,
					},
				)
			: tI18n(
					"AgentsPage.components.ChatElements.tools.ReadTemplateTool.read_template_4783232c",
				);

	return (
		<ToolCall.Root
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.ReadTemplateTool.failed_to_read_template_15dfbf50",
				)
			}
			hasContent={false}
		>
			<ToolCall.Header iconName="read_template" label={label} />
		</ToolCall.Root>
	);
};
