import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import type { Workspace, WorkspaceBuild } from "#/api/typesGenerated";

interface UseBatchActionsOptions {
	onSuccess: () => Promise<void>;
}

type UpdateAllPayload = Readonly<{
	workspaces: readonly Workspace[];
}>;

type UseBatchActionsResult = Readonly<{
	isProcessing: boolean;
	start: (workspaces: readonly Workspace[]) => Promise<WorkspaceBuild[]>;
	stop: (workspaces: readonly Workspace[]) => Promise<WorkspaceBuild[]>;
	delete: (workspaces: readonly Workspace[]) => Promise<WorkspaceBuild[]>;
	updateTemplateVersions: (
		payload: UpdateAllPayload,
	) => Promise<WorkspaceBuild[]>;
	favorite: (payload: readonly Workspace[]) => Promise<void>;
	unfavorite: (payload: readonly Workspace[]) => Promise<void>;
}>;

export function useBatchActions(
	options: UseBatchActionsOptions,
): UseBatchActionsResult {
	const { t: tI18n } = useTranslation("workspaces");

	const { onSuccess } = options;

	const startAllMutation = useMutation({
		mutationFn: (workspaces: readonly Workspace[]) => {
			return Promise.all(
				workspaces
					.filter((w) => w.latest_build.status === "stopped")
					.map((w) =>
						API.startWorkspace(w.id, w.latest_build.template_version_id),
					),
			);
		},
		onSuccess,
		onError: (error) => {
			toast.error(
				tI18n(
					"WorkspacesPage.batchActions.failed_to_start_workspaces_4518344a",
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	const stopAllMutation = useMutation({
		mutationFn: (workspaces: readonly Workspace[]) => {
			return Promise.all(
				workspaces
					.filter((w) => w.latest_build.status === "running")
					.map((w) => API.stopWorkspace(w.id)),
			);
		},
		onSuccess,
		onError: (error) => {
			toast.error(
				tI18n("WorkspacesPage.batchActions.failed_to_stop_workspaces_e9878454"),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	const deleteAllMutation = useMutation({
		mutationFn: (workspaces: readonly Workspace[]) => {
			return Promise.all(workspaces.map((w) => API.deleteWorkspace(w.id)));
		},
		onSuccess,
		onError: (error) => {
			toast.error(
				tI18n(
					"WorkspacesPage.batchActions.failed_to_delete_some_workspaces_8cb8a270",
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	const updateAllMutation = useMutation({
		mutationFn: (payload: UpdateAllPayload) => {
			const { workspaces } = payload;
			return Promise.all(
				workspaces
					.filter((w) => w.outdated && !w.dormant_at)
					.map((w) => API.updateWorkspace(w)),
			);
		},
		onSuccess,
		onError: (error) => {
			toast.error(
				tI18n(
					"WorkspacesPage.batchActions.failed_to_update_some_workspaces_4f7e5b1b",
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	// Not a great idea to return the promises from the Promise.all calls below
	// because that then gives you a void array, which doesn't make sense with
	// TypeScript's type system. Best to await them, and then have the wrapper
	// mutation function return its own void promise

	const favoriteAllMutation = useMutation({
		mutationFn: async (workspaces: readonly Workspace[]): Promise<void> => {
			await Promise.all(
				workspaces
					.filter((w) => !w.favorite)
					.map((w) => API.putFavoriteWorkspace(w.id)),
			);
		},
		onSuccess,
		onError: (error) => {
			toast.error(
				tI18n(
					"WorkspacesPage.batchActions.failed_to_favorite_some_workspaces_ee9e28d9",
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	const unfavoriteAllMutation = useMutation({
		mutationFn: async (workspaces: readonly Workspace[]): Promise<void> => {
			await Promise.all(
				workspaces
					.filter((w) => w.favorite)
					.map((w) => API.deleteFavoriteWorkspace(w.id)),
			);
		},
		onSuccess,
		onError: (error) => {
			toast.error(
				tI18n(
					"WorkspacesPage.batchActions.failed_to_unfavorite_some_workspaces_fca4023a",
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	return {
		favorite: favoriteAllMutation.mutateAsync,
		unfavorite: unfavoriteAllMutation.mutateAsync,
		start: startAllMutation.mutateAsync,
		stop: stopAllMutation.mutateAsync,
		delete: deleteAllMutation.mutateAsync,
		updateTemplateVersions: updateAllMutation.mutateAsync,
		isProcessing:
			favoriteAllMutation.isPending ||
			unfavoriteAllMutation.isPending ||
			startAllMutation.isPending ||
			stopAllMutation.isPending ||
			deleteAllMutation.isPending ||
			updateAllMutation.isPending,
	};
}
