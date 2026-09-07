import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { CONTACT_SALES_LINK } from "#/modules/licenses/trialLicense";

interface TrialActivePanelProps {
	daysRemaining: number | undefined;
}

export const TrialActivePanel: FC<TrialActivePanelProps> = ({
	daysRemaining,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const showRemaining = daysRemaining !== undefined && daysRemaining > 0;

	return (
		<div className="flex flex-col items-center gap-6 text-center max-w-md">
			{showRemaining ? (
				<div className="flex flex-col gap-2">
					<h1 className="m-0 font-semibold text-3xl text-content-primary">
						{daysRemaining}{" "}
						{daysRemaining === 1
							? tI18n(
									"DeploymentSettingsPage.PremiumPage.TrialActivePanel.day_944c27e5",
								)
							: tI18n(
									"DeploymentSettingsPage.PremiumPage.TrialActivePanel.days_ab51004e",
								)}
						{tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialActivePanel.remaining_62fc42d5",
						)}
					</h1>
				</div>
			) : null}
			<p className="m-0 px-8 text-sm text-content-primary">
				{tI18n(
					"DeploymentSettingsPage.PremiumPage.TrialActivePanel.contact_our_sales_team_to_extend_your_trial_6d9c8781",
				)}
			</p>
			<Button asChild className="w-full">
				<a href={CONTACT_SALES_LINK} target="_blank" rel="noreferrer">
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialActivePanel.contact_sales_604abea3",
					)}
				</a>
			</Button>
		</div>
	);
};
