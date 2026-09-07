import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { formatBudgetUSD } from "#/utils/currency";
import { AIBudgetAmount } from "./AIBudgetAmount";

/** Spend against budget. Highlights spend once it nears or exceeds the limit; values in micros. */
export const AIBudgetUsage: FC<{
	currentSpend: number;
	spendLimit: number | null;
}> = ({ currentSpend, spendLimit }) => {
	const { t: tI18n } = useTranslation("components");

	if (spendLimit === null) {
		return (
			<span className="whitespace-nowrap">
				{formatBudgetUSD(currentSpend)}{" "}
				<span className="text-content-disabled">
					{tI18n("groups.AIBudgetUsage.unlimited_usd_d96ea3ab")}
				</span>
			</span>
		);
	}

	return (
		<span className="whitespace-nowrap">
			<AIBudgetAmount spend={currentSpend} limit={spendLimit} />{" "}
			<span className="text-content-primary">
				/ {formatBudgetUSD(spendLimit)}
			</span>{" "}
			<span className="text-content-disabled">
				{tI18n("groups.AIBudgetUsage.usd_a26cdf3a")}
			</span>
		</span>
	);
};
