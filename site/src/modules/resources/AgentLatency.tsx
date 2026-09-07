import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { DERPRegion, WorkspaceAgent } from "#/api/typesGenerated";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverText,
	HelpPopoverTitle,
	HelpPopoverTrigger,
} from "#/components/HelpPopover/HelpPopover";
import { getLatencyColor } from "#/utils/latency";

const getDisplayLatency = (agent: WorkspaceAgent) => {
	// Find the right latency to display
	const latencyValues = Object.values(agent.latency ?? {});
	const latency =
		latencyValues.find((derp) => derp.preferred) ??
		// Accessing an array index can return undefined as well
		// for some reason TS does not handle that
		(latencyValues[0] as DERPRegion | undefined);

	if (!latency) {
		return undefined;
	}

	return {
		...latency,
		color: getLatencyColor(latency.latency_ms),
	};
};

interface AgentLatencyProps {
	agent: WorkspaceAgent;
}

export const AgentLatency: FC<AgentLatencyProps> = ({ agent }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const latency = getDisplayLatency(agent);

	if (!latency || !agent.latency) {
		return null;
	}

	return (
		<HelpPopover>
			<HelpPopoverTrigger asChild>
				<span
					role="presentation"
					aria-label={tI18n("resources.AgentLatency.latency_3fdb7e87")}
					className={cn("cursor-pointer", latency.color)}
				>
					{Math.round(latency.latency_ms)}
					{tI18n("resources.AgentLatency.ms_f785c3ce")}
				</span>
			</HelpPopoverTrigger>
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n("resources.AgentLatency.latency_e0e7d293")}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"resources.AgentLatency.this_is_the_latency_overhead_on_non_peer_to_peer_514e91f9",
					)}
				</HelpPopoverText>
				<div className="flex-col gap-1 mt-4">
					{Object.entries(agent.latency)
						.sort(([, a], [, b]) => a.latency_ms - b.latency_ms)
						.map(([regionName, region]) => (
							<div
								className={cn(
									"flex items-center justify-between gap-1",
									region.preferred && "text-content-primary",
								)}
								key={regionName}
							>
								<strong>{regionName}</strong>
								{Math.round(region.latency_ms)}
								{tI18n("resources.AgentLatency.ms_f785c3ce")}
							</div>
						))}
				</div>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
