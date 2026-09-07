import type React from "react";
import { useTranslation } from "react-i18next";
import { i18n } from "#/i18n";
import { getPathBasename } from "../../../utils/path";
import { asRecord, asString, humanizeMCPToolName, parseArgs } from "./utils";

type ToolLabelProps = {
	name: string;
	args: unknown;
	result: unknown;
	mcpSlug?: string;
};

const ProcessSignalLabel: React.FC<ToolLabelProps> = ({ args, result }) => {
	const { t: tI18n } = useTranslation("agents");

	const parsed = parseArgs(args);
	const parsedResult = asRecord(result);
	const signal = parsed ? asString(parsed.signal) : "";
	const processId = parsed ? asString(parsed.process_id) : "";
	const shortId = processId ? processId.slice(0, 8) : "";
	const suffix = shortId ? ` ${shortId}` : "";
	const isKill = signal === "kill";
	const isTerminate = signal === "terminate";

	const hasResult = result !== undefined && result !== null;
	if (!hasResult) {
		const inFlightVerb = isKill
			? "Killing process…"
			: isTerminate
				? "Terminating process…"
				: "Sending signal…";
		return <span className="truncate text-[13px]">{inFlightVerb}</span>;
	}

	const success = parsedResult ? Boolean(parsedResult.success) : false;
	if (success) {
		const verb = isKill ? "Killed" : "Terminated";
		return (
			<span className="truncate text-[13px]">
				{verb}
				{tI18n(
					"AgentsPage.components.ChatElements.tools.ToolLabel.process_83328e26",
				)}
				{suffix}
			</span>
		);
	}

	const failedVerb = isKill ? "kill" : isTerminate ? "terminate" : "signal";
	return (
		<span className="truncate text-[13px]">
			{tI18n(
				"AgentsPage.components.ChatElements.tools.ToolLabel.failed_to_e1e1ad89",
			)}
			{failedVerb}
			{tI18n(
				"AgentsPage.components.ChatElements.tools.ToolLabel.process_83328e26",
			)}
			{suffix}
		</span>
	);
};

const AttachFileLabel: React.FC<ToolLabelProps> = ({ args, result }) => {
	const { t: tI18n } = useTranslation("agents");

	const parsed = parseArgs(args);
	const parsedResult = asRecord(result);
	const resultName = parsedResult ? asString(parsedResult.name) : "";
	const argName = parsed ? asString(parsed.name) : "";
	const argPath = parsed ? asString(parsed.path) : "";
	const attachedName =
		resultName || argName || getPathBasename(argPath) || "file";
	return (
		<span className="truncate text-[13px]">
			{tI18n(
				"AgentsPage.components.ChatElements.tools.ToolLabel.attached_value0_8d8cac16",
				{
					value0: attachedName,
				},
			)}
		</span>
	);
};

export const genericToolLabels: Partial<
	Record<string, React.FC<ToolLabelProps>>
> = {
	process_signal: ProcessSignalLabel,
	process_list: () => (
		<span className="truncate text-[13px]">
			{i18n.t(
				"agents:AgentsPage.components.ChatElements.tools.ToolLabel.listing_processes_f1834a77",
			)}
		</span>
	),
	attach_file: AttachFileLabel,
	advisor: () => (
		<span className="truncate text-[13px] leading-4 text-content-secondary">
			{i18n.t(
				"agents:AgentsPage.components.ChatElements.tools.ToolLabel.advisor_28da8c1f",
			)}
		</span>
	),
};

export const ToolLabel: React.FC<ToolLabelProps> = (props) => {
	const Label = genericToolLabels[props.name];
	if (Label) {
		return <Label {...props} />;
	}
	const displayName = props.mcpSlug
		? humanizeMCPToolName(props.mcpSlug, props.name)
		: props.name;
	return <span className="truncate text-[13px]">{displayName}</span>;
};
