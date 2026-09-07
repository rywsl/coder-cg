import { useTranslation } from "react-i18next";
import {
	Sidebar as BaseSidebar,
	SettingsSidebarNavItem,
} from "#/components/Sidebar/Sidebar";
import { useWorkspaceSettings } from "./useWorkspaceSettings";

export const Sidebar: React.FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	const { permissions } = useWorkspaceSettings();

	return (
		<BaseSidebar>
			<div className="flex flex-col gap-1">
				<SettingsSidebarNavItem end href="">
					{tI18n("WorkspaceSettingsPage.Sidebar.general_c910d474")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="parameters">
					{tI18n("WorkspaceSettingsPage.Sidebar.parameters_e68b36b1")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="schedule">
					{tI18n("WorkspaceSettingsPage.Sidebar.schedule_f4830a1d")}
				</SettingsSidebarNavItem>
				{permissions?.shareWorkspace && (
					<SettingsSidebarNavItem href="sharing">
						{tI18n("WorkspaceSettingsPage.Sidebar.sharing_bbedc70e")}
					</SettingsSidebarNavItem>
				)}
			</div>
		</BaseSidebar>
	);
};
