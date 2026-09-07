import { RotateCcwIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import { TopbarButton } from "#/components/FullPageLayout/Topbar";
import { BuildParametersPopover } from "./BuildParametersPopover";
import type { ActionButtonProps } from "./Buttons";

type RetryButtonProps = Omit<ActionButtonProps, "loading"> & {
	enableBuildParameters: boolean;
	workspace: Workspace;
};

export const RetryButton: FC<RetryButtonProps> = ({
	handleAction,
	workspace,
	enableBuildParameters,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const mainAction = (
		<TopbarButton onClick={() => handleAction()}>
			<RotateCcwIcon />
			{tI18n("WorkspacePage.WorkspaceActions.RetryButton.retry_942087cc")}
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
					"WorkspacePage.WorkspaceActions.RetryButton.retry_with_build_parameters_bfe80e0f",
				)}
				workspace={workspace}
			/>
		</div>
	);
};
