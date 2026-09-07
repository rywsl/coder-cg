import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { workspaceAgentCredentials } from "#/api/queries/workspaces";
import type { Workspace, WorkspaceAgent } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { Loader } from "#/components/Loader/Loader";

interface AgentExternalProps {
	agent: WorkspaceAgent;
	workspace: Workspace;
}

export const AgentExternal: FC<AgentExternalProps> = ({ agent, workspace }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const {
		data: credentials,
		error,
		isLoading,
		isError,
	} = useQuery(workspaceAgentCredentials(workspace.id, agent.name));

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		return <ErrorAlert error={error} />;
	}

	return (
		<section className="text-base text-content-secondary pb-2 leading-relaxed">
			<p>
				{tI18n(
					"resources.AgentExternal.please_run_the_following_command_to_attach_an_ag_ef79fa65",
				)}{" "}
				{workspace.name}
				{tI18n("resources.AgentExternal.workspace_718ec194")}
			</p>
			<CodeExample
				code={credentials?.command ?? ""}
				secret={false}
				redactPattern={/CODER_AGENT_TOKEN="([^"]+)"/g}
				redactReplacement={`CODER_AGENT_TOKEN="********"`}
				showRevealButton
			/>
		</section>
	);
};
