import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverLink,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
} from "#/components/HelpPopover/HelpPopover";
import { docs } from "#/utils/docs";

export const RolesHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger size="small" />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n("users.UserHelpPopovers.what_is_a_role_84804555")}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"users.UserHelpPopovers.coder_role_based_access_control_rbac_provides_fi_54881386",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/admin/users/groups-roles")}>
						{tI18n("users.UserHelpPopovers.user_roles_d729ab99")}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};

export const GroupsHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger size="small" />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n("users.UserHelpPopovers.what_is_a_group_778ba59d")}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"users.UserHelpPopovers.groups_can_be_used_with_template_rbac_to_give_gr_beb396f6",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/admin/users/groups-roles")}>
						{tI18n("users.UserHelpPopovers.groups_39bbb719")}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
