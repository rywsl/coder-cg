import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { UsageBar } from "#/components/UsageBar/UsageBar";
import {
	formatSpendPeriodLabel,
	getSeverity,
	usageProgressPercentage,
} from "#/utils/budget";
import { formatBudgetUSD } from "#/utils/currency";

interface UserDropdownAISpendProps {
	currentSpend: number;
	/** A null limit means unlimited. */
	spendLimit: number | null;
	periodStart: string;
	periodEnd: string;
}

export const UserDropdownAISpend: FC<UserDropdownAISpendProps> = ({
	currentSpend,
	spendLimit,
	periodStart,
	periodEnd,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	return (
		<div className="px-2 py-2">
			<div className="whitespace-nowrap text-sm text-content-primary">
				{formatBudgetUSD(currentSpend)}{" "}
				<span className="text-content-secondary">
					/{" "}
					{spendLimit === null
						? tI18n(
								"dashboard.Navbar.UserDropdown.UserDropdownAISpend.unlimited_11dde17d",
							)
						: formatBudgetUSD(spendLimit)}{" "}
					{tI18n(
						"dashboard.Navbar.UserDropdown.UserDropdownAISpend.usd_a26cdf3a",
					)}
				</span>
			</div>
			{spendLimit !== null && (
				<UsageBar
					ariaLabel={tI18n(
						"dashboard.Navbar.UserDropdown.UserDropdownAISpend.ai_spend_usage_61191cb0",
					)}
					percent={usageProgressPercentage(currentSpend, spendLimit)}
					severity={getSeverity(currentSpend, spendLimit)}
					className="mt-2 h-2.5"
				/>
			)}
			<div className="mt-1 text-xs text-content-secondary">
				{tI18n(
					"dashboard.Navbar.UserDropdown.UserDropdownAISpend.approximate_ai_spend_112d229f",
				)}{" "}
				<span className="whitespace-nowrap">
					{formatSpendPeriodLabel(periodStart, periodEnd)}
				</span>
			</div>
		</div>
	);
};
