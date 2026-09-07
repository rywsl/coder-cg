import { currentIntlLocale } from "#/i18n/locale";
export const MICROS_PER_DOLLAR = 1_000_000;

const formatUSD = (
	value: number,
	minimumFractionDigits: number,
	maximumFractionDigits: number,
): string =>
	new Intl.NumberFormat(currentIntlLocale(), {
		style: "currency",
		currency: "USD",
		minimumFractionDigits,
		maximumFractionDigits,
		signDisplay: "auto",
	}).format(value);

/** Drops the cents when the amount is a whole dollar, used for budget displays. */
export const usdBudgetFormatter = {
	format: (value: number): string => formatUSD(value, 0, 2),
};

export function microsToDollars(micros: number): number {
	return micros / MICROS_PER_DOLLAR;
}

/** Formats micros as a whole-dollar USD budget, e.g. "$1,345". */
export function formatBudgetUSD(micros: number): string {
	return usdBudgetFormatter.format(microsToDollars(micros));
}

export function dollarsToMicros(dollars: string | number): number {
	if (typeof dollars === "string" && dollars.trim() === "") {
		return 0;
	}

	const micros = Math.round(Number(dollars) * MICROS_PER_DOLLAR);
	return Number.isFinite(micros) && micros > 0 ? micros : 0;
}

export function isPositiveFiniteDollarAmount(dollars: string): boolean {
	return dollars.trim() !== "" && dollarsToMicros(dollars) > 0;
}

export function formatCostMicros(micros: number | string): string {
	const microsValue = Number(micros);
	if (!Number.isFinite(microsValue)) {
		return "$0.00";
	}

	const dollars = Math.abs(microsValue) / MICROS_PER_DOLLAR;
	const rounded4 = Number(dollars.toFixed(4));
	if (rounded4 > 0 && rounded4 < 0.01) {
		if (microsValue < 0) {
			return `-$${dollars.toFixed(4)}`;
		}

		return formatUSD(dollars, 4, 4);
	}

	return formatUSD(microsToDollars(microsValue), 2, 2);
}
