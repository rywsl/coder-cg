import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MergedTool } from "../../ChatConversation/types";
import { getReadFileToolData, ReadFileTool } from "./ReadFileTool";
import { ToolCall } from "./ToolCall";

type ReadFileItem = {
	id: string;
	path: string;
	content: string;
	status: MergedTool["status"];
	isError: boolean;
	errorMessage?: string;
	hookRewritten: boolean;
};

const getReadFileItem = (tool: MergedTool): ReadFileItem => ({
	id: tool.id,
	status: tool.status,
	hookRewritten: tool.hookRewritten ?? false,
	...getReadFileToolData(tool),
});

export const ReadFilesTool: FC<{
	tools: readonly MergedTool[];
	expanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
}> = ({ tools, expanded, onExpandedChange }) => {
	const { t: tI18n } = useTranslation("agents");

	const [expandedFileIDs, setExpandedFileIDs] = useState<ReadonlySet<string>>(
		new Set(),
	);
	const items = tools.map(getReadFileItem);
	const isRunning = tools.some((tool) => tool.status === "running");
	const isError = tools.some((tool) => tool.isError);
	const hasContent = items.length > 0;
	const label = isRunning
		? tI18n(
				"AgentsPage.components.ChatElements.tools.ReadFilesTool.reading_value0_files_c367aa5b",
				{
					value0: tools.length,
				},
			)
		: tI18n(
				"AgentsPage.components.ChatElements.tools.ReadFilesTool.read_value0_files_59b9bd8d",
				{
					value0: tools.length,
				},
			);
	const errorMessage = items.find((item) => item.errorMessage)?.errorMessage;

	return (
		<div data-tool-call="">
			<ToolCall.Root
				className="w-full"
				status={isRunning ? "running" : isError ? "error" : "completed"}
				isError={isError}
				errorMessage={
					errorMessage ||
					tI18n(
						"AgentsPage.components.ChatElements.tools.ReadFilesTool.failed_to_read_one_or_more_files_3a35bf78",
					)
				}
				hasContent={hasContent}
				expanded={expanded}
				onExpandedChange={onExpandedChange}
			>
				<ToolCall.PolicyProvider
					hookRewritten={items.some((item) => item.hookRewritten)}
				>
					<ToolCall.Header iconName="read_file" label={label} />
				</ToolCall.PolicyProvider>
				<ToolCall.Content>
					<div className="space-y-1 py-0.5 pl-3">
						{items.map((item) => (
							<ToolCall.PolicyProvider
								key={item.id}
								hookRewritten={item.hookRewritten}
							>
								<ReadFileTool
									path={item.path}
									content={item.content}
									status={item.status}
									isError={item.isError}
									errorMessage={item.errorMessage}
									expanded={expandedFileIDs.has(item.id)}
									onExpandedChange={(nextExpanded) => {
										setExpandedFileIDs((previous) => {
											const next = new Set(previous);
											if (nextExpanded) {
												next.add(item.id);
											} else {
												next.delete(item.id);
											}
											return next;
										});
									}}
								/>
							</ToolCall.PolicyProvider>
						))}
					</div>
				</ToolCall.Content>
			</ToolCall.Root>
		</div>
	);
};
