import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { UserDropdownContent } from "./UserDropdownContent";

interface UserDropdownProps {
	user: TypesGen.User;
	buildInfo?: TypesGen.BuildInfoResponse;
	supportLinks: readonly TypesGen.LinkConfig[];
	codernautsEnabled?: boolean;
	onSignOut: () => void;
}

export const UserDropdown: FC<UserDropdownProps> = ({
	buildInfo,
	user,
	supportLinks,
	codernautsEnabled,
	onSignOut,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={tI18n(
						"dashboard.Navbar.UserDropdown.UserDropdown.user_menu_6fa25be1",
					)}
					className="relative bg-transparent border-0 cursor-pointer p-0"
				>
					<Avatar fallback={user.username} src={user.avatar_url} size="lg" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[260px]">
				<UserDropdownContent
					user={user}
					buildInfo={buildInfo}
					supportLinks={supportLinks}
					codernautsEnabled={codernautsEnabled}
					onSignOut={onSignOut}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
