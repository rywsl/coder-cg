import { EllipsisVerticalIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { User } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import type { UserAdminAction } from "./UserActionDialogs";

type UserMoreActionsProps = {
	user: User;
	me: string;
	onAction: (action: UserAdminAction) => void;
	canViewActivity?: boolean;
	oidcRoleSyncEnabled?: boolean;
};

export const UserMoreActions: FC<UserMoreActionsProps> = ({
	user,
	me,
	onAction,
	canViewActivity,
	oidcRoleSyncEnabled,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="icon-lg"
					variant="subtle"
					type="button"
					aria-label={tI18n("users.UserMoreActions.open_menu_b40b3713")}
				>
					<EllipsisVerticalIcon aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Link
						to={`/workspaces?filter=${encodeURIComponent(`owner:${user.username}`)}`}
					>
						{tI18n("users.UserMoreActions.view_workspaces_8cf7e8d0")}
					</Link>
				</DropdownMenuItem>

				{canViewActivity && (
					<DropdownMenuItem asChild>
						<Link
							to={`/audit?filter=${encodeURIComponent(`username:${user.username}`)}`}
						>
							{tI18n("users.UserMoreActions.view_activity_4bf3f8dd")}
						</Link>
					</DropdownMenuItem>
				)}

				<DropdownMenuItem asChild>
					<Link to={user.username}>
						{tI18n("users.UserMoreActions.edit_464c4ffd")}
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem
					disabled={user.login_type === "oidc" && oidcRoleSyncEnabled}
					onClick={() => onAction({ type: "editRoles", user })}
				>
					{tI18n("users.UserMoreActions.edit_roles_3b3489d0")}
				</DropdownMenuItem>

				{user.status !== "suspended" && (
					<DropdownMenuItem
						disabled={user.login_type !== "password"}
						onClick={() => onAction({ type: "resetPassword", user })}
					>
						{tI18n("users.UserMoreActions.reset_password_d220a78f")}
					</DropdownMenuItem>
				)}

				{user.status === "active" || user.status === "dormant" ? (
					<DropdownMenuItem onClick={() => onAction({ type: "suspend", user })}>
						{tI18n("users.UserMoreActions.suspend_bfdb01ed")}
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem
						onClick={() => onAction({ type: "activate", user })}
					>
						{tI18n("users.UserMoreActions.activate_9778eceb")}
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />

				<DropdownMenuItem
					className="text-content-destructive focus:text-content-destructive"
					onClick={() => onAction({ type: "delete", user })}
					disabled={user.id === me}
				>
					<TrashIcon className="size-icon-xs" />
					{tI18n("users.UserMoreActions.delete_9ce78fe3")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
