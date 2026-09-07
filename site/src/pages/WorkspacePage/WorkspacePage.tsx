import { type FC, useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router";
import { toast } from "sonner";
import { watchWorkspace } from "#/api/api";
import { template as templateQueryOptions } from "#/api/queries/templates";
import { workspaceBuildsKey } from "#/api/queries/workspaceBuilds";
import {
	workspaceByOwnerAndName,
	workspacePermissions,
} from "#/api/queries/workspaces";
import type { Workspace } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { Margins } from "#/components/Margins/Margins";
import { WorkspaceReadyPage } from "./WorkspaceReadyPage";

const WorkspacePage: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	const queryClient = useQueryClient();
	const params = useParams() as {
		username: string;
		workspace: string;
	};
	const workspaceName = params.workspace;
	const username = params.username.replace("@", "");

	// Workspace
	const workspaceQueryOptions = workspaceByOwnerAndName(
		username,
		workspaceName,
	);
	const workspaceQuery = useQuery(workspaceQueryOptions);
	const workspace = workspaceQuery.data;

	// Template
	const templateQuery = useQuery({
		...templateQueryOptions(workspace?.template_id ?? ""),
		enabled: Boolean(workspace),
	});
	const template = templateQuery.data;

	// Permissions
	const permissionsQuery = useQuery(workspacePermissions(workspace));
	const permissions = permissionsQuery.data;

	// Watch workspace changes
	const updateWorkspaceData = useEffectEvent(
		async (newWorkspaceData: Workspace) => {
			if (!workspace) {
				throw new Error(
					"Applying an update for a workspace that is undefined.",
				);
			}

			queryClient.setQueryData(
				workspaceQueryOptions.queryKey,
				newWorkspaceData,
			);

			const hasNewBuild =
				newWorkspaceData.latest_build.id !== workspace.latest_build.id;
			const lastBuildHasChanged =
				newWorkspaceData.latest_build.status !== workspace.latest_build.status;

			if (hasNewBuild || lastBuildHasChanged) {
				await queryClient.invalidateQueries({
					queryKey: workspaceBuildsKey(newWorkspaceData.id),
				});
			}
		},
	);
	const workspaceId = workspace?.id;
	useEffect(() => {
		if (!workspaceId) {
			return;
		}

		const socket = watchWorkspace(workspaceId);
		socket.addEventListener("message", (event) => {
			if (event.parseError) {
				toast.error(
					tI18n(
						"WorkspacePage.WorkspacePage.unable_to_process_latest_data_for_workspace_valu_a9c3299c",
						{
							value0: workspaceName,
						},
					),
					{
						description: tI18n(
							"WorkspacePage.WorkspacePage.please_try_refreshing_the_page_ed111497",
						),
					},
				);
				return;
			}

			if (event.parsedMessage.type === "data") {
				updateWorkspaceData(event.parsedMessage.data as Workspace);
			}
		});
		socket.addEventListener("error", () => {
			toast.error(
				tI18n(
					"WorkspacePage.WorkspacePage.unable_to_get_changes_for_workspace_value0_00452e5b",
					{
						value0: workspaceName,
					},
				),
				{
					description: tI18n(
						"WorkspacePage.WorkspacePage.connection_has_been_closed_21dfe564",
					),
				},
			);
		});

		return () => socket.close();
	}, [workspaceId, workspaceName]);

	// Page statuses
	const pageError =
		workspaceQuery.error ?? templateQuery.error ?? permissionsQuery.error;
	const isLoading = !workspace || !template || !permissions;

	return pageError ? (
		<Margins>
			<ErrorAlert error={pageError} className="my-4" />
		</Margins>
	) : isLoading ? (
		<Loader />
	) : (
		<WorkspaceReadyPage
			workspace={workspace}
			template={template}
			permissions={permissions}
		/>
	);
};

export default WorkspacePage;
