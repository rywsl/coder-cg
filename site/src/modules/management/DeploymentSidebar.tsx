import type { FC } from "react";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { DeploymentSidebarView } from "./DeploymentSidebarView";

/**
 * A sidebar for deployment settings.
 */
export const DeploymentSidebar: FC = () => {
	const { permissions } = useAuthenticated();
	const { experiments, buildInfo } = useDashboard();

	return (
		<DeploymentSidebarView
			permissions={permissions}
			experiments={experiments}
			buildInfo={buildInfo}
		/>
	);
};
