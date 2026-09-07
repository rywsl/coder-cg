import { cn } from "cn";
import {
	BanIcon,
	CircleAlertIcon,
	EllipsisVerticalIcon,
	ExternalLinkIcon,
	FileIcon,
	PlayIcon,
	RefreshCcwIcon,
	RotateCcwIcon,
	SquareTerminalIcon,
	StarIcon,
} from "lucide-react";
import type React from "react";
import {
	type FC,
	type PropsWithChildren,
	type ReactNode,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router";
import { API } from "#/api/api";
import { templateVersion } from "#/api/queries/templates";
import {
	cancelBuild,
	deleteWorkspace,
	startWorkspace,
	stopWorkspace,
} from "#/api/queries/workspaces";
import type {
	Template,
	Workspace,
	WorkspaceAgent,
	WorkspaceApp,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { AvatarDataSkeleton } from "#/components/Avatar/AvatarDataSkeleton";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import {
	TableLoaderSkeleton,
	TableRowSkeleton,
} from "#/components/TableLoader/TableLoader";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useClickableTableRow } from "#/hooks/useClickableTableRow";
import {
	getTerminalHref,
	getVSCodeHref,
	isAppUrlValid,
	openAppInNewWindow,
} from "#/modules/apps/apps";
import { useAppLink } from "#/modules/apps/useAppLink";
import { findWorkspaceAppWithAgent } from "#/modules/apps/workspaceApps";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { abilitiesByWorkspaceStatus } from "#/modules/workspaces/actions";
import { WorkspaceBuildCancelDialog } from "#/modules/workspaces/WorkspaceBuildCancelDialog/WorkspaceBuildCancelDialog";
import { WorkspaceMoreActions } from "#/modules/workspaces/WorkspaceMoreActions/WorkspaceMoreActions";
import { WorkspaceOutdatedTooltip } from "#/modules/workspaces/WorkspaceOutdatedTooltip/WorkspaceOutdatedTooltip";
import { WorkspaceStatus } from "#/modules/workspaces/WorkspaceStatus/WorkspaceStatus";
import {
	useWorkspaceUpdate,
	WorkspaceUpdateDialogs,
} from "#/modules/workspaces/WorkspaceUpdateDialogs";
import { getDisplayWorkspaceTemplateName } from "#/utils/workspace";
import { WorkspaceSharingIndicator } from "./WorkspaceSharingIndicator";
import { WorkspacesEmpty } from "./WorkspacesEmpty";

interface WorkspacesTableProps {
	workspaces?: readonly Workspace[];
	checkedWorkspaces: readonly Workspace[];
	error?: unknown;
	isUsingFilter: boolean;
	onCheckChange: (checkedWorkspaces: readonly Workspace[]) => void;
	templates?: Template[];
	canCreateTemplate: boolean;
	canCreateWorkspace: boolean;
	onActionSuccess: () => Promise<void>;
	onActionError: (error: unknown) => void;
	chatsByWorkspace?: Record<string, string>;
}

export const WorkspacesTable: FC<WorkspacesTableProps> = ({
	workspaces,
	checkedWorkspaces,
	isUsingFilter,
	onCheckChange,
	templates,
	canCreateTemplate,
	canCreateWorkspace,
	onActionSuccess,
	onActionError,
	chatsByWorkspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const dashboard = useDashboard();
	const isLoading = !workspaces;
	const isEmpty = workspaces && workspaces.length === 0;
	const hideHeaders = isLoading || isEmpty;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/3">
						{isLoading ? (
							<Skeleton className="h-4 w-40" />
						) : (
							<div
								className={cn(
									"flex items-center gap-5",
									isEmpty && "invisible",
								)}
							>
								<Checkbox
									disabled={isEmpty}
									checked={
										!isEmpty && checkedWorkspaces.length === workspaces.length
									}
									onCheckedChange={(checked) => {
										if (!checked) {
											onCheckChange([]);
										} else {
											onCheckChange(workspaces);
										}
									}}
									aria-label={tI18n(
										"WorkspacesPage.WorkspacesTable.select_all_workspaces_a9c70b1d",
									)}
									className="my-0"
								/>
								{tI18n("WorkspacesPage.WorkspacesTable.name_dcd1d522")}
							</div>
						)}
					</TableHead>
					<TableHead className={cn("w-1/3", hideHeaders && "invisible")}>
						{tI18n("WorkspacesPage.WorkspacesTable.template_0575f29d")}
					</TableHead>
					<TableHead className={cn("w-1/3", hideHeaders && "invisible")}>
						{tI18n("WorkspacesPage.WorkspacesTable.status_920e413c")}
					</TableHead>
					<TableHead className="w-0">
						<span className="sr-only">
							{tI18n("WorkspacesPage.WorkspacesTable.actions_ff8059dc")}
						</span>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="[&_td]:h-[72px]">
				{isLoading && <TableLoader />}
				{isEmpty && (
					<TableRow>
						<TableCell colSpan={999}>
							<WorkspacesEmpty
								templates={templates}
								isUsingFilter={isUsingFilter}
								canCreateTemplate={canCreateTemplate}
								canCreateWorkspace={canCreateWorkspace}
							/>
						</TableCell>
					</TableRow>
				)}
				{workspaces?.map((workspace) => {
					const checked = checkedWorkspaces.some((w) => w.id === workspace.id);
					const activeOrg = dashboard.organizations.find(
						(o) => o.id === workspace.organization_id,
					);

					return (
						<WorkspacesRow
							workspace={workspace}
							key={workspace.id}
							checked={checked}
						>
							<TableCell>
								<div className="flex items-center gap-5">
									<Checkbox
										data-testid={`checkbox-${workspace.id}`}
										disabled={cantBeChecked(workspace)}
										checked={checked}
										onClick={(e) => {
											e.stopPropagation();
										}}
										onCheckedChange={(checked) => {
											if (checked) {
												onCheckChange([...checkedWorkspaces, workspace]);
											} else {
												onCheckChange(
													checkedWorkspaces.filter(
														(w) => w.id !== workspace.id,
													),
												);
											}
										}}
										aria-label={tI18n(
											"WorkspacesPage.WorkspacesTable.select_workspace_value0_02968ddc",
											{
												value0: workspace.name,
											},
										)}
									/>
									<AvatarData
										title={
											<div className="flex items-center gap-1">
												<span className="whitespace-nowrap">
													{workspace.name}
												</span>
												{workspace.favorite && (
													<StarIcon className="size-icon-xs" />
												)}
												{workspace.outdated && (
													<WorkspaceOutdatedTooltip workspace={workspace} />
												)}
												{chatsByWorkspace?.[workspace.id] && (
													<Badge size="xs" variant="info" hover asChild>
														<Link
															to={`/agents/${chatsByWorkspace[workspace.id]}`}
															onClick={(e) => e.stopPropagation()}
															aria-label={tI18n(
																"WorkspacesPage.WorkspacesTable.view_agent_conversation_for_value0_9caa9f45",
																{
																	value0: workspace.name,
																},
															)}
														>
															{tI18n(
																"WorkspacesPage.WorkspacesTable.agent_11b39c93",
															)}
														</Link>
													</Badge>
												)}
											</div>
										}
										subtitle={
											<div className="flex items-center gap-1">
												<span className="sr-only">
													{tI18n(
														"WorkspacesPage.WorkspacesTable.owner_60d5bbcb",
													)}
												</span>
												<div className="flex gap-2">
													{workspace.owner_name}
													{workspace.shared_with &&
														workspace.shared_with.length > 0 && (
															<WorkspaceSharingIndicator
																sharedWith={workspace.shared_with}
																settingsPath={`/@${workspace.owner_name}/${workspace.name}/settings/sharing`}
															/>
														)}
												</div>
											</div>
										}
										avatar={
											<Avatar
												src={workspace.owner_avatar_url}
												fallback={workspace.owner_name}
												size="lg"
											/>
										}
									/>
								</div>
							</TableCell>
							<TableCell>
								<AvatarData
									title={
										<span className="whitespace-nowrap block max-w-52 text-ellipsis overflow-hidden">
											{getDisplayWorkspaceTemplateName(workspace)}
										</span>
									}
									subtitle={
										dashboard.showOrganizations && (
											<>
												<span className="sr-only">
													{tI18n(
														"WorkspacesPage.WorkspacesTable.organization_5300e286",
													)}
												</span>{" "}
												{activeOrg?.display_name || workspace.organization_name}
											</>
										)
									}
									avatar={
										<Avatar
											variant="icon"
											src={workspace.template_icon}
											fallback={getDisplayWorkspaceTemplateName(workspace)}
											size="lg"
										/>
									}
								/>
							</TableCell>
							<TableCell>
								<WorkspaceStatus workspace={workspace} />
							</TableCell>
							<WorkspaceActionsCell
								workspace={workspace}
								onActionSuccess={onActionSuccess}
								onActionError={onActionError}
							/>
						</WorkspacesRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

interface WorkspacesRowProps {
	workspace: Workspace;
	children?: ReactNode;
	checked: boolean;
}

const WorkspacesRow: FC<WorkspacesRowProps> = ({
	workspace,
	children,
	checked,
}) => {
	const navigate = useNavigate();

	const workspacePageLink = `/@${workspace.owner_name}/${workspace.name}`;
	const openLinkInNewTab = () => window.open(workspacePageLink, "_blank");
	const { role, hover, ...clickableProps } = useClickableTableRow({
		onMiddleClick: openLinkInNewTab,
		onClick: (event) => {
			// Order of booleans actually matters here for Windows-Mac compatibility;
			// meta key is Cmd on Macs, but on Windows, it's either the Windows key,
			// or the key does nothing at all (depends on the browser)
			const shouldOpenInNewTab =
				event.shiftKey || event.metaKey || event.ctrlKey;

			if (shouldOpenInNewTab) {
				openLinkInNewTab();
			} else {
				navigate(workspacePageLink);
			}
		},
	});

	return (
		<TableRow
			{...clickableProps}
			data-testid={`workspace-${workspace.id}`}
			className={cn([
				checked ? "bg-surface-secondary hover:bg-surface-secondary" : undefined,
				clickableProps.className,
			])}
		>
			{children}
		</TableRow>
	);
};

const TableLoader: FC = () => {
	return (
		<TableLoaderSkeleton>
			<TableRowSkeleton>
				<TableCell className="w-2/6">
					<div className="flex items-center gap-5">
						<Checkbox disabled />
						<AvatarDataSkeleton />
					</div>
				</TableCell>
				<TableCell className="w-2/6">
					<AvatarDataSkeleton />
				</TableCell>
				<TableCell className="w-2/6">
					<Skeleton className="h-4 w-1/2" />
				</TableCell>
				<TableCell className="w-0 ">
					<div className="flex gap-1 justify-end">
						<Skeleton className="size-10" />
						<Button size="icon-lg" variant="subtle" disabled>
							<EllipsisVerticalIcon aria-hidden="true" />
						</Button>
					</div>
				</TableCell>
			</TableRowSkeleton>
		</TableLoaderSkeleton>
	);
};

const cantBeChecked = (workspace: Workspace) => {
	return ["deleting", "pending"].includes(workspace.latest_build.status);
};

type WorkspaceActionsCellProps = {
	workspace: Workspace;
	onActionSuccess: () => Promise<void>;
	onActionError: (error: unknown) => void;
};

const WorkspaceActionsCell: FC<WorkspaceActionsCellProps> = ({
	workspace,
	onActionSuccess,
	onActionError,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const { user } = useAuthenticated();

	const queryClient = useQueryClient();
	const abilities = abilitiesByWorkspaceStatus(workspace, {
		canDebug: false,
		isOwner: user.roles.find((role) => role.name === "owner") !== undefined,
	});

	const startWorkspaceOptions = startWorkspace(workspace, queryClient);
	const startWorkspaceMutation = useMutation({
		...startWorkspaceOptions,
		onSuccess: async (build) => {
			startWorkspaceOptions.onSuccess(build);
			await onActionSuccess();
		},
		onError: onActionError,
	});

	const stopWorkspaceOptions = stopWorkspace(workspace, queryClient);
	const stopWorkspaceMutation = useMutation({
		...stopWorkspaceOptions,
		onSuccess: async (build) => {
			stopWorkspaceOptions.onSuccess(build);
			await onActionSuccess();
		},
		onError: onActionError,
	});

	const cancelJobOptions = cancelBuild(workspace, queryClient);
	const cancelBuildMutation = useMutation({
		...cancelJobOptions,
		onSuccess: async () => {
			cancelJobOptions.onSuccess();
			await onActionSuccess();
		},
		onError: onActionError,
	});

	const { data: latestVersion } = useQuery({
		...templateVersion(workspace.template_active_version_id),
		enabled: workspace.outdated,
	});
	const workspaceUpdate = useWorkspaceUpdate({
		workspace,
		latestVersion,
		onSuccess: onActionSuccess,
		onError: onActionError,
	});

	const deleteWorkspaceOptions = deleteWorkspace(workspace, queryClient);
	const deleteWorkspaceMutation = useMutation({
		...deleteWorkspaceOptions,
		onSuccess: async (build) => {
			deleteWorkspaceOptions.onSuccess(build);
			await onActionSuccess();
		},
		onError: onActionError,
	});

	const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
	const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

	const isRetrying =
		startWorkspaceMutation.isPending ||
		stopWorkspaceMutation.isPending ||
		deleteWorkspaceMutation.isPending;

	const retry = () => {
		switch (workspace.latest_build.transition) {
			case "start":
				startWorkspaceMutation.mutate({});
				break;
			case "stop":
				stopWorkspaceMutation.mutate({});
				break;
			case "delete":
				deleteWorkspaceMutation.mutate({});
				break;
		}
	};

	return (
		<TableCell
			onClick={(e) => {
				// Prevent the click in the actions to trigger the row click
				e.stopPropagation();
			}}
		>
			<div className="flex gap-1 justify-end">
				{workspace.latest_build.status === "running" &&
					(workspace.latest_app_status ? (
						<WorkspaceAppStatusLinks workspace={workspace} />
					) : (
						<WorkspaceApps workspace={workspace} />
					))}

				{abilities.actions.includes("start") && (
					<PrimaryAction
						onClick={() => startWorkspaceMutation.mutate({})}
						isLoading={startWorkspaceMutation.isPending}
						label={tI18n(
							"WorkspacesPage.WorkspacesTable.start_workspace_0e6b0b29",
						)}
					>
						<PlayIcon />
					</PrimaryAction>
				)}

				{abilities.actions.includes("updateAndStart") && (
					<>
						<PrimaryAction
							onClick={workspaceUpdate.update}
							isLoading={workspaceUpdate.isUpdating}
							label={tI18n(
								"WorkspacesPage.WorkspacesTable.update_and_start_workspace_5b42a2a3",
							)}
						>
							<RotateCcwIcon />
						</PrimaryAction>
						<WorkspaceUpdateDialogs {...workspaceUpdate.dialogProps} />
					</>
				)}

				{abilities.actions.includes("updateAndStartRequireActiveVersion") && (
					<>
						<PrimaryAction
							onClick={workspaceUpdate.update}
							isLoading={workspaceUpdate.isUpdating}
							label={tI18n(
								"WorkspacesPage.WorkspacesTable.this_template_requires_automatic_updates_on_work_2b6b3f60",
							)}
						>
							<PlayIcon />
						</PrimaryAction>
						<WorkspaceUpdateDialogs {...workspaceUpdate.dialogProps} />
					</>
				)}

				{abilities.actions.includes("updateAndRestart") && (
					<>
						<PrimaryAction
							onClick={workspaceUpdate.update}
							isLoading={workspaceUpdate.isUpdating}
							label={tI18n(
								"WorkspacesPage.WorkspacesTable.update_and_restart_workspace_e9cf8d0e",
							)}
						>
							<RotateCcwIcon />
						</PrimaryAction>
						<WorkspaceUpdateDialogs {...workspaceUpdate.dialogProps} />
					</>
				)}

				{abilities.actions.includes("updateAndRestartRequireActiveVersion") && (
					<>
						<PrimaryAction
							onClick={workspaceUpdate.update}
							isLoading={workspaceUpdate.isUpdating}
							label={tI18n(
								"WorkspacesPage.WorkspacesTable.this_template_requires_automatic_updates_on_work_b8d892e8",
							)}
						>
							<PlayIcon />
						</PrimaryAction>
						<WorkspaceUpdateDialogs {...workspaceUpdate.dialogProps} />
					</>
				)}

				{abilities.canCancel && (
					<PrimaryAction
						onClick={() => setIsCancelConfirmOpen(true)}
						isLoading={cancelBuildMutation.isPending}
						label={tI18n(
							"WorkspacesPage.WorkspacesTable.cancel_build_880dc4fb",
						)}
					>
						<BanIcon />
					</PrimaryAction>
				)}

				{abilities.actions.includes("retry") && (
					<PrimaryAction
						onClick={retry}
						isLoading={isRetrying}
						label={tI18n("WorkspacesPage.WorkspacesTable.retry_build_90b37eb6")}
					>
						<RefreshCcwIcon />
					</PrimaryAction>
				)}

				<WorkspaceMoreActions
					workspace={workspace}
					disabled={!abilities.canAcceptJobs}
					onStop={
						abilities.actions.includes("stop")
							? () => setIsStopConfirmOpen(true)
							: undefined
					}
					isStopping={stopWorkspaceMutation.isPending}
					onActionSuccess={onActionSuccess}
				/>
			</div>
			{/* Stop workspace confirmation dialog */}
			<ConfirmDialog
				open={isStopConfirmOpen}
				title={tI18n("WorkspacesPage.WorkspacesTable.stop_workspace_d7dca2f6")}
				description={tI18n(
					"WorkspacesPage.WorkspacesTable.are_you_sure_you_want_to_stop_the_workspace_valu_2403eed2",
					{
						value0: workspace.name,
					},
				)}
				confirmText={tI18n("WorkspacesPage.WorkspacesTable.stop_cae7d57b")}
				onClose={() => setIsStopConfirmOpen(false)}
				onConfirm={() => {
					stopWorkspaceMutation.mutate({});
					setIsStopConfirmOpen(false);
				}}
				type="delete"
			/>
			<WorkspaceBuildCancelDialog
				open={isCancelConfirmOpen}
				onClose={() => setIsCancelConfirmOpen(false)}
				onConfirm={() => {
					cancelBuildMutation.mutate();
					setIsCancelConfirmOpen(false);
				}}
				workspace={workspace}
			/>
		</TableCell>
	);
};

type PrimaryActionProps = PropsWithChildren<{
	label: string;
	isLoading?: boolean;
	onClick: () => void;
}>;

const PrimaryAction: FC<PrimaryActionProps> = ({
	onClick,
	isLoading,
	label,
	children,
}) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="icon-lg"
						onClick={onClick}
						disabled={isLoading}
					>
						<Spinner loading={isLoading}>{children}</Spinner>
						<span className="sr-only">{label}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

// The total number of apps that can be displayed in the workspace row
const WORKSPACE_APPS_SLOTS = 4;

type WorkspaceAppsProps = {
	workspace: Workspace;
};

const WorkspaceApps: FC<WorkspaceAppsProps> = ({ workspace }) => {
	const { t: tI18n } = useTranslation("workspaces");

	/**
	 * Coder is pretty flexible and allows an enormous variety of use cases, such
	 * as having multiple resources with many agents, but they are not common. The
	 * most common scenario is to have one single compute resource with one single
	 * agent containing all the apps. We get the apps from the first compute
	 * resource (they are sorted to return the compute resource first).
	 *
	 * For multi-agent workspaces with sub-agents we show the apps from the parent
	 * agent (the one without a `parent_id`). Sub-agents, such as those created by
	 * devcontainers, are skipped so agent ordering does not determine which apps
	 * appear.
	 *
	 * When a workspace has multiple parent-level agents we show the apps from the
	 * first one only; aggregating apps across agents is tracked separately.
	 */
	const agent = workspace.latest_build.resources
		.filter((r) => !r.hide)
		.at(0)
		?.agents?.find((a) => a.parent_id === null);
	if (!agent) {
		return null;
	}

	const builtinApps = new Set(agent.display_apps);
	builtinApps.delete("port_forwarding_helper");
	builtinApps.delete("ssh_helper");

	const remainingSlots = WORKSPACE_APPS_SLOTS - builtinApps.size;
	const userApps = agent.apps
		.filter(
			(app) =>
				(app.health === "healthy" || app.health === "disabled") && !app.hidden,
		)
		.slice(0, remainingSlots);

	const buttons: ReactNode[] = [];

	if (builtinApps.has("vscode")) {
		buttons.push(
			<VSCodeIconLink
				key="vscode"
				variant="vscode"
				label={tI18n("WorkspacesPage.WorkspacesTable.open_vscode_d3aefe4c")}
				owner={workspace.owner_name}
				workspace={workspace.name}
				agent={agent.name}
				folder={agent.expanded_directory}
			/>,
		);
	}

	if (builtinApps.has("vscode_insiders")) {
		buttons.push(
			<VSCodeIconLink
				key="vscode-insiders"
				variant="vscode-insiders"
				label={tI18n(
					"WorkspacesPage.WorkspacesTable.open_vscode_insiders_5963a965",
				)}
				owner={workspace.owner_name}
				workspace={workspace.name}
				agent={agent.name}
				folder={agent.expanded_directory}
			/>,
		);
	}

	for (const app of userApps) {
		buttons.push(
			<IconAppLink
				key={app.id}
				app={app}
				workspace={workspace}
				agent={agent}
			/>,
		);
	}

	if (builtinApps.has("web_terminal")) {
		const href = getTerminalHref({
			username: workspace.owner_name,
			workspace: workspace.name,
			agent: agent.name,
		});
		buttons.push(
			<BaseIconLink
				key="terminal"
				href={href}
				onClick={(e) => {
					e.preventDefault();
					openAppInNewWindow(href);
				}}
				label={tI18n("WorkspacesPage.WorkspacesTable.open_terminal_ae088e14")}
			>
				<SquareTerminalIcon className="size-7!" />
			</BaseIconLink>,
		);
	}

	buttons.push();

	return buttons;
};

type WorkspaceAppStatusLinksProps = {
	workspace: Workspace;
};

const WorkspaceAppStatusLinks: FC<WorkspaceAppStatusLinksProps> = ({
	workspace,
}) => {
	const status = workspace.latest_app_status;
	const appWithAgent = status
		? findWorkspaceAppWithAgent(workspace, status.agent_id, status.app_id)
		: undefined;

	return (
		<>
			{appWithAgent && (
				<IconAppLink
					app={appWithAgent}
					workspace={workspace}
					agent={appWithAgent.agent}
				/>
			)}

			{status?.uri && status?.uri !== "n/a" && (
				<BaseIconLink label={status.uri} href={status.uri} target="_blank">
					{status.uri.startsWith("file://") ? (
						<FileIcon />
					) : (
						<ExternalLinkIcon />
					)}
				</BaseIconLink>
			)}
		</>
	);
};

type IconAppLinkProps = {
	app: WorkspaceApp;
	workspace: Workspace;
	agent: WorkspaceAgent;
};

const IconAppLink: FC<IconAppLinkProps> = ({ app, workspace, agent }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const link = useAppLink(app, {
		workspace,
		agent,
	});

	// A malformed external app URL can't be opened. Render a non-navigating
	// icon with an explanatory tooltip instead of a broken link.
	if (!isAppUrlValid(app)) {
		return (
			<BaseIconLink
				key={app.id}
				label={tI18n(
					"WorkspacesPage.WorkspacesTable.value0_has_an_invalid_url_846df5cb",
					{
						value0: link.label,
					},
				)}
				onClick={() => {}}
			>
				{app.icon ? (
					<ExternalImage src={app.icon} />
				) : (
					<CircleAlertIcon
						aria-hidden="true"
						className="size-icon-sm text-content-warning"
					/>
				)}
			</BaseIconLink>
		);
	}

	return (
		<BaseIconLink
			key={app.id}
			label={tI18n("WorkspacesPage.WorkspacesTable.open_value0_b50808ac", {
				value0: link.label,
			})}
			href={link.href}
			onClick={link.onClick}
		>
			<ExternalImage src={app.icon ?? "/icon/widgets.svg"} />
		</BaseIconLink>
	);
};

type VSCodeIconLinkProps = {
	variant: "vscode" | "vscode-insiders";
	label: string;
	owner: string;
	workspace: string;
	agent: string;
	folder?: string;
};

// Generates an API key on click instead of on page load, since
// key generation is a POST request that should only fire when
// the user actually wants to open VS Code.
const VSCodeIconLink: FC<VSCodeIconLinkProps> = ({
	variant,
	label,
	owner,
	workspace,
	agent,
	folder,
}) => {
	const generateKeyMutation = useMutation({
		mutationFn: () => API.getApiKey(),
		onSuccess: ({ key }) => {
			// We use a `location.href` here instead of a `navigate` because
			// these are protocol-specific links.
			location.href = getVSCodeHref(variant, {
				owner,
				workspace,
				token: key,
				agent,
				folder,
			});
		},
	});

	return (
		<BaseIconLink
			label={label}
			isLoading={generateKeyMutation.isPending}
			onClick={() => {
				if (!generateKeyMutation.isPending) {
					generateKeyMutation.mutate();
				}
			}}
		>
			<ExternalImage
				src={
					variant === "vscode" ? "/icon/code.svg" : "/icon/code-insiders.svg"
				}
				alt=""
			/>
		</BaseIconLink>
	);
};

type BaseIconLinkCommonProps = PropsWithChildren<{
	label: string;
	isLoading?: boolean;
}>;

type BaseIconLinkAnchorProps = BaseIconLinkCommonProps & {
	href: string;
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	target?: string;
};

type BaseIconLinkButtonProps = BaseIconLinkCommonProps & {
	href?: never;
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

type BaseIconLinkProps = BaseIconLinkAnchorProps | BaseIconLinkButtonProps;

const BaseIconLink: FC<BaseIconLinkProps> = ({
	isLoading,
	label,
	children,
	...rest
}) => {
	const loadingClass = isLoading ? "animate-pulse" : "";

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					{rest.href !== undefined ? (
						<Button
							variant="outline"
							size="icon-lg"
							asChild
							disabled={isLoading}
						>
							<a
								target={rest.target}
								className={loadingClass}
								href={rest.href}
								onClick={(e) => {
									e.stopPropagation();
									rest.onClick?.(e);
								}}
							>
								{children}
								<span className="sr-only">{label}</span>
							</a>
						</Button>
					) : (
						<Button
							variant="outline"
							size="icon-lg"
							className={loadingClass}
							onClick={(e) => {
								e.stopPropagation();
								rest.onClick(e);
							}}
							disabled={isLoading}
						>
							{children}
							<span className="sr-only">{label}</span>
						</Button>
					)}
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
