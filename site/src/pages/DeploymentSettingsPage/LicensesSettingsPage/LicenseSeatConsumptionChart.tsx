import { ChevronRightIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";
import { Button } from "#/components/Button/Button";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/Chart/Chart";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { Link } from "#/components/Link/Link";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { currentIntlLocale } from "#/i18n/locale";
import { docs } from "#/utils/docs";
import { formatDate } from "#/utils/time";

const chartConfig = {
	users: {
		label: i18n.t(
			"administration:DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.users_6b0cc904",
		),
		color: "hsl(var(--highlight-purple))",
	},
} satisfies ChartConfig;

type LicenseSeatConsumptionChartProps = {
	limit: number | undefined;
	data:
		| {
				date: string;
				users: number;
		  }[]
		| undefined;
};

export const LicenseSeatConsumptionChart: FC<
	LicenseSeatConsumptionChartProps
> = ({ data, limit }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<section className="border border-solid rounded">
			<div className="p-4">
				<Collapsible>
					<header className="flex flex-col gap-2 items-start">
						<h3 className="text-md m-0 font-medium">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.license_seat_consumption_be53b906",
							)}
						</h3>

						<CollapsibleTrigger asChild>
							<Button
								className={`
									h-auto p-0 border-0 bg-transparent font-medium text-content-secondary
									hover:bg-transparent hover:text-content-primary
									[&[data-state=open]_svg]:rotate-90
								`}
							>
								<ChevronRightIcon />
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.how_we_calculate_license_seat_consumption_44d69f0f",
								)}
							</Button>
						</CollapsibleTrigger>
					</header>

					<CollapsibleContent
						className={`
							pt-2 pl-7 pr-5 space-y-4 font-medium max-w-[720px]
							text-sm text-content-secondary
							[&_p]:m-0 [&_ul]:m-0 [&_ul]:p-0 [&_ul]:list-none
						`}
					>
						<p>
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.licenses_are_consumed_based_on_the_status_of_use_1fcda647",
							)}
						</p>
						<ul>
							<li className="flex items-center gap-2">
								<div className="rounded-[2px] bg-highlight-green size-3 inline-block">
									<span className="sr-only">
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.legend_for_active_users_in_the_chart_feaf5ce0",
										)}
									</span>
								</div>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.the_user_was_active_at_least_once_during_the_las_3188a3ff",
								)}
							</li>
							<li className="flex items-center gap-2">
								<div className="size-3 inline-flex items-center justify-center">
									<span className="sr-only">
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.legend_for_license_seat_limit_in_the_chart_a6f0c03b",
										)}
									</span>
									<div className="w-full border-dashed border-content-disabled" />
								</div>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.current_license_seat_limit_or_the_maximum_number_7097c8ad",
								)}
							</li>
						</ul>
						<div>
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.you_might_also_check_a85d9355",
							)}
							<ul>
								<li>
									<Link asChild>
										<RouterLink to="/audit">
											{tI18n(
												"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.activity_audit_11dfc62e",
											)}
										</RouterLink>
									</Link>
								</li>
								<li>
									<Link asChild>
										<RouterLink to="/deployment/overview">
											{tI18n(
												"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.daily_user_activity_575872d0",
											)}
										</RouterLink>
									</Link>
								</li>
								<li>
									<Link
										href={docs("/admin/users#user-status")}
										target="_blank"
										rel="noreferrer"
									>
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.more_details_on_user_account_statuses_7237ff90",
										)}
									</Link>
								</li>
							</ul>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>
			<div className="p-6 border-0 border-t border-solid">
				<div className="h-64">
					{data ? (
						data.length > 0 ? (
							<ChartContainer
								config={chartConfig}
								className="aspect-auto h-full"
							>
								<AreaChart
									accessibilityLayer
									data={data}
									margin={{
										top: 5,
										right: 5,
										left: 0,
									}}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickLine={false}
										tickMargin={12}
										minTickGap={24}
										tickFormatter={(value: string) =>
											formatDate(new Date(value), {
												month: "short",
												day: "numeric",
												year: undefined,
												hour: undefined,
												minute: undefined,
												second: undefined,
											})
										}
									/>
									<YAxis
										// Adds space on Y to show always show the reference line without overflowing it.
										domain={[0, limit ? "dataMax + 10" : "auto"]}
										dataKey="users"
										tickLine={false}
										axisLine={false}
										tickMargin={12}
										tickFormatter={(value: number) => {
											return value === 0
												? ""
												: value.toLocaleString(currentIntlLocale());
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												className="font-medium text-content-secondary"
												labelClassName="text-content-primary"
												labelFormatter={(_, p) => {
													const item = p[0];
													return `${item.value} seats`;
												}}
												formatter={(_v, _n, item) => {
													const date = new Date(item.payload.date);
													return date.toLocaleString(currentIntlLocale(), {
														month: "long",
														day: "2-digit",
													});
												}}
											/>
										}
									/>
									<defs>
										<linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
											<stop
												offset="5%"
												stopColor="var(--color-users)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--color-users)"
												stopOpacity={0.1}
											/>
										</linearGradient>
									</defs>

									<Area
										dataKey="users"
										type="linear"
										fill="url(#fillUsers)"
										fillOpacity={0.4}
										stroke="var(--color-users)"
										stackId="a"
									/>
									{limit && (
										<ReferenceLine
											isFront
											ifOverflow="extendDomain"
											y={limit}
											label={{
												value: "license seat limit",
												position: "insideBottomRight",
												className:
													"text-2xs text-content-secondary font-regular",
											}}
											stroke="hsl(var(--content-disabled))"
											strokeDasharray="5 5"
										/>
									)}
								</AreaChart>
							</ChartContainer>
						) : (
							<div
								className={`
									w-full h-full flex items-center justify-center
									text-content-secondary text-sm font-medium
								`}
							>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseSeatConsumptionChart.no_data_available_d2d2d48c",
								)}
							</div>
						)
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<Spinner loading />
						</div>
					)}
				</div>
			</div>
		</section>
	);
};
