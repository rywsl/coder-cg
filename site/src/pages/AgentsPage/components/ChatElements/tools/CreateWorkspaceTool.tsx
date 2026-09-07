import { ExternalLinkIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ToolCall } from "./ToolCall";
import { asString, parseArgs, type ToolStatus } from "./utils";
import { WorkspaceBuildLogSection } from "./WorkspaceBuildLogSection";

/**
 * Rendering for `create_workspace` tool calls.
 *
 * Shows "Creating workspace…" while running with streaming build logs,
 * and "Created <name>" when complete with a link to view the workspace.
 * Build logs are available in a collapsible section.
 */
export const CreateWorkspaceTool: React.FC<{
	workspaceName: string;
	resultJson: string;
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
	buildId?: string;
	created?: boolean;
	labelOverride?: string;
}> = ({
	workspaceName,
	resultJson,
	status,
	isError,
	errorMessage,
	buildId,
	created = true,
	labelOverride,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const isRunning = status === "running";
	const rec = parseArgs(resultJson);
	const ownerName = rec ? asString(rec.owner_name) : "";
	const wsName = rec ? asString(rec.workspace_name) : workspaceName;
	const workspaceLink = ownerName && wsName ? `/@${ownerName}/${wsName}` : null;

	const label = isRunning
		? tI18n(
				"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.creating_workspace_afb0bf22",
			)
		: labelOverride
			? labelOverride
			: isError
				? tI18n(
						"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.failed_to_create_value0_598ad5f6",
						{
							value0: wsName || "workspace",
						},
					)
				: created === false
					? tI18n(
							"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.workspace_value0_already_exists_ee9d183d",
							{
								value0: wsName,
							},
						)
					: wsName
						? tI18n(
								"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.created_value0_4bc4d3b0",
								{
									value0: wsName,
								},
							)
						: tI18n(
								"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.created_workspace_9ed48b44",
							);

	const hasBuildLogs = isRunning || Boolean(buildId);

	return (
		<ToolCall.Root
			className="w-full"
			status={status}
			isError={isError}
			errorMessage={
				errorMessage ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.failed_to_create_workspace_0a8d4fd6",
				)
			}
			hasContent={hasBuildLogs}
			defaultExpanded={isRunning}
		>
			<ToolCall.HeaderLayout>
				<ToolCall.HeaderButton>
					<ToolCall.LeadingIcon name="create_workspace" />
					<ToolCall.Label>{label}</ToolCall.Label>
					<ToolCall.Status />
					<ToolCall.Chevron />
				</ToolCall.HeaderButton>
				{workspaceLink && !isRunning && (
					<ToolCall.HeaderActions>
						<Link
							to={workspaceLink}
							className="inline-flex align-middle text-content-secondary opacity-50 transition-opacity hover:opacity-100"
							aria-label={tI18n(
								"AgentsPage.components.ChatElements.tools.CreateWorkspaceTool.view_workspace_ea77e961",
							)}
						>
							<ExternalLinkIcon className="size-3" />
						</Link>
					</ToolCall.HeaderActions>
				)}
			</ToolCall.HeaderLayout>
			<ToolCall.Content>
				<WorkspaceBuildLogSection status={status} buildId={buildId} />
			</ToolCall.Content>
		</ToolCall.Root>
	);
};
