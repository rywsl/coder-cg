import { cn } from "cn";
import { OctagonXIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import { ScrollArea } from "#/components/ScrollArea/ScrollArea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import {
	type AgentDisplayState,
	resolveAgentDisplayState,
} from "./displayMode";
import { ToolCall } from "./ToolCall";
import type { ExecuteTranscriptBlock } from "./toolVisibility";
import {
	formatShellDurationMs,
	sanitizeExecuteModelIntent,
	signalTooltipLabel,
	summarizeParsedCommands,
	type ToolStatus,
} from "./utils";

type ExecuteToolProps = {
	command: string;
	transcriptBlocks: readonly ExecuteTranscriptBlock[];
	status: ToolStatus;
	isError: boolean;
	errorText?: string;
	durationMs?: number;
	isBackgrounded?: boolean;
	killedBySignal?: "kill" | "terminate";
	modelIntent?: string;
	parsedCommands?: readonly string[][];
	shellToolDisplayMode?: TypesGen.AgentDisplayMode;
};

export const ExecuteTool: React.FC<ExecuteToolProps> = ({
	command,
	transcriptBlocks,
	status,
	isError,
	errorText,
	durationMs,
	isBackgrounded = false,
	killedBySignal,
	modelIntent,
	parsedCommands,
	shellToolDisplayMode,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const hasTranscriptBlocks = transcriptBlocks.length > 0;
	const autoDisplayState: AgentDisplayState =
		hasTranscriptBlocks ||
		status === "running" ||
		isBackgrounded ||
		killedBySignal
			? "preview"
			: "collapsed";
	const isRunning = status === "running";
	const durationLabel = isBackgrounded ? "" : formatShellDurationMs(durationMs);
	const { commandLabel, durationSuffix } = getShellCommandLine({
		command,
		modelIntent,
		parsedCommands,
		durationLabel,
		isRunning,
		isError,
		isBackgrounded,
	});
	const defaultView = resolveAgentDisplayState(
		shellToolDisplayMode,
		autoDisplayState,
	);

	return (
		<ToolCall.Root
			key={`${shellToolDisplayMode ?? "auto"}:${autoDisplayState}`}
			className="group/exec grid w-full grid-cols-[minmax(0,1fr)_auto] items-start rounded-md bg-surface-primary font-sans font-normal text-xs leading-5"
			status={status}
			isError={isError}
			errorMessage={
				errorText ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.ExecuteTool.command_failed_8c45c79c",
				)
			}
			hasContent
			defaultView={defaultView}
			ariaLabel={(expanded) =>
				expanded
					? tI18n(
							"AgentsPage.components.ChatElements.tools.ExecuteTool.collapse_command_bdecb6d7",
						)
					: tI18n(
							"AgentsPage.components.ChatElements.tools.ExecuteTool.expand_command_3f5c6b49",
						)
			}
		>
			<ToolCall.HeaderLayout>
				<ToolCall.HeaderButton className="col-start-1 row-start-1 min-w-0 font-normal">
					<ToolCall.LeadingIcon name="execute" />
					<span className="flex min-w-0 items-baseline">
						<ToolCall.Label>{commandLabel}</ToolCall.Label>
						{durationSuffix && (
							<span className="ml-1 shrink-0 text-content-secondary">
								{durationSuffix}
							</span>
						)}
					</span>
					<ToolCall.Status />
					<ToolCall.Chevron />
				</ToolCall.HeaderButton>
				<ToolCall.HeaderActions>
					{killedBySignal && !isRunning && (
						<Tooltip>
							<TooltipTrigger asChild>
								<OctagonXIcon className="size-3.5 shrink-0 text-content-secondary" />
							</TooltipTrigger>
							<TooltipContent>
								{signalTooltipLabel(killedBySignal)}
							</TooltipContent>
						</Tooltip>
					)}
					<CopyButton
						text={command}
						label={tI18n(
							"AgentsPage.components.ChatElements.tools.ExecuteTool.copy_command_9a01feec",
						)}
						className="-my-0.5 size-6 p-0 opacity-0 transition-opacity hover:bg-surface-tertiary group-hover/exec:opacity-100 focus-visible:opacity-100"
					/>
				</ToolCall.HeaderActions>
			</ToolCall.HeaderLayout>
			<ToolCall.Content>
				<ShellTranscriptBody
					command={command}
					transcriptBlocks={transcriptBlocks}
					isError={isError}
				/>
			</ToolCall.Content>
		</ToolCall.Root>
	);
};

