import { useTranslation } from "react-i18next";
import {
	Sidebar as BaseSidebar,
	SettingsSidebarNavItem,
} from "#/components/Sidebar/Sidebar";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { getPrereleaseFlag } from "#/utils/buildInfo";

export const Sidebar: React.FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { entitlements, experiments, buildInfo } = useDashboard();
	const showSchedulePage =
		entitlements.features.advanced_template_scheduling.enabled;
	const showOAuth2Page =
		experiments.includes("oauth2") || getPrereleaseFlag(buildInfo) === "devel";

	return (
		<BaseSidebar>
			<div className="flex flex-col gap-1">
				<SettingsSidebarNavItem href="account">
					{tI18n("UserSettingsPage.Sidebar.account_7e1b0d56")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="appearance">
					{tI18n("UserSettingsPage.Sidebar.appearance_3907fa7f")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="external-auth">
					{tI18n("UserSettingsPage.Sidebar.external_authentication_1b308ef4")}
				</SettingsSidebarNavItem>
				{showOAuth2Page && (
					<SettingsSidebarNavItem href="oauth2-provider">
						{tI18n("UserSettingsPage.Sidebar.oauth2_applications_e740eaa0")}
					</SettingsSidebarNavItem>
				)}
				{showSchedulePage && (
					<SettingsSidebarNavItem href="schedule">
						{tI18n("UserSettingsPage.Sidebar.schedule_f4830a1d")}
					</SettingsSidebarNavItem>
				)}
				<SettingsSidebarNavItem href="security">
					{tI18n("UserSettingsPage.Sidebar.security_8f6fb4eb")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="ssh-keys">
					{tI18n("UserSettingsPage.Sidebar.ssh_keys_d9f38df9")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="tokens">
					{tI18n("UserSettingsPage.Sidebar.tokens_a039dfb9")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="secrets">
					{tI18n("UserSettingsPage.Sidebar.secrets_d8707d41")}
				</SettingsSidebarNavItem>
				<SettingsSidebarNavItem href="notifications">
					{tI18n("UserSettingsPage.Sidebar.notifications_78801183")}
				</SettingsSidebarNavItem>
			</div>
		</BaseSidebar>
	);
};
