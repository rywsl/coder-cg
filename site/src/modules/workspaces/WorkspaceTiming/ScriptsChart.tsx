import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
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

type ScriptTiming = {
	name: string;
	status: string;
	exitCode: number;
	range: TimeRange;
};

type ScriptsChartProps = {
	stage: Stage;
	timings: ScriptTiming[];
	onBack: () => void;
};

export const ScriptsChart: FC<ScriptsChartProps> = ({
	stage,
	timings,
	onBack,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const generalTiming = mergeTimeRanges(timings.map((t) => t.range));
	const totalTime = calcDuration(generalTiming);
	const [ticks, scale] = makeTicks(totalTime);
	const [filter, setFilter] = useState("");
	const visibleTimings = timings.filter((t) => t.name.includes(filter));
	const theme = useTheme();
	const legendsByStatus = getLegendsByStatus(theme);
	const visibleLegends = [...new Set(visibleTimings.map((t) => t.status))].map(
		(s) => legendsByStatus[s],
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
						"workspaces.WorkspaceTiming.ScriptsChart.filter_results_6335eaba",
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
							{tI18n("workspaces.WorkspaceTiming.ScriptsChart.stage_545870f5")}
						</YAxisHeader>
						<YAxisLabels>
							{visibleTimings.map((t) => (
								<YAxisLabel key={t.name} id={encodeURIComponent(t.name)}>
									{t.name}
								</YAxisLabel>
							))}
						</YAxisLabels>
					</YAxisSection>
				</YAxis>

				<XAxis ticks={ticks} scale={scale}>
					<XAxisSection>
						{visibleTimings.map((t) => {
							const duration = calcDuration(t.range);

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
												colors={legendsByStatus[t.status].colors}
											/>
										</TooltipTrigger>
										<TooltipContent
											side="bottom"
											className="border-surface-quaternary text-content-primary"
										>
											{tI18n(
												"workspaces.WorkspaceTiming.ScriptsChart.script_exited_with_cb9794f6",
											)}
											<strong>
												{tI18n(
													"workspaces.WorkspaceTiming.ScriptsChart.code_aacf0b42",
												)}
												{t.exitCode}
											</strong>
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

function getLegendsByStatus(theme: Theme): Record<string, ChartLegend> {
	return {
		ok: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ScriptsChart.success_aee40884",
			),
			colors: {
				fill: theme.roles.success.background,
				stroke: theme.roles.success.outline,
			},
		},
		exit_failure: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ScriptsChart.failure_16d34b5e",
			),
			colors: {
				fill: theme.roles.error.background,
				stroke: theme.roles.error.outline,
			},
		},
		timeout: {
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.ScriptsChart.timed_out_3dcd80f1",
			),
			colors: {
				fill: theme.roles.warning.background,
				stroke: theme.roles.warning.outline,
			},
		},
	};
}
