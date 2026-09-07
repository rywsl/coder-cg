import { CircleAlertIcon, InfoIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { TimingStage } from "#/api/typesGenerated";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import { Bar, ClickableBar } from "./Chart/Bar";
import { Blocks } from "./Chart/Blocks";
import { Chart, ChartContent } from "./Chart/Chart";
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

export type Stage = {
	/**
	 * The name is used to identify the stage.
	 */
	name: TimingStage;
	/**
	 * The value to display in the stage label. This can differ from the stage
	 * name to provide more context or clarity.
	 */
	label: string;
	/**
	 * The section is used to group stages together.
	 */
	section: string;
	/**
	 * The agent ID for agent-related stages. Used to filter timings correctly
	 * when multiple agents exist.
	 */
	agentId?: string;
	/**
	 * The tooltip is used to provide additional information about the stage.
	 */
	tooltip: {
		heading: string;
		description: string;
	};
};

type StageTiming = {
	stage: Stage;
	/**
	 * Represents the number of resources included in this stage that can be
	 * inspected. This value is used to display individual blocks within the bar,
	 * indicating that the stage consists of multiple resource time blocks.
	 */
	visibleResources: number;
	/**
	 * Represents the time range of the stage. This value is used to calculate the
	 * duration of the stage and to position the stage within the chart. This can
	 * be undefined if a stage has no timing data.
	 */
	range: TimeRange | undefined;
	/**
	 * Display an error icon within the bar to indicate when a stage has failed.
	 * This is used in the agent scripts stage.
	 */
	error?: boolean;
};

type StagesChartProps = {
	timings: StageTiming[];
	onSelectStage: (stage: Stage) => void;
};

export const StagesChart: FC<StagesChartProps> = ({
	timings,
	onSelectStage,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const totalRange = mergeTimeRanges(
		timings.map((t) => t.range).filter((t) => t !== undefined),
	);
	const totalTime = calcDuration(totalRange);
	const [ticks, scale] = makeTicks(totalTime);
	const sections = Array.from(new Set(timings.map((t) => t.stage.section)));

	return (
		<Chart>
			<ChartContent>
				<YAxis>
					{sections.map((section) => {
						const stages = timings
							.filter((t) => t.stage.section === section)
							.map((t) => t.stage);

						return (
							<YAxisSection key={section}>
								<YAxisHeader>{section}</YAxisHeader>
								<YAxisLabels>
									{stages.map((stage) => (
										<YAxisLabel
											key={stage.name}
											id={encodeURIComponent(stage.name)}
										>
											<span className="flex items-center justify-end gap-0.5">
												{stage.label}
												<Tooltip>
													<TooltipTrigger asChild>
														<InfoIcon className="size-icon-xs cursor-pointer text-content-secondary" />
													</TooltipTrigger>
													<TooltipContent
														side="bottom"
														className="flex flex-col gap-1.5 max-w-xs border-surface-quaternary"
													>
														<p className="m-0 text-content-primary">
															{stage.tooltip.heading}
														</p>
														<p className="m-0">{stage.tooltip.description}</p>
													</TooltipContent>
												</Tooltip>
											</span>
										</YAxisLabel>
									))}
								</YAxisLabels>
							</YAxisSection>
						);
					})}
				</YAxis>

				<XAxis ticks={ticks} scale={scale}>
					{sections.map((section) => {
						const stageTimings = timings.filter(
							(t) => t.stage.section === section,
						);
						return (
							<XAxisSection key={section}>
								{stageTimings.map((t) => {
									// If the stage has no timing data, we just want to render an empty row
									if (t.range === undefined) {
										return (
											<XAxisRow
												key={t.stage.name}
												yAxisLabelId={encodeURIComponent(t.stage.name)}
											/>
										);
									}

									const value = calcDuration(t.range);
									const offset = calcOffset(t.range, totalRange);
									const validDuration = value > 0 && !Number.isNaN(value);

									return (
										<XAxisRow
											key={t.stage.name}
											yAxisLabelId={encodeURIComponent(t.stage.name)}
										>
											{/** We only want to expand stages with more than one resource */}
											{t.visibleResources > 1 ? (
												<ClickableBar
													aria-label={tI18n(
														"workspaces.WorkspaceTiming.StagesChart.view_value0_details_4e6e7bda",
														{
															value0: t.stage.label,
														},
													)}
													scale={scale}
													value={value}
													offset={offset}
													onClick={() => {
														onSelectStage(t.stage);
													}}
												>
													{t.error && (
														<CircleAlertIcon className="size-icon-sm text-[#F87171] mr-1" />
													)}
													<Blocks count={t.visibleResources} />
												</ClickableBar>
											) : (
												<Bar scale={scale} value={value} offset={offset} />
											)}
											{validDuration ? (
												<span>{formatTime(value)}</span>
											) : (
												<span className="text-content-destructive">
													{tI18n(
														"workspaces.WorkspaceTiming.StagesChart.invalid_96c34a07",
													)}
												</span>
											)}
										</XAxisRow>
									);
								})}
							</XAxisSection>
						);
					})}
				</XAxis>
			</ChartContent>
		</Chart>
	);
};

export const provisioningStages: Stage[] = [
	{
		name: "init",
		label: i18n.t(
			"workspaces:workspaces.WorkspaceTiming.StagesChart.init_bb54068a",
		),
		section: "provisioning",
		tooltip: {
			heading: "Terraform initialization",
			description: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.StagesChart.download_providers_modules_e93bd163",
			),
		},
	},
	{
		name: "plan",
		label: i18n.t(
			"workspaces:workspaces.WorkspaceTiming.StagesChart.plan_64879f7d",
		),
		section: "provisioning",
		tooltip: {
			heading: "Terraform plan",
			description: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.StagesChart.compare_state_of_desired_vs_actual_resources_and_131e2348",
			),
		},
	},
	{
		name: "apply",
		label: i18n.t(
			"workspaces:workspaces.WorkspaceTiming.StagesChart.apply_97a5e41b",
		),
		section: "provisioning",
		tooltip: {
			heading: "Terraform apply",
			description: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.StagesChart.execute_terraform_plan_to_create_modify_delete_r_5b671b3c",
			),
		},
	},
	{
		name: "graph",
		label: i18n.t(
			"workspaces:workspaces.WorkspaceTiming.StagesChart.graph_eef93e1d",
		),
		section: "provisioning",
		tooltip: {
			heading: "Terraform graph",
			description: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.StagesChart.list_all_resources_in_plan_used_to_update_coderd_d7d0d14c",
			),
		},
	},
];

export const agentStages = (section: string, agentId: string): Stage[] => {
	return [
		{
			name: "connect",
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.StagesChart.connect_5a638a12",
			),
			section,
			agentId,
			tooltip: {
				heading: "Connect",
				description: i18n.t(
					"workspaces:workspaces.WorkspaceTiming.StagesChart.establish_an_rpc_connection_with_the_control_pla_1a1baae7",
				),
			},
		},
		{
			name: "start",
			label: i18n.t(
				"workspaces:workspaces.WorkspaceTiming.StagesChart.run_startup_scripts_b6951356",
			),
			section,
			agentId,
			tooltip: {
				heading: "Run startup scripts",
				description: i18n.t(
					"workspaces:workspaces.WorkspaceTiming.StagesChart.execute_each_agent_startup_script_13c10068",
				),
			},
		},
	];
};
