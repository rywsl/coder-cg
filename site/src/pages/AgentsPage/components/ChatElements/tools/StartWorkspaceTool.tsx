import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";
import { WorkspaceBuildLogSection } from "./WorkspaceBuildLogSection";

interface StartWorkspaceToolProps {
	status: ToolStatus;
	buildId?: string;
	workspaceName: string;
	isError: boolean;
	errorMessage?: string;
	noBuild?: boolean;
	labelOverride?: string;
}

export const StartWorkspaceTool: FC<StartWorkspaceToolProps> = ({
	status,
	buildId,
	workspaceName,
	isError,
	errorMessage,
	noBuild,
	labelOverride,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const isRunning = status === "running";

	const label = isRunning
		? tI18n(
				"AgentsPage.components.ChatElements.tools.StartWorkspaceTool.starting_workspace_3339e32b",
			)
		: labelOverride
			? labelOverride
			: isError
				? tI18n(
						"AgentsPage.components.ChatElements.tools.StartWorkspaceTool.failed_to_start_value0_403611e9",
						{
							value0: workspaceName || "workspace",
						},
					)
				: workspaceName
					? tI18n(
							"AgentsPage.components.ChatElements.tools.StartWorkspaceTool.started_value0_281dff47",
							{
								value0: workspaceName,
							},
						)
					: tI18n(
							"AgentsPage.components.ChatElements.tools.StartWorkspaceTool.started_workspace_4530ffc2",
						);

	const hasBuildLogs = (isRunning || Boolean(buildId)) && !noBuild;

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.StartWorkspaceTool.failed_to_start_workspace_7a5b7ed2",
				)
			}
			hasContent={hasBuildLogs}
			defaultExpanded={isRunning}
		>
			<ToolCall.Header iconName="start_workspace" label={label} />
			<ToolCall.Content>
				<WorkspaceBuildLogSection status={status} buildId={buildId} />
			</ToolCall.Content>
		</ToolCall.Root>
	);
};
