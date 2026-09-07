import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { GetLicensesResponse } from "#/api/api";
import type { Feature } from "#/api/typesGenerated";
import { Link } from "#/components/Link/Link";
import {
	effectiveAiGovernanceLimitForUsageCard,
	hasAiGovernanceAddOnLicense,
} from "./AIGovernanceLicensing";
import { SeatUsageBarCard } from "./SeatUsageBarCard";

interface AIGovernanceUsersConsumptionProps {
	aiGovernanceUserFeature?: Feature;
	licenses?: GetLicensesResponse[];
}

export const AIGovernanceUsersConsumption: FC<
	AIGovernanceUsersConsumptionProps
> = ({ aiGovernanceUserFeature, licenses }) => {
	const { t: tI18n } = useTranslation("administration");

	const hasAddOnLicense = hasAiGovernanceAddOnLicense(
		licenses,
		aiGovernanceUserFeature,
	);
	const effectiveLimit = effectiveAiGovernanceLimitForUsageCard(
		aiGovernanceUserFeature,
		licenses,
	);

	const showUsageBar =
		aiGovernanceUserFeature?.enabled === true ||
		(hasAddOnLicense && effectiveLimit !== undefined);

	if (!showUsageBar) {
		return (
			<div className="flex items-center justify-center rounded-lg border border-solid p-4">
				<div className="flex flex-col items-center justify-center">
					<div className="flex flex-col items-center justify-center">
						<span className="text-base">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.AIGovernanceUsersConsumptionChart.ai_governance_add_on_usage_427fb023",
							)}
						</span>
						<span className="text-content-secondary text-center max-w-[464px] mt-2">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.AIGovernanceUsersConsumptionChart.ai_governance_is_not_included_in_your_current_li_359c1b00",
							)}{" "}
							<Link href="mailto:sales@coder.com">
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.AIGovernanceUsersConsumptionChart.sales_e04eb290",
								)}
							</Link>
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.AIGovernanceUsersConsumptionChart.to_upgrade_your_license_and_unlock_this_addon_2626d87b",
							)}
						</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<SeatUsageBarCard
			title={tI18n(
				"DeploymentSettingsPage.LicensesSettingsPage.AIGovernanceUsersConsumptionChart.ai_governance_add_on_usage_427fb023",
			)}
			actual={aiGovernanceUserFeature?.actual}
			limit={effectiveLimit}
		/>
	);
};
