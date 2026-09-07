import { InfoIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { currentIntlLocale } from "#/i18n/locale";

type CoderWorkspacesProductCardProps = {
	userLimitActual?: number;
	userLimitLimit?: number;
};

export const CoderWorkspacesProductCard: FC<
	CoderWorkspacesProductCardProps
> = ({ userLimitActual, userLimitLimit }) => {
	const { t: tI18n } = useTranslation("administration");

	const actualLabel =
		userLimitActual === undefined
			? "\u2014"
			: userLimitActual.toLocaleString(currentIntlLocale());
	const limitLabel = userLimitLimit
		? userLimitLimit.toLocaleString(currentIntlLocale())
		: tI18n(
				"DeploymentSettingsPage.LicensesSettingsPage.CoderWorkspacesProductCard.unlimited_11dde17d",
			);

	return (
		<div className="min-w-[320px] flex-1 rounded-sm border border-solid border-border px-6 py-4">
			<div className="text-sm font-medium text-content-primary">
				{tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.CoderWorkspacesProductCard.coder_workspaces_fb3853a7",
				)}
			</div>
			<div className="mt-3 text-xs">
				<div className="flex items-center gap-1 font-medium text-content-secondary">
					<span>
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderWorkspacesProductCard.active_seat_usage_4ad8cf3a",
						)}
					</span>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label={tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.CoderWorkspacesProductCard.active_seat_usage_information_28a4cd11",
								)}
								className="m-0 inline-flex appearance-none border-0 bg-transparent p-0 text-content-secondary"
							>
								<InfoIcon className="size-3" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="top" className="max-w-xs">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.CoderWorkspacesProductCard.only_active_user_accounts_consume_license_seats__a879c4d0",
							)}
						</TooltipContent>
					</Tooltip>
				</div>
				<div className="mt-0.5 text-sm font-medium text-content-primary">
					{actualLabel} / {limitLabel}
				</div>
			</div>
		</div>
	);
};
