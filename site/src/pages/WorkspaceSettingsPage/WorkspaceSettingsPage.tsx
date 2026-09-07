import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { pageTitle } from "#/utils/page";
import { useWorkspaceSettings } from "./useWorkspaceSettings";
import type { WorkspaceSettingsFormValues } from "./WorkspaceSettingsForm";
import { WorkspaceSettingsPageView } from "./WorkspaceSettingsPageView";

const WorkspaceSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	const params = useParams() as {
		workspace: string;
		username: string;
	};
	const workspaceName = params.workspace;
	const username = params.username.replace("@", "");
	const { workspace } = useWorkspaceSettings();
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: async (formValues: WorkspaceSettingsFormValues) => {
			await Promise.all([
				API.patchWorkspace(workspace.id, { name: formValues.name }),
				API.updateWorkspaceAutomaticUpdates(
					workspace.id,
					formValues.automatic_updates,
				),
			]);
		},
		onSuccess: (_, formValues) => {
			toast.success(
				tI18n(
					"WorkspaceSettingsPage.WorkspaceSettingsPage.workspace_value0_updated_successfully_e1979094",
					{
						value0: formValues.name,
					},
				),
			);
			navigate(`/@${username}/${formValues.name}/settings`);
		},
	});

	return (
		<>
			<title>
				{pageTitle(
					workspaceName,
					tI18n(
						"WorkspaceSettingsPage.WorkspaceSettingsPage.settings_74a883a0",
					),
				)}
			</title>
			<WorkspaceSettingsPageView
				error={mutation.error}
				workspace={workspace}
				onCancel={() => navigate(`/@${username}/${workspaceName}`)}
				onSubmit={mutation.mutateAsync}
			/>
		</>
	);
};

export default WorkspaceSettingsPage;
