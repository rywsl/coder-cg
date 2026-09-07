import type React from "react";
import { useTranslation } from "react-i18next";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";

export const ChatClearedTool: React.FC<{
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
}> = ({ status, isError, errorMessage }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.ChatClearedTool.failed_to_clear_conversation_context_bfdfd9e8",
				)
			}
			hasContent={false}
		>
			<ToolCall.Header
				iconName="chat_cleared"
				label={tI18n(
					"AgentsPage.components.ChatElements.tools.ChatClearedTool.context_cleared_e6cafa3c",
				)}
			/>
		</ToolCall.Root>
	);
};
