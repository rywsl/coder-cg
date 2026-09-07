import { BugIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import { TopbarButton } from "#/components/FullPageLayout/Topbar";
import { BuildParametersPopover } from "./BuildParametersPopover";
import type { ActionButtonProps } from "./Buttons";

type DebugButtonProps = Omit<ActionButtonProps, "loading"> & {
	workspace: Workspace;
	enableBuildParameters: boolean;
};

export const DebugButton: FC<DebugButtonProps> = ({
	handleAction,
	workspace,
	enableBuildParameters,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const mainAction = (
		<TopbarButton onClick={() => handleAction()}>
			<BugIcon />
			{tI18n("WorkspacePage.WorkspaceActions.DebugButton.debug_1a03bd2f")}
		</TopbarButton>
	);

	if (!enableBuildParameters) {
		return mainAction;
	}

	return (
		<div className="flex gap-1 items-center">
			{mainAction}
			<BuildParametersPopover
				label={tI18n(
					"WorkspacePage.WorkspaceActions.DebugButton.debug_with_build_parameters_6fbabb34",
				)}
				workspace={workspace}
			/>
		</div>
	);
};
