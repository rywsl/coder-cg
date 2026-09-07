import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { WorkspaceSettingsForm } from "./WorkspaceSettingsForm";

type WorkspaceSettingsPageViewProps = {
	error: unknown;
	workspace: Workspace;
	onCancel: () => void;
	onSubmit: ComponentProps<typeof WorkspaceSettingsForm>["onSubmit"];
};

export const WorkspaceSettingsPageView: FC<WorkspaceSettingsPageViewProps> = ({
	onCancel,
	onSubmit,
	error,
	workspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<div className="flex flex-col gap-12">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSettingsPageView.general_c910d474",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSettingsPageView.update_the_name_and_automatic_update_behavior_fo_ccf9f3ef",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<WorkspaceSettingsForm
				error={error}
				workspace={workspace}
				onCancel={onCancel}
				onSubmit={onSubmit}
			/>
		</div>
	);
};
