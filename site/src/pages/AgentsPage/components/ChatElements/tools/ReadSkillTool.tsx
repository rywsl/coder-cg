import type React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "#/components/ScrollArea/ScrollArea";
import { Response } from "../Response";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";

export const ReadSkillTool: React.FC<{
	label: string;
	body: string;
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
}> = ({ label, body, status, isError, errorMessage }) => {
	const { t: tI18n } = useTranslation("agents");

	const hasContent = body.length > 0;
	const isRunning = status === "running";

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.ReadSkillTool.failed_to_read_skill_3a439549",
				)
			}
			hasContent={hasContent}
		>
			<ToolCall.Header
				iconName="read_skill"
				label={
					isRunning
						? tI18n(
								"AgentsPage.components.ChatElements.tools.ReadSkillTool.reading_value0_135641cc",
								{
									value0: label,
								},
							)
						: tI18n(
								"AgentsPage.components.ChatElements.tools.ReadSkillTool.read_value0_c148405e",
								{
									value0: label,
								},
							)
				}
			/>
			<ToolCall.Content>
				{body && (
					<ScrollArea
						className="mt-1.5 rounded-md border border-solid border-border-default"
						viewportClassName="max-h-64"
						viewportTabIndex={0}
						viewportAriaLabel={tI18n(
							"AgentsPage.components.ChatElements.tools.ReadSkillTool.skill_contents_6aa970b8",
						)}
						scrollBarClassName="w-1.5"
					>
						<div className="px-3 py-2">
							<Response>{body}</Response>
						</div>
					</ScrollArea>
				)}
			</ToolCall.Content>
		</ToolCall.Root>
	);
};
