import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { Alert } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";

interface WorkspaceDeletedBannerProps {
	createWorkspaceLink: string;
	templateName: string;
}

export const WorkspaceDeletedBanner: FC<WorkspaceDeletedBannerProps> = ({
	createWorkspaceLink,
	templateName,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const createWorkspaceButton = (
		<Button asChild size="sm">
			<RouterLink to={createWorkspaceLink}>
				{tI18n(
					"WorkspacePage.WorkspaceDeletedBanner.create_another_from_ce2e7d95",
				)}
				{templateName}
			</RouterLink>
		</Button>
	);

	return (
		<Alert severity="warning" prominent actions={createWorkspaceButton}>
			{tI18n(
				"WorkspacePage.WorkspaceDeletedBanner.this_workspace_has_been_deleted_7c935851",
			)}
		</Alert>
	);
};
