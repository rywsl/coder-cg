import { InfoIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
export const LastConnectionHead: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-content-secondary">
			{tI18n(
				"OrganizationSettingsPage.OrganizationProvisionersPage.LastConnectionHead.last_connection_edd579c2",
			)}
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="flex items-center">
						<span className="sr-only">
							{tI18n(
								"OrganizationSettingsPage.OrganizationProvisionersPage.LastConnectionHead.more_info_7dd4d97d",
							)}
						</span>
						<InfoIcon
							tabIndex={0}
							className="cursor-pointer size-icon-xs p-0.5"
						/>
					</span>
				</TooltipTrigger>
				<TooltipContent className="max-w-xs">
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.LastConnectionHead.last_time_the_provisioner_connected_to_the_contr_851e8139",
					)}
				</TooltipContent>
			</Tooltip>
		</span>
	);
};
