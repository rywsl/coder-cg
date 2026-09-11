import { cn } from "cn";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useMatch } from "react-router";
import {
	Sidebar as BaseSidebar,
	SettingsSidebarNavItem as SidebarNavItem,
} from "#/components/Sidebar/Sidebar";
import {
	canAccessAnyChatModelConfig,
	type Permissions,
} from "#/modules/permissions";

interface AISettingsSidebarViewProps {
	/** Site-wide permissions. */
	permissions: Permissions;
	canAccessOrganizationModels?: boolean;
	canShareOrganizationMCPServers?: boolean;
}

const SubNavItem: FC<{ href: string; children?: ReactNode }> = ({
	href,
	children,
}) => (
	<NavLink
		to={href}
		className={({ isActive }) =>
			cn(
				"relative -ml-px text-sm text-content-secondary no-underline font-medium py-2 pl-4 pr-3 transition-colors",
				"border-0 border-solid border-l border-l-transparent hover:text-content-primary",
				isActive &&
					"border-l-content-primary font-semibold text-content-primary",
			)
		}
	>
		{children}
	</NavLink>
);

const ModelsSidebarNavItem: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const legacyMatch = useMatch("/ai/settings/models/*");
	const organizationMatch = useMatch(
		"/ai/settings/organizations/:organization/models/*",
	);
	const isActive = legacyMatch !== null || organizationMatch !== null;

	return (
		<Link
			to="/ai/settings/models"
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"relative text-sm text-content-secondary no-underline font-medium py-2 px-3 hover:bg-surface-secondary rounded-md transition ease-in-out duration-150",
				isActive && "font-semibold text-content-primary",
			)}
		>
			{tI18n("management.AISettingsSidebarView.models_d17d2d78")}
		</Link>
	);
};

const AISettingsSidebarView: FC<AISettingsSidebarViewProps> = ({
	permissions,
	canAccessOrganizationModels = false,
	canShareOrganizationMCPServers = false,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<BaseSidebar>
			<div className="flex flex-col gap-1">
				{permissions.viewAnyAIProvider && (
					<SidebarNavItem href="/ai/settings/providers">
						{tI18n("management.AISettingsSidebarView.providers_996c32b3")}
					</SidebarNavItem>
				)}
				{(canAccessAnyChatModelConfig(permissions) ||
					canAccessOrganizationModels) && <ModelsSidebarNavItem />}
				{(permissions.editDeploymentConfig || canAccessOrganizationModels) && (
					<SidebarNavItem href="/ai/settings/coder-agents">
						{tI18n("management.AISettingsSidebarView.coder_agents_19b8e154")}
					</SidebarNavItem>
				)}
				{permissions.editDeploymentConfig && (
					<div className="flex flex-col gap-1 ml-3 border-0 border-solid border-l border-l-border">
						<SubNavItem href="/ai/settings/mcp-servers">
							{tI18n("management.AISettingsSidebarView.mcp_servers_22a7559f")}
						</SubNavItem>
						{permissions.updateAnyTemplate && (
							<SubNavItem href="/ai/settings/templates">
								{tI18n("management.AISettingsSidebarView.templates_56b564b7")}
							</SubNavItem>
						)}
						<SubNavItem href="/ai/settings/instructions">
							{tI18n("management.AISettingsSidebarView.instructions_934652dc")}
						</SubNavItem>
						<SubNavItem href="/ai/settings/lifecycle">
							{tI18n("management.AISettingsSidebarView.lifecycle_46459b1f")}
						</SubNavItem>
					</div>
				)}
				{!permissions.editDeploymentConfig &&
					(permissions.viewAnyMCPServerConfigs ||
						permissions.createAnyMCPServerConfig ||
						permissions.updateAnyMCPServerConfig ||
						permissions.deleteAnyMCPServerConfig ||
						canShareOrganizationMCPServers) && (
						<div className="flex flex-col gap-1 ml-3 border-0 border-solid border-l border-l-border">
							<SubNavItem
								href={
									permissions.viewAnyMCPServerConfigs ||
									permissions.updateAnyMCPServerConfig ||
									permissions.deleteAnyMCPServerConfig ||
									canShareOrganizationMCPServers
										? "/ai/settings/mcp-servers"
										: "/ai/settings/mcp-servers/add"
								}
							>
								{tI18n("management.AISettingsSidebarView.mcp_servers_22a7559f")}
							</SubNavItem>
						</div>
					)}
				{!permissions.editDeploymentConfig && permissions.updateAnyTemplate && (
					<div className="flex flex-col gap-1 ml-3 border-0 border-solid border-l border-l-border">
						<SubNavItem href="/ai/settings/templates">
							{tI18n("management.AISettingsSidebarView.templates_56b564b7")}
						</SubNavItem>
					</div>
				)}
			</div>
		</BaseSidebar>
	);
};

export default AISettingsSidebarView;
