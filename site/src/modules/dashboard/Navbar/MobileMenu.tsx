import { cn } from "cn";
import { ChevronRightIcon, MenuIcon, XIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import {
	AdminSettingsItems,
	type AdminSettingsPermissions,
	canViewAdminSettings,
} from "./AdminSettings";

const itemStyles = {
	default: "px-9 h-10 no-underline",
	sub: "pl-12",
	open: "text-content-primary",
};

type MobileMenuProps = {
	adminPermissions: AdminSettingsPermissions;
	user?: TypesGen.User;
	supportLinks?: readonly TypesGen.LinkConfig[];
	onSignOut: () => void;
	isDefaultOpen?: boolean; // Useful for storybook
};

export const MobileMenu: FC<MobileMenuProps> = ({
	adminPermissions,
	user,
	supportLinks,
	onSignOut,
	isDefaultOpen,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	const [open, setOpen] = useState(isDefaultOpen);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			{open && (
				<div className="fixed inset-0 top-[72px] z-10 bg-surface-primary" />
			)}
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={
						open
							? tI18n("dashboard.Navbar.MobileMenu.close_menu_6ccd5c78")
							: tI18n("dashboard.Navbar.MobileMenu.open_menu_b40b3713")
					}
					size="icon-lg"
					variant="subtle"
				>
					{open ? <XIcon /> : <MenuIcon />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-screen border-0 border-b border-solid p-0 py-2"
				sideOffset={17}
			>
				<DropdownMenuItem asChild className={itemStyles.default}>
					<Link to="/workspaces">
						{tI18n("dashboard.Navbar.MobileMenu.workspaces_1377264b")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className={itemStyles.default}>
					<Link to="/templates">
						{tI18n("dashboard.Navbar.MobileMenu.templates_56b564b7")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className={itemStyles.default}>
					<Link to="/agents">
						{tI18n("dashboard.Navbar.MobileMenu.agents_279b44d2")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{canViewAdminSettings(adminPermissions) && (
					<>
						<DropdownMenuSeparator />
						<AdminSettingsSub permissions={adminPermissions} />
					</>
				)}
				<DropdownMenuSeparator />
				<UserSettingsSub
					user={user}
					supportLinks={supportLinks}
					onSignOut={onSignOut}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

type AdminSettingsSubProps = {
	permissions: AdminSettingsPermissions;
};

const AdminSettingsSub: FC<AdminSettingsSubProps> = ({ permissions }) => {
	const { t: tI18n } = useTranslation("dashboard");

	const [open, setOpen] = useState(false);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger asChild>
				<DropdownMenuItem
					className={cn(itemStyles.default, open && itemStyles.open)}
					onClick={(e) => {
						e.preventDefault();
						setOpen((prev) => !prev);
					}}
				>
					{tI18n("dashboard.Navbar.MobileMenu.admin_settings_502d9f3e")}
					<ChevronRightIcon
						className={cn("ml-auto", open ? "rotate-90" : "")}
					/>
				</DropdownMenuItem>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<AdminSettingsItems
					itemClassName={cn(itemStyles.default, itemStyles.sub)}
					permissions={permissions}
				/>
			</CollapsibleContent>
		</Collapsible>
	);
};

type UserSettingsSubProps = {
	user?: TypesGen.User;
	supportLinks?: readonly TypesGen.LinkConfig[];
	onSignOut: () => void;
};

const UserSettingsSub: FC<UserSettingsSubProps> = ({
	user,
	supportLinks,
	onSignOut,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	const [open, setOpen] = useState(false);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger asChild>
				<DropdownMenuItem
					className={cn(itemStyles.default, open && itemStyles.open)}
					onClick={(e) => {
						e.preventDefault();
						setOpen((prev) => !prev);
					}}
				>
					<Avatar
						src={user?.avatar_url}
						fallback={user?.name || user?.username}
					/>
					{tI18n("dashboard.Navbar.MobileMenu.user_settings_2b363e87")}
					<ChevronRightIcon
						className={cn("ml-auto", open ? "rotate-90" : "")}
					/>
				</DropdownMenuItem>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<DropdownMenuItem
					asChild
					className={cn(itemStyles.default, itemStyles.sub)}
				>
					<Link to="/settings/account">
						{tI18n("dashboard.Navbar.MobileMenu.account_7e1b0d56")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					className={cn(itemStyles.default, itemStyles.sub)}
					onClick={onSignOut}
				>
					{tI18n("dashboard.Navbar.MobileMenu.sign_out_48f0d3d3")}
				</DropdownMenuItem>
				{supportLinks && (
					<>
						<DropdownMenuSeparator />
						{supportLinks?.map((l) => (
							<DropdownMenuItem
								key={l.name}
								asChild
								className={cn(itemStyles.default, itemStyles.sub)}
							>
								<a
									href={includeOrigin(l.target)}
									target="_blank"
									rel="noreferrer"
								>
									{l.name}
								</a>
							</DropdownMenuItem>
						))}
					</>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
};

export const includeOrigin = (target: string): string => {
	if (target.startsWith("/")) {
		const baseUrl = location.origin;
		return `${baseUrl}${target}`;
	}
	return target;
};
