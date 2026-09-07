import { ChevronRightIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { formatDate } from "#/utils/time";

const chartConfig = {
	users: {
		label: i18n.t(
			"administration:DeploymentSettingsPage.OverviewPage.UserEngagementChart.users_6b0cc904",
		),
		color: "hsl(var(--highlight-purple))",
	},
} satisfies ChartConfig;

type UserEngagementChartProps = {
	data:
		| {
				date: string;
				users: number;
		  }[]
		| undefined;
};

export const UserEngagementChart: FC<UserEngagementChartProps> = ({ data }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<section className="border border-solid rounded">
			<div className="p-4">
				<Collapsible>
					<header className="flex flex-col gap-2 items-start">
						<h3 className="text-md m-0 font-medium">
							{tI18n(
								"DeploymentSettingsPage.OverviewPage.UserEngagementChart.user_engagement_99b8b115",
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
									"DeploymentSettingsPage.OverviewPage.UserEngagementChart.how_we_calculate_engaged_users_a9a80eac",
								)}
							</Button>
						</CollapsibleTrigger>
					</header>

					<CollapsibleContent
						className={`
							pt-2 pl-7 pr-5 space-y-4 font-medium max-w-[720px]
							[&_p]:m-0 [&_p]:text-sm [&_p]:text-content-secondary
						`}
					>
						<p>
							{tI18n(
								"DeploymentSettingsPage.OverviewPage.UserEngagementChart.a_user_is_considered_engaged_if_they_initiate_a__70d06ac4",
							)}{" "}
							<Link size="sm" asChild>
								<RouterLink to="/audit">
									{tI18n(
										"DeploymentSettingsPage.OverviewPage.UserEngagementChart.activity_audit_11dfc62e",
									)}
								</RouterLink>
							</Link>{" "}
							{tI18n(
								"DeploymentSettingsPage.OverviewPage.UserEngagementChart.and_6201111b",
							)}{" "}
							<Link size="sm" asChild>
								<RouterLink to="/deployment/licenses">
									{tI18n(
										"DeploymentSettingsPage.OverviewPage.UserEngagementChart.license_consumption_33ed153a",
									)}
								</RouterLink>
							</Link>{" "}
							{tI18n(
								"DeploymentSettingsPage.OverviewPage.UserEngagementChart.tools_8e194cf4",
							)}
						</p>
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
										top: 10,
										left: 0,
										right: 0,
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
													return `${item.value} users`;
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
										isAnimationActive={false}
										dataKey="users"
										type="linear"
										fill="url(#fillUsers)"
										fillOpacity={0.4}
										stroke="var(--color-users)"
										stackId="a"
									/>
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
									"DeploymentSettingsPage.OverviewPage.UserEngagementChart.no_data_available_d2d2d48c",
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
