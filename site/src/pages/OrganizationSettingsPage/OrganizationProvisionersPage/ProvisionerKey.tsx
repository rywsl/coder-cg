import { InfoIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	ProvisionerKeyNameBuiltIn,
	ProvisionerKeyNamePSK,
	ProvisionerKeyNameUserAuth,
} from "#/api/typesGenerated";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";

type KeyType = "builtin" | "userAuth" | "psk" | "key";

function getKeyType(name: string) {
	switch (name) {
		case ProvisionerKeyNameBuiltIn:
			return "builtin";
		case ProvisionerKeyNameUserAuth:
			return "userAuth";
		case ProvisionerKeyNamePSK:
			return "psk";
		default:
			return "key";
	}
}

const infoByType: Record<KeyType, ReactNode> = {
	builtin: (
		<>
			{i18n.t(
				"administration:OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerKey.these_provisioners_are_running_as_part_of_a_code_3e7c9509",
			)}{" "}
		</>
	),
	userAuth: (
		<>
			{i18n.t(
				"administration:OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerKey.these_provisioners_are_connected_by_users_using__d84ea7c3",
			)}
			<code>coder</code>{" "}
			{i18n.t(
				"administration:OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerKey.cli_and_are_authorized_by_the_users_credentials__9a2dc3f3",
			)}
		</>
	),
	psk: (
		<>
			{i18n.t(
				"administration:OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerKey.these_provisioners_all_use_pre_shared_key_authen_d38451da",
			)}
		</>
	),
	key: null,
};

type ProvisionerKeyProps = {
	name: string;
};

export const ProvisionerKey: FC<ProvisionerKeyProps> = ({ name }) => {
	const { t: tI18n } = useTranslation("administration");

	const type = getKeyType(name);
	const info = infoByType[type];

	return (
		<span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-content-secondary">
			{name}
			{info && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="flex items-center">
							<span className="sr-only">
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerKey.more_info_7dd4d97d",
								)}
							</span>
							<InfoIcon
								tabIndex={0}
								className="cursor-pointer size-icon-xs p-0.5"
							/>
						</span>
					</TooltipTrigger>
					<TooltipContent className="max-w-xs">
						{infoByType[type]}
					</TooltipContent>
				</Tooltip>
			)}
		</span>
	);
};
