import type { FC } from "react";
import { Sidebar as BaseSidebar } from "#/components/Sidebar/Sidebar";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { OrganizationSidebarView } from "./OrganizationSidebarView";

/**
 * Sidebar for the OrganizationSettingsLayout
 */
export const OrganizationSidebar: FC = () => {
	const { organizations, organization, organizationPermissions } =
		useOrganizationSettings();

	return (
		<BaseSidebar>
			<OrganizationSidebarView
				activeOrganization={organization}
				orgPermissions={organizationPermissions}
				organizations={organizations}
			/>
		</BaseSidebar>
	);
};