type ShellCommandLineInput = {
	command: string;
	modelIntent?: string;
	parsedCommands?: readonly string[][];
	durationLabel: string;
	isRunning: boolean;
	isError: boolean;
	isBackgrounded: boolean;
};

const getShellCommandLine = ({
	command,
	modelIntent,
	parsedCommands,
	durationLabel,
	isRunning,
	isError,
	isBackgrounded,
}: ShellCommandLineInput): { commandLabel: string; durationSuffix: string } => {
	const summary =
		parsedCommands && parsedCommands.length > 0
			? summarizeParsedCommands(parsedCommands)
			: "";
	const commandDisplay = summary || command;
	const intentLabel = sanitizeExecuteModelIntent(modelIntent, command);
	let commandLabel = intentLabel
		? i18n.t(
				"agents:AgentsPage.components.ChatElements.tools.ExecuteTool.value0_using_value1_d04d340a",
				{
					value0: intentLabel,
					value1: commandDisplay,
				},
			)
		: i18n.t(
				"agents:AgentsPage.components.ChatElements.tools.ExecuteTool.ran_value0_7a4f51a7",
				{
					value0: commandDisplay,
				},
			);
	if (intentLabel && isBackgrounded) {
		commandLabel = i18n.t(
			"agents:AgentsPage.components.ChatElements.tools.ExecuteTool.value0_in_the_background_using_value1_033c727b",
			{
				value0: intentLabel,
				value1: commandDisplay,
			},
		);
	} else if (isBackgrounded) {
		commandLabel = i18n.t(
			"agents:AgentsPage.components.ChatElements.tools.ExecuteTool.started_value0_in_the_background_50eb0bf6",
			{
				value0: commandDisplay,
			},
		);
	}
	if (!isRunning && isError) {
		commandLabel = i18n.t(
			"agents:AgentsPage.components.ChatElements.tools.ExecuteTool.failed_to_run_value0_965f2a47",
			{
				value0: commandDisplay,
			},
		);
	}

	return {
		commandLabel,
		durationSuffix: durationLabel ? ` for ${durationLabel}` : "",
	};
};

const ShellTranscriptBody: React.FC<{
	command: string;
	transcriptBlocks: readonly ExecuteTranscriptBlock[];
	isError: boolean;
}> = ({ command, transcriptBlocks, isError }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<ScrollArea
			className="col-start-1 col-span-2 mt-2 rounded-xl bg-surface-secondary/60 text-2xs"
			viewportClassName="max-h-64"
			viewportTabIndex={0}
			viewportAriaLabel={tI18n(
				"AgentsPage.components.ChatElements.tools.ExecuteTool.command_output_ff7a52bf",
			)}
			scrollBarClassName="w-1.5"
		>
			<div className="px-3 py-2.5">
				<pre className="m-0 whitespace-pre-wrap break-all border-0 bg-transparent p-0 font-mono text-xs font-semibold leading-5 text-content-primary">
					<span aria-hidden className="select-none">
						$
					</span>{" "}
					{command}
				</pre>
				{transcriptBlocks.map((block) => (
					<pre
						key={block.kind}
						className={cn(
							"m-0 mt-4 whitespace-pre-wrap break-all border-0 bg-transparent p-0 font-mono text-xs font-normal leading-5",
							block.kind === "error" || isError
								? "text-content-destructive"
								: "text-content-secondary",
						)}
					>
						{block.text}
					</pre>
				))}
			</div>
		</ScrollArea>
	);
};
