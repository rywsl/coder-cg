import { TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { StatusIndicator } from "#/components/StatusIndicator/StatusIndicator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";

type ProvisionerVersionProps = {
	buildVersion: string | undefined;
	provisionerVersion: string;
};

export const ProvisionerVersion: FC<ProvisionerVersionProps> = ({
	provisionerVersion,
	buildVersion,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return provisionerVersion === buildVersion ? (
		<span className="text-xs font-medium text-content-secondary">
			{tI18n(
				"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerVersion.up_to_date_ce29b7f8",
			)}
		</span>
	) : (
		<Tooltip>
			<TooltipTrigger asChild>
				<StatusIndicator
					variant="warning"
					size="sm"
					className="cursor-pointer"
					tabIndex={0}
				>
					<TriangleAlertIcon className="size-icon-xs" />
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerVersion.outdated_c759f42e",
					)}
				</StatusIndicator>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs">
				<p className="m-0">
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerVersion.this_provisioner_is_out_of_date_you_may_experien_97659d73",
					)}
				</p>
			</TooltipContent>
		</Tooltip>
	);
};
