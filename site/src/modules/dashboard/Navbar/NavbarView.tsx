import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import { API } from "#/api/api";
import type * as TypesGen from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { ProductLogo } from "#/components/Icons/ProductLogo";
import { NotificationsInbox } from "#/modules/notifications/NotificationsInbox/NotificationsInbox";
import {
	type AdminSettingsPermissions,
	canViewAdminSettings,
} from "./AdminSettings";
import { AdminSettingsDropdown } from "./DeploymentDropdown";
import { MobileMenu } from "./MobileMenu";
import { SupportIcon } from "./SupportIcon";
import { UserDropdown } from "./UserDropdown/UserDropdown";

interface NavbarViewProps {
	user: TypesGen.User;
	buildInfo?: TypesGen.BuildInfoResponse;
	supportLinks: readonly TypesGen.LinkConfig[];
	codernautsEnabled?: boolean;
	onSignOut: () => void;
	adminPermissions: AdminSettingsPermissions;
	canCreateChat: boolean;
}

const linkStyles = {
	default:
		"text-sm font-medium text-content-secondary no-underline block h-full px-2 flex items-center hover:text-content-primary transition-colors",
	active: "text-content-primary",
};

export const NavbarView: FC<NavbarViewProps> = ({
	user,
	buildInfo,
	supportLinks,
	codernautsEnabled,
	onSignOut,
	adminPermissions,
	canCreateChat,
}) => {
	return (
		<div className="sticky top-0 bg-surface-primary z-40 border-0 border-b border-solid h-[72px] min-h-[72px] flex items-center leading-none px-6">
			<NavLink to="/workspaces">
				<ProductLogo className="h-7" />
			</NavLink>

			<NavItems className="ml-4 hidden md:flex" canCreateChat={canCreateChat} />

			<div className="flex items-center gap-3 ml-auto">
				{supportLinks.filter(isNavbarLink).map((link) => (
					<div key={link.name} className="hidden md:block">
						<SupportButton
							name={link.name}
							target={link.target}
							icon={link.icon}
						/>
					</div>
				))}

				{canViewAdminSettings(adminPermissions) && (
					<div className="hidden md:block">
						<AdminSettingsDropdown permissions={adminPermissions} />
					</div>
				)}

				<NotificationsInbox
					fetchNotifications={API.getInboxNotifications}
					markAllAsRead={API.markAllInboxNotificationsAsRead}
					markNotificationAsRead={(notificationId) =>
						API.updateInboxNotificationReadStatus(notificationId, {
							is_read: true,
						})
					}
				/>

				<div className="hidden md:block">
					<UserDropdown
						user={user}
						buildInfo={buildInfo}
						supportLinks={supportLinks?.filter((link) => !isNavbarLink(link))}
						codernautsEnabled={codernautsEnabled}
						onSignOut={onSignOut}
					/>
				</div>

				<div className="md:hidden">
					<MobileMenu
						adminPermissions={adminPermissions}
						user={user}
						supportLinks={supportLinks}
						onSignOut={onSignOut}
					/>
				</div>
			</div>
		</div>
	);
};

interface NavItemsProps {
	className?: string;
	canCreateChat: boolean;
}

const NavItems: FC<NavItemsProps> = ({ className, canCreateChat }) => {
	const { t: tI18n } = useTranslation("dashboard");

	const location = useLocation();

	return (
		<nav className={cn("flex items-center gap-4 h-full", className)}>
			<NavLink
				className={({ isActive }) => {
					if (location.pathname.startsWith("/@")) {
						isActive = true;
					}
					return cn(linkStyles.default, { [linkStyles.active]: isActive });
				}}
				to="/workspaces"
			>
				{tI18n("dashboard.Navbar.NavbarView.workspaces_1377264b")}
			</NavLink>
			<NavLink
				className={({ isActive }) => {
					return cn(linkStyles.default, { [linkStyles.active]: isActive });
				}}
				to="/templates"
			>
				{tI18n("dashboard.Navbar.NavbarView.templates_56b564b7")}
			</NavLink>
			{canCreateChat && (
				<NavLink
					className={({ isActive }) => {
						return cn(linkStyles.default, { [linkStyles.active]: isActive });
					}}
					to="/agents"
				>
					{tI18n("dashboard.Navbar.NavbarView.agents_279b44d2")}
				</NavLink>
			)}
		</nav>
	);
};

function isNavbarLink(link: TypesGen.LinkConfig): boolean {
	return link.location === "navbar";
}

interface SupportButtonProps {
	name: string;
	target: string;
	icon: string;
	location?: string;
}

const SupportButton: FC<SupportButtonProps> = ({ name, target, icon }) => {
	const { t: tI18n } = useTranslation("dashboard");

	return (
		<Button asChild variant="outline">
			<a
				href={target}
				target="_blank"
				rel="noreferrer"
				className="inline-block"
			>
				{icon && <SupportIcon icon={icon} className="text-content-secondary" />}
				{name}
				<span className="sr-only">
					{tI18n("dashboard.Navbar.NavbarView.link_opens_in_new_tab_20897869")}
				</span>
			</a>
		</Button>
	);
};
