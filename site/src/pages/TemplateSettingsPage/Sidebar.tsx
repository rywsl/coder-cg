import { useTranslation } from "react-i18next";
import {
	Sidebar as BaseSidebar,
	SettingsSidebarNavItem,
} from "#/components/Sidebar/Sidebar";

export const Sidebar: React.FC = () => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<BaseSidebar>
			<div className="flex flex-col gap-1">
				<SettingsSidebarNavItem end href="">
					{tI18n("TemplateSettingsPage.Sidebar.general_c910d474")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="permissions">
					{tI18n("TemplateSettingsPage.Sidebar.permissions_abccc78c")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="variables">
					{tI18n("TemplateSettingsPage.Sidebar.variables_02db55ba")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="parameters">
					{tI18n("TemplateSettingsPage.Sidebar.parameters_e68b36b1")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="schedule">
					{tI18n("TemplateSettingsPage.Sidebar.schedule_f4830a1d")}
				</SettingsSidebarNavItem>
			</div>
		</BaseSidebar>
	);
};
