import { cn } from "cn";
import { ExternalLinkIcon } from "lucide-react";
import {
	type FC,
	type HTMLProps,
	type ReactNode,
	useLayoutEffect,
	useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import type {
	ProvisionerJobLog,
	WorkspaceAgent,
	WorkspaceBuild,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { Loader } from "#/components/Loader/Loader";
import { Margins } from "#/components/Margins/Margins";
import {
	FullWidthPageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/FullWidthPageHeader";
import { Stats, StatsItem } from "#/components/Stats/Stats";
import {
	TAB_PADDING_X,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#/components/Tabs/Tabs";
import { DashboardFullPage } from "#/modules/dashboard/DashboardLayout";
import { AgentLogs } from "#/modules/resources/AgentLogs/AgentLogs";
import { useAgentLogs } from "#/modules/resources/useAgentLogs";
import { BuildIcon } from "#/modules/workspaces/BuildIcon/BuildIcon";
import {
	WorkspaceBuildData,
	WorkspaceBuildDataSkeleton,
} from "#/modules/workspaces/WorkspaceBuildData/WorkspaceBuildData";
import { WorkspaceBuildLogs } from "#/modules/workspaces/WorkspaceBuildLogs/WorkspaceBuildLogs";
import { formatDate } from "#/utils/time";
import { displayWorkspaceBuildDuration } from "#/utils/workspace";
import { WorkspaceDeletedBanner } from "../WorkspacePage/WorkspaceDeletedBanner";
import { Sidebar, SidebarCaption, SidebarItem } from "./Sidebar";

export const LOGS_TAB_KEY = "logs";

type BuildStatsItemProps = Readonly<{
	children?: ReactNode;
	label: string;
}>;

const BuildStatsItem: FC<BuildStatsItemProps> = ({ children, label }) => {
	return (
		<StatsItem
			className="flex-col gap-0 p-0 [&>span:first-of-type]:text-xs [&>span:first-of-type]:font-medium md:p-0"
			label={label}
			value={children}
		/>
	);
};

type DeletedWorkspaceBannerProps = Readonly<{
	createWorkspaceLink: string;
	templateName: string;
}>;

interface WorkspaceBuildPageViewProps {
	logs: ProvisionerJobLog[] | undefined;
	build: WorkspaceBuild | undefined;
	buildError?: unknown;
	deletedWorkspaceBanner?: DeletedWorkspaceBannerProps;
	builds: WorkspaceBuild[] | undefined;
	activeBuildNumber: number;
}

export const WorkspaceBuildPageView: FC<WorkspaceBuildPageViewProps> = ({
	logs,
	build,
	buildError,
	deletedWorkspaceBanner,
	builds,
	activeBuildNumber,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [searchParams, setSearchParams] = useSearchParams();

	if (buildError) {
		return (
			<Margins>
				{deletedWorkspaceBanner ? (
					<div className="my-4">
						<WorkspaceDeletedBanner {...deletedWorkspaceBanner} />
					</div>
				) : (
					<ErrorAlert error={buildError} className="my-4" />
				)}
			</Margins>
		);
	}

	if (!build) {
		return <Loader />;
	}

	const agents = build.resources.flatMap((resource) => resource.agents ?? []);
	const logsParam = searchParams.get(LOGS_TAB_KEY);
	const selectedTab =
		logsParam && agents.some((agent) => agent.id === logsParam)
			? logsParam
			: "build";

	return (
		<DashboardFullPage>
			<FullWidthPageHeader sticky={false}>
				<div className="flex flex-row gap-4">
					<BuildIcon
						avatar
						transition={build.transition}
						jobStatus={build.job.status}
					/>
					<div>
						<PageHeaderTitle>
							{tI18n(
								"WorkspaceBuildPage.WorkspaceBuildPageView.build_c65265a4",
							)}
							{build.build_number}
						</PageHeaderTitle>
						<PageHeaderSubtitle>{build.initiator_name}</PageHeaderSubtitle>
					</div>
				</div>
				<Stats
					aria-label={tI18n(
						"WorkspaceBuildPage.WorkspaceBuildPageView.build_details_2de9d89c",
					)}
					className="flex flex-col items-start gap-2 px-0 border-none grow basis-0 md:flex-row md:gap-x-12 md:gap-y-6"
				>
					<BuildStatsItem
						label={tI18n(
							"WorkspaceBuildPage.WorkspaceBuildPageView.workspace_87bb59ba",
						)}
					>
						<Link
							to={`/@${build.workspace_owner_name}/${build.workspace_name}`}
						>
							{build.workspace_name}
						</Link>
					</BuildStatsItem>
					<BuildStatsItem
						label={tI18n(
							"WorkspaceBuildPage.WorkspaceBuildPageView.template_version_1c5f9189",
						)}
					>
						{build.template_version_name}
					</BuildStatsItem>
					<BuildStatsItem
						label={tI18n(
							"WorkspaceBuildPage.WorkspaceBuildPageView.duration_4fc52a3c",
						)}
					>
						{displayWorkspaceBuildDuration(build)}
					</BuildStatsItem>
					<BuildStatsItem
						label={tI18n(
							"WorkspaceBuildPage.WorkspaceBuildPageView.started_at_fe752875",
						)}
					>
						{formatDate(new Date(build.created_at))}
					</BuildStatsItem>
					<BuildStatsItem
						label={tI18n(
							"WorkspaceBuildPage.WorkspaceBuildPageView.action_64cff131",
						)}
					>
						<span className="capitalize">{build.transition}</span>
					</BuildStatsItem>
				</Stats>
			</FullWidthPageHeader>
			<div className="flex items-start overflow-hidden grow basis-0">
				<Sidebar>
					<SidebarCaption>
						{tI18n("WorkspaceBuildPage.WorkspaceBuildPageView.builds_6a3fe887")}
					</SidebarCaption>
					{!builds &&
						Array.from({ length: 15 }, (_, i) => (
							<SidebarItem key={i}>
								<WorkspaceBuildDataSkeleton />
							</SidebarItem>
						))}

					{builds?.map((build) => (
						<Link
							key={build.id}
							to={`/@${build.workspace_owner_name}/${build.workspace_name}/builds/${build.build_number}`}
						>
							<SidebarItem active={build.build_number === activeBuildNumber}>
								<WorkspaceBuildData build={build} />
							</SidebarItem>
						</Link>
					))}
				</Sidebar>

				<ScrollArea>
					<div className="flex items-center justify-between border-0 border-b border-solid border-border relative">
						<Tabs
							value={selectedTab}
							onValueChange={(value: string) => {
								setSearchParams((previous) => {
									const next = new URLSearchParams(previous);
									if (value === "build") {
										next.delete(LOGS_TAB_KEY);
									} else {
										next.set(LOGS_TAB_KEY, value);
									}
									return next;
								});
							}}
							className="w-full -m-px"
						>
							<TabsList variant="insideBox">
								<TabsTrigger value="build">
									{tI18n(
										"WorkspaceBuildPage.WorkspaceBuildPageView.build_bdd254b6",
									)}
								</TabsTrigger>
								{agents.map((agent) => (
									<TabsTrigger value={agent.id} key={agent.id}>
										{tI18n(
											"WorkspaceBuildPage.WorkspaceBuildPageView.coder_agent_2f95f276",
										)}
										{agent.name}
									</TabsTrigger>
								))}
							</TabsList>
							<TabsContent value="build">
								<div className="p-2 flex justify-end absolute right-0 top-0">
									<Button asChild size="sm" variant="outline">
										<a
											href={`/api/v2/workspacebuilds/${build.id}/logs?format=text`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{tI18n(
												"WorkspaceBuildPage.WorkspaceBuildPageView.view_raw_logs_ed3f405c",
											)}
											<ExternalLinkIcon className="size-3" />
										</a>
									</Button>
								</div>
								{build.transition === "delete" &&
									build.job.status === "failed" && (
										<Alert
											severity="error"
											prominent
											className="rounded-none border-0 border-b border-solid border-border"
										>
											<div>
												{tI18n(
													"WorkspaceBuildPage.WorkspaceBuildPageView.the_workspace_may_have_failed_to_delete_due_to_a_a9f02a29",
												)}{" "}
												<code className="font-semibold w-fit inline-block">
													{`coder rm ${`${build.workspace_owner_name}/${build.workspace_name}`} --orphan`}
												</code>{" "}
												{tI18n(
													"WorkspaceBuildPage.WorkspaceBuildPageView.to_delete_the_workspace_skipping_resource_destru_06e98d48",
												)}
											</div>
										</Alert>
									)}
								{build?.job?.logs_overflowed && (
									<Alert
										severity="warning"
										prominent
										className="rounded-none border-0 border-b border-solid border-border"
									>
										{tI18n(
											"WorkspaceBuildPage.WorkspaceBuildPageView.provisioner_logs_exceeded_the_max_size_of_1mb_wi_4ff17fd2",
										)}
									</Alert>
								)}
								<BuildLogsContent logs={logs} build={build} />
							</TabsContent>
							{agents.map((agent) => (
								<TabsContent value={agent.id} key={agent.id}>
									<div className="p-2 flex justify-end absolute right-0 top-0">
										<Button asChild size="sm" variant="outline">
											<a
												href={`/api/v2/workspaceagents/${agent.id}/logs?format=text`}
												target="_blank"
												rel="noopener noreferrer"
											>
												{tI18n(
													"WorkspaceBuildPage.WorkspaceBuildPageView.view_raw_logs_ed3f405c",
												)}
												<ExternalLinkIcon className="size-3" />
											</a>
										</Button>
									</div>
									<AgentLogsContent agent={agent} />
								</TabsContent>
							))}
						</Tabs>
					</div>
				</ScrollArea>
			</div>
		</DashboardFullPage>
	);
};

const ScrollArea: FC<HTMLProps<HTMLDivElement>> = ({ className, ...props }) => {
	/**
	 * @todo 2024-10-03 - Use only CSS to set the height of the content.
	 *
	 * On Safari, when content is rendered inside a flex container and needs to
	 * scroll, the parent container must have a height set. Achieving this may
	 * require significant refactoring of the layout components where we
	 * currently use height and min-height set to 100%.
	 *
	 * @see {@link https://github.com/coder/coder/issues/9687}
	 * @see {@link https://stackoverflow.com/questions/43381836/height100-works-in-chrome-but-not-in-safari}
	 */
	const contentRef = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		const contentEl = contentRef.current;
		if (!contentEl) {
			return;
		}

		/**
		 * 2025-09-17 - We're updating the height directly to minimize the
		 * overhead in React itself. There is a risk down the line that the
		 * height value will be wiped on re-renders, but that seemed like a
		 * small enough risk that it wasn't worth accounting for just yet
		 */
		const syncParentSize = () => {
			const parentEl = contentEl.parentElement;
			if (parentEl && contentEl) {
				contentEl.style.height = `${contentEl.parentElement.clientHeight}px`;
			}
		};

		syncParentSize();
		const resizeObserver = new ResizeObserver(syncParentSize);
		resizeObserver.observe(document.body);
		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<div
			ref={contentRef}
			className={cn("overflow-y-auto w-full", className)}
			{...props}
		/>
	);
};

function sortLogsByCreatedAt(
	logs: readonly ProvisionerJobLog[],
): ProvisionerJobLog[] {
	return [...logs].sort((a, b) => {
		return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
	});
}

const BuildLogsContent: FC<{
	logs?: ProvisionerJobLog[];
	build?: WorkspaceBuild;
}> = ({ logs = [], build }) => {
	if (!logs) {
		return <Loader />;
	}

	return (
		<WorkspaceBuildLogs
			className="border-none"
			style={{ "--log-line-side-padding": `${TAB_PADDING_X}px` }}
			build={build}
			logs={sortLogsByCreatedAt(logs)}
			disableAutoscroll
		/>
	);
};

type AgentLogsContentProps = {
	agent: WorkspaceAgent;
};

const AgentLogsContent: FC<AgentLogsContentProps> = ({ agent }) => {
	const logs = useAgentLogs({ agentId: agent.id });
	return (
		<AgentLogs
			overflowed={agent.logs_overflowed}
			sources={agent.log_sources}
			height={560}
			width="100%"
			logs={logs.map((l) => ({
				id: l.id,
				output: l.output,
				time: l.created_at,
				level: l.level,
				sourceId: l.source_id,
			}))}
		/>
	);
};
