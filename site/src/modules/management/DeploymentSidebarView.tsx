import { ArrowUpRightIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { BuildInfoResponse, Experiment } from "#/api/typesGenerated";
import { PREMIUM_PAGE_PATH } from "#/components/Paywall/Paywall";
import {
	Sidebar as BaseSidebar,
	SettingsSidebarNavItem as SidebarNavItem,
} from "#/components/Sidebar/Sidebar";
import type { Permissions } from "#/modules/permissions";
import { getPrereleaseFlag } from "#/utils/buildInfo";

interface DeploymentSidebarViewProps {
	/** Site-wide permissions. */
	permissions: Permissions;
	showOrganizations: boolean;
	hidePremiumTab: boolean;
	experiments: Experiment[];
	buildInfo: BuildInfoResponse;
}

/**
 * Displays navigation for deployment settings.  If active, highlight the main
 * menu heading.
 */
export const DeploymentSidebarView: FC<DeploymentSidebarViewProps> = ({
	permissions,
	showOrganizations,
	hidePremiumTab,
	experiments,
	buildInfo,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<BaseSidebar>
			<div className="flex flex-col gap-1">
				{permissions.viewDeploymentConfig && (
					<SidebarNavItem href="/deployment/overview">
						{tI18n("management.DeploymentSidebarView.overview_d4b1ea57")}
					</SidebarNavItem>
				)}
				{permissions.viewAllLicenses && (
					<SidebarNavItem href="/deployment/licenses">
						{tI18n("management.DeploymentSidebarView.licenses_6d5d9004")}
					</SidebarNavItem>
				)}
				{permissions.editDeploymentConfig && (
					<SidebarNavItem href="/deployment/appearance">
						{tI18n("management.DeploymentSidebarView.appearance_3907fa7f")}
					</SidebarNavItem>
				)}
				{permissions.viewDeploymentConfig && (
					<SidebarNavItem href="/deployment/userauth">
						{tI18n(
							"management.DeploymentSidebarView.user_authentication_35610171",
						)}
					</SidebarNavItem>
				)}
				{permissions.viewDeploymentConfig && (
					<SidebarNavItem href="/deployment/external-auth">
						{tI18n(
							"management.DeploymentSidebarView.external_authentication_1b308ef4",
						)}
					</SidebarNavItem>
				)}
				{permissions.viewDeploymentConfig &&
					(experiments.includes("oauth2") ||
						getPrereleaseFlag(buildInfo) === "devel") && (
						<SidebarNavItem href="/deployment/oauth2-provider/apps">
							{tI18n(
								"management.DeploymentSidebarView.oauth2_applications_e740eaa0",
							)}
						</SidebarNavItem>
					)}
				{permissions.viewDeploymentConfig && (
					<SidebarNavItem href="/deployment/network">
						{tI18n("management.DeploymentSidebarView.network_1744b964")}
					</SidebarNavItem>
				)}
				{permissions.readWorkspaceProxies && (
					<SidebarNavItem href="/deployment/workspace-proxies">
						{tI18n(
							"management.DeploymentSidebarView.workspace_proxies_62ee3d16",
						)}
					</SidebarNavItem>
				)}
				{permissions.viewDeploymentConfig && (
					<SidebarNavItem href="/deployment/security">
						{tI18n("management.DeploymentSidebarView.security_8f6fb4eb")}
					</SidebarNavItem>
				)}
				{permissions.viewDeploymentConfig && (
					<SidebarNavItem href="/deployment/observability">
						{tI18n("management.DeploymentSidebarView.observability_a37c9310")}
					</SidebarNavItem>
				)}

				{permissions.viewAllUsers && (
					<SidebarNavItem href="/deployment/users">
						{tI18n("management.DeploymentSidebarView.users_6b0cc904")}
					</SidebarNavItem>
				)}
				{permissions.viewAnyGroup && (
					<SidebarNavItem href="/deployment/groups">
						<div className="flex flex-row items-center gap-1">
							{tI18n("management.DeploymentSidebarView.groups_ffcf21b5")}
							{showOrganizations && <ArrowUpRightIcon size={16} />}
						</div>
					</SidebarNavItem>
				)}
				{permissions.viewOrganizationIDPSyncSettings && (
					<SidebarNavItem href="/deployment/idp-org-sync">
						{tI18n(
							"management.DeploymentSidebarView.idp_organization_sync_9d6641db",
						)}
					</SidebarNavItem>
				)}
				{permissions.viewNotificationTemplate && (
					<SidebarNavItem href="/deployment/notifications">
						<div className="flex flex-row items-center gap-2">
							<span>
								{tI18n(
									"management.DeploymentSidebarView.notifications_78801183",
								)}
							</span>
						</div>
					</SidebarNavItem>
				)}
				{!hidePremiumTab && (
					<SidebarNavItem href={PREMIUM_PAGE_PATH}>
						{tI18n("management.DeploymentSidebarView.trial_upgrade_ee470e67")}
					</SidebarNavItem>
				)}
			</div>
		</BaseSidebar>
	);
};
