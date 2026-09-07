import { BanIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { AIBridgeSessionNetworkCallSummary } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { currentIntlLocale } from "#/i18n/locale";
import {
	NetworkMonitoringDisabled,
	NetworkNoActivity,
} from "./NetworkRequestStates";

interface NetworkCallBadgesProps {
	// summary is undefined when network request monitoring was not active for
	// the session, which renders as "Disabled".
	summary: AIBridgeSessionNetworkCallSummary | undefined;
}

export const NetworkCallBadges: FC<NetworkCallBadgesProps> = ({ summary }) => {
	const { t: tI18n } = useTranslation("agents");

	if (!summary) {
		return <NetworkMonitoringDisabled />;
	}

	if (summary.total === 0) {
		return <NetworkNoActivity />;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						aria-label={tI18n(
							"AIBridgePage.NetworkCallBadges.more_info_7dd4d97d",
						)}
						className="flex items-center whitespace-nowrap border-0 bg-transparent p-0 text-inherit"
					>
						<Badge className="rounded-e-none">
							{summary.total.toLocaleString(currentIntlLocale())}
						</Badge>
						<Badge
							svgSize="xs"
							className="gap-0 bg-surface-tertiary rounded-s-none text-content-warning"
						>
							<BanIcon className="shrink-0" />
							{summary.blocked.toLocaleString(currentIntlLocale())}
						</Badge>
					</button>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					align="start"
					className="text-sm font-normal"
				>
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between gap-4">
							<span className="text-content-secondary">
								{tI18n(
									"AIBridgePage.NetworkCallBadges.total_requests_128269f3",
								)}
							</span>
							<span>{summary.total.toLocaleString(currentIntlLocale())}</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-content-secondary">
								{tI18n("AIBridgePage.NetworkCallBadges.blocked_18f2a094")}
							</span>
							<span>{summary.blocked.toLocaleString(currentIntlLocale())}</span>
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
