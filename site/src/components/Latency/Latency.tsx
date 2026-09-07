import { cn } from "cn";
import { CircleHelpIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Abbr } from "#/components/Abbr/Abbr";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { getLatencyColor } from "#/utils/latency";

interface LatencyProps {
	latency?: number;
	isLoading?: boolean;
	className?: string;
}

export const Latency: FC<LatencyProps> = ({
	latency,
	isLoading,
	className,
}) => {
	const { t: tI18n } = useTranslation("components");

	// Always use the no latency color for loading.
	const latencyColor = getLatencyColor(isLoading ? undefined : latency);

	if (isLoading) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					{/**
					 * Spinning progress icon must be placed inside a fixed-size container,
					 * to ensure tooltip remains stationary when opened
					 */}
					<div
						className={cn(
							"size-4 flex flex-wrap place-content-center",
							className,
						)}
					>
						<Spinner loading className={cn("size-icon-xs!", latencyColor)} />
					</div>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n("Latency.Latency.loading_latency_92da998c")}
				</TooltipContent>
			</Tooltip>
		);
	}

	if (!latency) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<CircleHelpIcon
						aria-label={tI18n("Latency.Latency.latency_not_available_cea65bce")}
						className={cn("size-icon-sm!", latencyColor, className)}
					/>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n("Latency.Latency.latency_not_available_cea65bce")}
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<div className={cn("text-sm", latencyColor, className)}>
			<span className="sr-only">
				{tI18n("Latency.Latency.latency_4774635c")}
			</span>
			{latency.toFixed(0)}
			<Abbr title={tI18n("Latency.Latency.milliseconds_c7fa2402")}>
				{tI18n("Latency.Latency.ms_f785c3ce")}
			</Abbr>
		</div>
	);
};
