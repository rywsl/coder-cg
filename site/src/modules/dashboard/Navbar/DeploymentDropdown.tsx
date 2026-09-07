import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import {
	AdminSettingsItems,
	type AdminSettingsPermissions,
} from "./AdminSettings";

type AdminSettingsDropdownProps = { permissions: AdminSettingsPermissions };

export const AdminSettingsDropdown: FC<AdminSettingsDropdownProps> = ({
	permissions,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="lg">
					{tI18n("dashboard.Navbar.DeploymentDropdown.admin_settings_502d9f3e")}
					<ChevronDownIcon className="text-content-primary" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[180px]">
				<nav>
					<AdminSettingsItems permissions={permissions} />
				</nav>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
