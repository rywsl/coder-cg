import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";

export type FindToolsMatch = {
	name: string;
	description: string;
};

type FindToolsToolProps = {
	queries: readonly string[];
	names: readonly string[];
	matches: readonly FindToolsMatch[];
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
};

export const FindToolsTool: FC<FindToolsToolProps> = ({
	queries,
	names,
	matches,
	status,
	isError,
	errorMessage,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const queryLabel =
		[
			...queries,
			...names.map((name) =>
				tI18n(
					"AgentsPage.components.ChatElements.tools.FindToolsTool.name_value0_3c8bfd25",
					{
						value0: name,
					},
				),
			),
		].join(", ") || "tools";
	const label =
		status === "running"
			? tI18n(
					"AgentsPage.components.ChatElements.tools.FindToolsTool.searching_tools_value0_1cdf73d5",
					{
						value0: queryLabel,
					},
				)
			: tI18n(
					"AgentsPage.components.ChatElements.tools.FindToolsTool.searched_tools_value0_value1_matched_4432f0c4",
					{
						value0: queryLabel,
						value1: matches.length,
					},
				);

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.FindToolsTool.failed_to_search_tools_f87c8522",
				)
			}
			hasContent={matches.length > 0}
		>
			<ToolCall.Header iconName="find_tools" label={label} />
			<ToolCall.Content>
				<ul className="mt-1.5 space-y-2 pl-6 text-[13px] text-content-secondary">
					{matches.map((match) => (
						<li key={match.name}>
							<div className="font-medium text-content-primary">
								{match.name}
							</div>
							{match.description ? <div>{match.description}</div> : null}
						</li>
					))}
				</ul>
			</ToolCall.Content>
		</ToolCall.Root>
	);
};
