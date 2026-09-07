import dayjs from "dayjs";
import {
	AppWindowIcon,
	CircleAlertIcon,
	CloudDownloadIcon,
	CloudUploadIcon,
	GaugeIcon,
	GitCompareArrowsIcon,
	RocketIcon,
	RotateCwIcon,
	SquareTerminalIcon,
	WrenchIcon,
} from "lucide-react";
import prettyBytes from "pretty-bytes";
import {
	type FC,
	type PropsWithChildren,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type {
	DeploymentStats,
	HealthcheckReport,
	WorkspaceStatus,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { HelpPopoverTitle } from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import { getDisplayWorkspaceStatus } from "#/utils/workspace";

interface DeploymentBannerViewProps {
	health?: HealthcheckReport;
	stats?: DeploymentStats;
	fetchStats?: () => void;
}

export const DeploymentBannerView: FC<DeploymentBannerViewProps> = ({
	health,
	stats,
	fetchStats,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	const aggregatedMinutes = useMemo(() => {
		if (!stats) {
			return;
		}
		return dayjs(stats.collected_at).diff(stats.aggregated_from, "minutes");
	}, [stats]);

	const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);
	useEffect(() => {
		if (!stats || !fetchStats) {
			return;
		}

		let timeUntilRefresh = dayjs(stats.next_update_at).diff(
			stats.collected_at,
			"seconds",
		);
		setTimeUntilRefresh(timeUntilRefresh);
		let canceled = false;
		const loop = () => {
			if (canceled) {
				return undefined;
			}
			setTimeUntilRefresh(timeUntilRefresh--);
			if (timeUntilRefresh > 0) {
				return window.setTimeout(loop, 1000);
			}
			fetchStats();
		};
		const timeout = setTimeout(loop, 1000);
		return () => {
			canceled = true;
			clearTimeout(timeout);
		};
	}, [fetchStats, stats]);

	const lastAggregated = useMemo(() => {
		if (!stats) {
			return;
		}
		if (!fetchStats) {
			// Storybook!
			return "just now";
		}
		return dayjs().to(dayjs(stats.collected_at));
	}, [timeUntilRefresh, stats, fetchStats]);

	const healthErrors = health ? getHealthErrors(health) : [];
	const displayLatency = stats?.workspaces.connection_latency_ms.P50 || -1;

	return (
		<div
			className="sticky bottom-0 z-1 flex h-9 w-full items-center gap-8
		 		overflow-x-auto overflow-y-hidden whitespace-nowrap border-0 border-t border-solid border-border
				bg-surface-primary pr-4 font-mono text-xs leading-none"
		>
			<TooltipProvider delayDuration={100}>
				<Tooltip>
					<TooltipTrigger asChild>
						{healthErrors.length > 0 ? (
							<Link
								asChild
								className="flex p-3 bg-content-destructive"
								showExternalIcon={false}
							>
								<RouterLink
									to="/health"
									data-testid="deployment-health-trigger"
								>
									<CircleAlertIcon className="text-content-primary" />
								</RouterLink>
							</Link>
						) : (
							<div
								className="flex h-full items-center justify-center pl-3"
								data-testid="deployment-health-trigger"
							>
								<RocketIcon className="size-icon-sm" />
							</div>
						)}
					</TooltipTrigger>
					<TooltipContent
						className="ml-3 mb-1 p-4 text-sm text-content-primary
							border border-solid border-border pointer-events-none"
					>
						{healthErrors.length > 0 ? (
							<>
								<HelpPopoverTitle>
									{tI18n(
										"dashboard.DeploymentBanner.DeploymentBannerView.we_have_detected_problems_with_your_coder_deploy_4240f143",
									)}
								</HelpPopoverTitle>
								<div className="flex flex-col gap-1">
									{healthErrors.map((error) => (
										<HealthIssue key={error}>{error}</HealthIssue>
									))}
								</div>
							</>
						) : (
							tI18n(
								"dashboard.DeploymentBanner.DeploymentBannerView.status_of_your_coder_deployment_only_visible_for_3243bff3",
							)
						)}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<div className="flex items-center">
				<div className="mr-4 text-content-primary">
					{tI18n(
						"dashboard.DeploymentBanner.DeploymentBannerView.workspaces_1377264b",
					)}
				</div>
				<div className="flex gap-2 text-content-secondary">
					<WorkspaceBuildValue
						status="pending"
						count={stats?.workspaces.pending}
					/>
					<ValueSeparator />
					<WorkspaceBuildValue
						status="starting"
						count={stats?.workspaces.building}
					/>
					<ValueSeparator />
					<WorkspaceBuildValue
						status="running"
						count={stats?.workspaces.running}
					/>
					<ValueSeparator />
					<WorkspaceBuildValue
						status="stopped"
						count={stats?.workspaces.stopped}
					/>
					<ValueSeparator />
					<WorkspaceBuildValue
						status="failed"
						count={stats?.workspaces.failed}
					/>
				</div>
			</div>
			<div className="flex items-center">
				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="mr-4 text-content-primary">
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.transmission_3e101342",
								)}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							{tI18n(
								"dashboard.DeploymentBanner.DeploymentBannerView.activity_in_the_last_value0_minutes_30d6721d",
								{
									value0: aggregatedMinutes,
								},
							)}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<div className="flex gap-2 text-content-secondary">
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<CloudDownloadIcon className="size-icon-xs" />
									{stats ? prettyBytes(stats.workspaces.rx_bytes) : "-"}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.data_sent_to_workspaces_d18f7495",
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<ValueSeparator />
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<CloudUploadIcon className="size-icon-xs" />
									{stats ? prettyBytes(stats.workspaces.tx_bytes) : "-"}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.data_sent_from_workspaces_d5366774",
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<ValueSeparator />
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<GaugeIcon className="size-icon-xs" />
									{displayLatency > 0
										? tI18n(
												"dashboard.DeploymentBanner.DeploymentBannerView.value0_ms_55077da6",
												{
													value0: displayLatency?.toFixed(2),
												},
											)
										: "-"}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{displayLatency < 0
									? tI18n(
											"dashboard.DeploymentBanner.DeploymentBannerView.no_recent_workspace_connections_have_been_made_1578c2c2",
										)
									: tI18n(
											"dashboard.DeploymentBanner.DeploymentBannerView.the_average_latency_of_user_connections_to_works_560c9d2f",
										)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
			<div className="flex items-center">
				<div className="mr-4 text-content-primary">
					{tI18n(
						"dashboard.DeploymentBanner.DeploymentBannerView.active_connections_fa1f0a72",
					)}
				</div>

				<div className="flex gap-2 text-content-secondary">
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<ExternalImage
										src="/icon/code.svg"
										alt=""
										className="size-icon-xs"
									/>
									{typeof stats?.session_count.vscode === "undefined"
										? "-"
										: stats?.session_count.vscode}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.vs_code_editors_with_the_coder_remote_extension_95239140",
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<ValueSeparator />
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<ExternalImage
										src="/icon/jetbrains.svg"
										alt=""
										className="size-icon-xs"
									/>
									{typeof stats?.session_count.jetbrains === "undefined"
										? "-"
										: stats?.session_count.jetbrains}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.jetbrains_editors_ddab2dcd",
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<ValueSeparator />
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<SquareTerminalIcon className="size-icon-xs" />
									{typeof stats?.session_count.ssh === "undefined"
										? "-"
										: stats?.session_count.ssh}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.ssh_sessions_1d3b9f49",
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<ValueSeparator />
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1">
									<AppWindowIcon className="size-icon-xs" />
									{typeof stats?.session_count.reconnecting_pty === "undefined"
										? "-"
										: stats?.session_count.reconnecting_pty}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.web_terminal_sessions_d6052b2d",
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
			<div className="ml-auto flex mr-3 items-center gap-8 text-content-primary">
				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="flex items-center gap-1">
								<GitCompareArrowsIcon className="size-icon-xs" />
								{lastAggregated}
							</div>
						</TooltipTrigger>
						<TooltipContent
							className="max-w-xs"
							collisionPadding={{ right: 20 }}
						>
							{tI18n(
								"dashboard.DeploymentBanner.DeploymentBannerView.the_last_time_stats_were_aggregated_workspaces_r_e291293d",
							)}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="font-mono [&_svg]:mr-1"
								onClick={() => {
									if (fetchStats) {
										fetchStats();
									}
								}}
								variant="subtle"
								size="icon"
							>
								<RotateCwIcon />
								{timeUntilRefresh}
								{tI18n(
									"dashboard.DeploymentBanner.DeploymentBannerView.s_043a7187",
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent
							className="max-w-xs"
							collisionPadding={{ right: 20 }}
						>
							{tI18n(
								"dashboard.DeploymentBanner.DeploymentBannerView.a_countdown_until_stats_are_fetched_again_click__5e5b7987",
							)}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
};

interface WorkspaceBuildValueProps {
	status: WorkspaceStatus;
	count?: number;
}

const WorkspaceBuildValue: FC<WorkspaceBuildValueProps> = ({
	status,
	count,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	const displayStatus = getDisplayWorkspaceStatus(status);
	let statusText = displayStatus.text;
	let icon = displayStatus.icon;
	if (status === "starting") {
		icon = <WrenchIcon className="size-icon-xs" />;
		statusText = tI18n(
			"dashboard.DeploymentBanner.DeploymentBannerView.building_87c5912f",
		);
	}

	return (
		<TooltipProvider delayDuration={100}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Link asChild showExternalIcon={false}>
						<RouterLink
							to={`/workspaces?filter=${encodeURIComponent(`status:${status}`)}`}
						>
							<div className="flex items-center gap-1 text-xs">
								{icon}
								{typeof count === "undefined" ? "-" : count}
							</div>
						</RouterLink>
					</Link>
				</TooltipTrigger>
				<TooltipContent>
					{tI18n(
						"dashboard.DeploymentBanner.DeploymentBannerView.value0_workspaces_87fbdfd2",
						{
							value0: statusText,
						},
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

const ValueSeparator: FC = () => {
	return <div className="text-content-disabled self-center">/</div>;
};

const HealthIssue: FC<PropsWithChildren> = ({ children }) => {
	return (
		<div className="flex items-center gap-1">
			<CircleAlertIcon className="size-icon-sm text-border-destructive" />
			{children}
		</div>
	);
};

const getHealthErrors = (health: HealthcheckReport) => {
	const warnings: string[] = [];
	const sections = [
		"access_url",
		"database",
		"derp",
		"websocket",
		"workspace_proxy",
	] as const;
	const messages: Record<(typeof sections)[number], string> = {
		access_url: i18n.t(
			"dashboard:dashboard.DeploymentBanner.DeploymentBannerView.your_access_url_may_be_configured_incorrectly_eda49d5d",
		),
		database: i18n.t(
			"dashboard:dashboard.DeploymentBanner.DeploymentBannerView.your_database_is_unhealthy_44ead0ae",
		),
		derp: i18n.t(
			"dashboard:dashboard.DeploymentBanner.DeploymentBannerView.we_re_noticing_derp_proxy_issues_93b36b22",
		),
		websocket: i18n.t(
			"dashboard:dashboard.DeploymentBanner.DeploymentBannerView.we_re_noticing_websocket_issues_3d3375f8",
		),
		workspace_proxy: i18n.t(
			"dashboard:dashboard.DeploymentBanner.DeploymentBannerView.we_re_noticing_workspace_proxy_issues_1f8bd73f",
		),
	} as const;

	for (const section of sections) {
		if (health[section].severity === "error" && !health[section].dismissed) {
			warnings.push(messages[section]);
		}
	}

	return warnings;
};
