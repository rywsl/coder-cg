import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { currentIntlLocale } from "#/i18n/locale";

type PaginationHeaderProps = {
	paginationUnitLabel: string;
	limit: number;
	totalRecords: number | undefined;
	currentOffsetStart: number | undefined;
	countIsCapped?: boolean;

	// Temporary escape hatch until Workspaces can be switched over to using
	// PaginationContainer
	className?: string;
};

export const PaginationAmount: FC<PaginationHeaderProps> = ({
	paginationUnitLabel,
	limit,
	totalRecords,
	currentOffsetStart,
	countIsCapped,
	className,
}) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<div
			className={cn(
				"flex flex-row flex-nowrap items-center m-0",
				"text-xs font-normal text-content-secondary",
				"h-9", // The size of a small button
				"[&_strong]:text-content-primary",
				className,
			)}
		>
			{totalRecords !== undefined ? (
				<>
					{/**
					 * Have to put text content in divs so that flexbox doesn't scramble
					 * the inner text nodes up
					 */}
					{totalRecords === 0 && (
						<div>
							{tI18n(
								"PaginationWidget.PaginationAmount.no_records_available_292e6069",
							)}
						</div>
					)}

					{totalRecords !== 0 && currentOffsetStart !== undefined && (
						<div>
							{tI18n("PaginationWidget.PaginationAmount.showing_7282e1fb")}
							<strong>
								{currentOffsetStart.toLocaleString(currentIntlLocale())}
							</strong>
							{tI18n("PaginationWidget.PaginationAmount.to_84d0f765")}{" "}
							<strong>
								{(
									currentOffsetStart +
									(countIsCapped
										? limit - 1
										: Math.min(limit - 1, totalRecords - currentOffsetStart))
								).toLocaleString(currentIntlLocale())}
							</strong>{" "}
							{tI18n("PaginationWidget.PaginationAmount.of_28391d3b")}{" "}
							<strong>
								{totalRecords.toLocaleString(currentIntlLocale())}
								{countIsCapped && "+"}
							</strong>{" "}
							{paginationUnitLabel}
						</div>
					)}
				</>
			) : (
				<Skeleton variant="text" width={160} height={16} />
			)}
		</div>
	);
};
