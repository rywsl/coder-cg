import { ExternalLinkIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import type { Theme } from "#/theme";
import { useTheme } from "#/theme/context";
import { Bar } from "./Chart/Bar";
import {
	Chart,
	ChartBreadcrumbs,
	ChartContent,
	type ChartLegend,
	ChartLegends,
	ChartSearch,
	ChartToolbar,
} from "./Chart/Chart";
import {
	calcDuration,
	calcOffset,
	formatTime,
	makeTicks,
	mergeTimeRanges,
	type TimeRange,
} from "./Chart/utils";
import { XAxis, XAxisRow, XAxisSection } from "./Chart/XAxis";
import {
	YAxis,
	YAxisHeader,
	YAxisLabel,
	YAxisLabels,
	YAxisSection,
} from "./Chart/YAxis";
import type { Stage } from "./StagesChart";

type ResourceTiming = {
	name: string;
	source: string;
	action: string;
	range: TimeRange;
};

type ResourcesChartProps = {
	stage: Stage;
	timings: ResourceTiming[];
	onBack: () => void;
};

export const ResourcesChart: FC<ResourcesChartProps> = ({
	stage,
	timings,
	onBack,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const generalTiming = mergeTimeRanges(timings.map((t) => t.range));
	const totalTime = calcDuration(generalTiming);
	const [ticks, scale] = makeTicks(totalTime);
	const [filter, setFilter] = useState("");
	const visibleTimings = timings.filter(
		// Stage boundaries are also included
		(t) =>
			(!isCoderResource(t.name) || isStageBoundary(t.name)) &&
			t.name.includes(filter),
	);
	const theme = useTheme();
	const legendsByAction = getLegendsByAction(theme);
	const visibleLegends = [...new Set(visibleTimings.map((t) => t.action))].map(
		(a) => legendsByAction[a] ?? { label: a },
	);

	return (
		<Chart>
			<ChartToolbar>
				<ChartBreadcrumbs
					breadcrumbs={[
						{
							label: stage.section,
							onClick: onBack,
						},
						{
							label: stage.name,
						},
					]}
				/>
				<ChartSearch
					placeholder={tI18n(
						"workspaces.WorkspaceTiming.ResourcesChart.filter_results_6335eaba",
					)}
					value={filter}
					onChange={setFilter}
				/>
				<ChartLegends legends={visibleLegends} />
			</ChartToolbar>
			<ChartContent>
				<YAxis>
					<YAxisSection>
						<YAxisHeader>
							{stage.name}
							{tI18n(
								"workspaces.WorkspaceTiming.ResourcesChart.stage_545870f5",
							)}
						</YAxisHeader>
						<YAxisLabels>
							{visibleTimings.map((t) => {
								const label = isStageBoundary(t.name)
									? tI18n(
											"workspaces.WorkspaceTiming.ResourcesChart.total_stage_duration_6f585227",
										)
									: t.name;
								return (
									<YAxisLabel key={label} id={encodeURIComponent(t.name)}>
										{label}
									</YAxisLabel>
								);
							})}
						</YAxisLabels>
					</YAxisSection>
				</YAxis>

				<XAxis ticks={ticks} scale={scale}>
					<XAxisSection>
						{visibleTimings.map((t) => {
							const stageBoundary = isStageBoundary(t.name);
							const duration = calcDuration(t.range);
							const legend = legendsByAction[t.action] ?? { label: t.action };
							const label = stageBoundary
								? tI18n(
										"workspaces.WorkspaceTiming.ResourcesChart.total_stage_duration_6f585227",
									)
								: t.name;

							return (
								<XAxisRow
									key={t.name}
									yAxisLabelId={encodeURIComponent(t.name)}
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<Bar
												value={duration}
												offset={calcOffset(t.range, generalTiming)}
												scale={scale}
												colors={legend.colors}
											/>
										</TooltipTrigger>
										<TooltipContent
											side="bottom"
											className="flex flex-col gap-1.5 border-surface-quaternary"
										>
											<p className="m-0 text-content-primary">{label}</p>
											{/* Stage boundaries should not have these links */}
											{!stageBoundary && (
												<Link
													to=""
													className="flex items-center gap-1 no-underline text-xs text-inherit hover:text-content-primary"
												>
													<ExternalLinkIcon className="size-icon-xs" />
													{tI18n(
														"workspaces.WorkspaceTiming.ResourcesChart.view_template_ebc3e89c",
													)}
												</Link>
											)}
										</TooltipContent>
									</Tooltip>
									{formatTime(duration)}
								</XAxisRow>
							);
						})}
					</XAxisSection>
				</XAxis>
			</ChartContent>
		</Chart>
	);
};

export const isStageBoundary = (resource: string) => {
	return resource.startsWith("coder_stage_");
};

export const isCoderResource = (resource: string) => {
	return (
		resource.startsWith("data.coder") ||
		resource.startsWith("module.coder") ||
		resource.startsWith("coder_")
	);
};

// TODO: We should probably strongly type the action attribute on
// ProvisionerTiming to catch missing actions in the record. As a "workaround"
// for now, we are using undefined since we don't have noUncheckedIndexedAccess
// enabled.
function getLegendsByAction(
	theme: Theme,
): Record<string, ChartLegend | undefined> {
	return {
		"state refresh": {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ResourcesChart.state_refresh_a559b47c",
			),
		},
		provision: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ResourcesChart.provision_267d294a",
			),
		},
		create: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ResourcesChart.create_fa8847b0",
			),
			colors: {
				fill: theme.roles.success.background,
				stroke: theme.roles.success.outline,
			},
		},
		delete: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ResourcesChart.delete_61975955",
			),
			colors: {
				fill: theme.roles.warning.background,
				stroke: theme.roles.warning.outline,
			},
		},
		read: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ResourcesChart.read_3316348d",
			),
			colors: {
				fill: theme.roles.active.background,
				stroke: theme.roles.active.outline,
			},
		},
	};
}
