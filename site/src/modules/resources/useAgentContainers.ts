import { useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { watchAgentContainers } from "#/api/api";
import {
	workspaceAgentContainers,
	workspaceAgentContainersKey,
} from "#/api/queries/workspaces";
import type {
	WorkspaceAgent,
	WorkspaceAgentDevcontainer,
	WorkspaceAgentListContainersResponse,
} from "#/api/typesGenerated";

export function useAgentContainers(
	agent: WorkspaceAgent,
): readonly WorkspaceAgentDevcontainer[] | undefined {
	const { t: tI18n } = useTranslation("workspaces");

	const queryClient = useQueryClient();
	const queryKey = workspaceAgentContainersKey(agent.id);

	const {
		data: devcontainers,
		error: queryError,
		isLoading: queryIsLoading,
	} = useQuery({
		...workspaceAgentContainers(agent),
		select: (res) => res.devcontainers,
	});

	const updateDevcontainersCache = useEffectEvent(
		async (data: WorkspaceAgentListContainersResponse) => {
			queryClient.setQueryData(queryKey, data);
		},
	);

	useEffect(() => {
		if (agent.status !== "connected" || queryIsLoading || queryError) {
			return;
		}

		const socket = watchAgentContainers(agent.id);

		socket.addEventListener("message", (event) => {
			if (event.parseError) {
				toast.error(
					tI18n(
						"resources.useAgentContainers.failed_to_update_containers_eaecc1d1",
					),
					{
						description: tI18n(
							"resources.useAgentContainers.please_try_refreshing_the_page_ed111497",
						),
					},
				);
				return;
			}

			updateDevcontainersCache(event.parsedMessage);
		});

		socket.addEventListener("error", () => {
			toast.error(
				tI18n(
					"resources.useAgentContainers.failed_to_load_containers_30d0849a",
				),
				{
					description: tI18n(
						"resources.useAgentContainers.please_try_refreshing_the_page_ed111497",
					),
				},
			);
		});

		return () => socket.close();
	}, [agent.id, agent.status, queryIsLoading, queryError]);

	return devcontainers;
}
