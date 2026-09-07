import { cn } from "cn";
import { ChevronLeftIcon, CircleDollarSignIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link as RouterLink } from "react-router";
import { workspaceQuota } from "#/api/queries/workspaceQuota";
import type * as TypesGen from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import {
	Topbar,
	TopbarAvatar,
	TopbarData,
	TopbarDivider,
	TopbarIcon,
	TopbarIconButton,
} from "#/components/FullPageLayout/Topbar";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverTrigger,
} from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import { WorkspaceStatusIndicator } from "#/modules/workspaces/WorkspaceStatusIndicator/WorkspaceStatusIndicator";
import { displayDormantDeletion } from "#/utils/dormant";
import { formatDate } from "#/utils/time";
import type { WorkspacePermissions } from "../../modules/workspaces/permissions";
import { WorkspaceActions } from "./WorkspaceActions/WorkspaceActions";
import { WorkspaceNotifications } from "./WorkspaceNotifications/WorkspaceNotifications";
import { WorkspaceScheduleControls } from "./WorkspaceScheduleControls";

const BREADCRUMB_SEGMENT_CLASS = cn(
	"flex items-center flex-row flex-nowrap gap-2",
	"max-w-40 whitespace-nowrap cursor-default",
);
const BREADCRUMB_TEXT_CLASS = "overflow-x-hidden text-ellipsis";

interface WorkspaceTopbarProps {
	isUpdating: boolean;
	isRestarting: boolean;
	workspace: TypesGen.Workspace;
	template: TypesGen.Template;
	permissions: WorkspacePermissions;
	latestVersion?: TypesGen.TemplateVersion;
	handleStart: (buildParameters?: TypesGen.WorkspaceBuildParameter[]) => void;
	handleStop: () => void;
	handleRestart: (buildParameters?: TypesGen.WorkspaceBuildParameter[]) => void;
	handleUpdate: () => void;
	handleCancel: () => void;
	handleDormantActivate: () => void;
	handleRetry: (buildParameters?: TypesGen.WorkspaceBuildParameter[]) => void;
	handleDebug: (buildParameters?: TypesGen.WorkspaceBuildParameter[]) => void;
	handleToggleFavorite: () => void;
}

export const WorkspaceTopbar: FC<WorkspaceTopbarProps> = ({
	workspace,
	template,
	latestVersion,
	permissions,
	isUpdating,
	isRestarting,
	handleStart,
	handleStop,
	handleRestart,
	handleUpdate,
	handleCancel,
	handleDormantActivate,
	handleToggleFavorite,
	handleRetry,
	handleDebug,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const { entitlements, organizations, showOrganizations } = useDashboard();
	const getLink = useLinks();

	// Quota
	const hasDailyCost = workspace.latest_build.daily_cost > 0;
	const { data: quota } = useQuery({
		...workspaceQuota(workspace.organization_name, workspace.owner_name),

		// Don't need to tie the enabled condition to showOrganizations because
		// even if the customer hasn't enabled the orgs enterprise feature, all
		// workspaces have an associated organization under the hood
		enabled: hasDailyCost,
	});

	// Dormant
	const allowAdvancedScheduling =
		entitlements.features.advanced_template_scheduling.enabled;
	// This check can be removed when https://github.com/coder/coder/milestone/19
	// is merged up
	const shouldDisplayDormantData = displayDormantDeletion(
		workspace,
		allowAdvancedScheduling,
	);

	const activeOrg = organizations.find(
		(org) => org.id === workspace.organization_id,
	);

	const orgDisplayName = activeOrg?.display_name || workspace.organization_name;

	const isImmutable =
		workspace.latest_build.status === "deleted" ||
		workspace.latest_build.status === "deleting";

	const templateLink = getLink(
		linkToTemplate(workspace.organization_name, workspace.template_name),
	);

	return (
		<Topbar className="[grid-area:topbar] flex-wrap gap-y-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<TopbarIconButton asChild>
						<RouterLink
							to="/workspaces"
							aria-label={tI18n(
								"WorkspacePage.WorkspaceTopbar.back_to_workspaces_17474371",
							)}
						>
							<ChevronLeftIcon className="size-icon-sm" />
						</RouterLink>
					</TopbarIconButton>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n("WorkspacePage.WorkspaceTopbar.back_to_workspaces_17474371")}
				</TooltipContent>
			</Tooltip>
			<div className="flex items-center gap-y-6 gap-x-2 flex-wrap px-3 py-2 mr-auto">
				<TopbarData className="flex-wrap">
					<OwnerBreadcrumb
						ownerName={workspace.owner_name}
						ownerAvatarUrl={workspace.owner_avatar_url}
					/>

					{showOrganizations && (
						<>
							<TopbarDivider />
							<OrganizationBreadcrumb
								orgName={orgDisplayName}
								orgIconUrl={activeOrg?.icon}
								orgPageUrl={`/organizations/${encodeURIComponent(workspace.organization_name)}`}
							/>
						</>
					)}

					<TopbarDivider />

					<WorkspaceBreadcrumb
						workspaceName={workspace.name}
						templateIconUrl={workspace.template_icon}
						rootTemplateUrl={templateLink}
						templateVersionName={workspace.latest_build.template_version_name}
						templateDisplayName={
							workspace.template_display_name || workspace.template_name
						}
						latestBuildVersionName={
							workspace.latest_build.template_version_name
						}
					/>
				</TopbarData>

				{quota && quota.budget > 0 && (
					<RouterLink
						to={
							showOrganizations
								? `/workspaces?filter=organization:${encodeURIComponent(workspace.organization_name)}`
								: "/workspaces"
						}
						title={
							showOrganizations
								? tI18n(
										"WorkspacePage.WorkspaceTopbar.see_affected_workspaces_for_value0_a10454fc",
										{
											value0: orgDisplayName,
										},
									)
								: tI18n(
										"WorkspacePage.WorkspaceTopbar.see_affected_workspaces_a81b73a3",
									)
						}
						className="text-inherit no-underline"
					>
						<TopbarData>
							<TopbarIcon>
								<CircleDollarSignIcon
									className="size-icon-sm"
									aria-label={tI18n(
										"WorkspacePage.WorkspaceTopbar.daily_usage_4e830b73",
									)}
								/>
							</TopbarIcon>

							<span>
								{workspace.latest_build.daily_cost}{" "}
								<span className="text-content-secondary">
									{tI18n("WorkspacePage.WorkspaceTopbar.credits_of_466458a5")}
								</span>{" "}
								{quota.budget}
							</span>
						</TopbarData>
					</RouterLink>
				)}

				{shouldDisplayDormantData && (
					<TopbarData>
						<TopbarIcon>
							<TrashIcon />
						</TopbarIcon>
						<RouterLink
							to={`${templateLink}/settings/schedule`}
							title={tI18n(
								"WorkspacePage.WorkspaceTopbar.schedule_settings_7da983ff",
							)}
							className="text-inherit no-underline"
						>
							{workspace.deleting_at ? (
								<>
									{tI18n("WorkspacePage.WorkspaceTopbar.deletion_on_d02bd02f")}
									{formatDate(new Date(workspace.deleting_at))}
								</>
							) : (
								tI18n("WorkspacePage.WorkspaceTopbar.deletion_soon_f7d3a87d")
							)}
						</RouterLink>
					</TopbarData>
				)}
			</div>
			{!isImmutable && (
				<div className="flex flex-wrap grow items-center justify-end gap-x-4 gap-y-2 min-h-12">
					<WorkspaceScheduleControls
						workspace={workspace}
						template={template}
						canUpdateSchedule={permissions.updateWorkspace}
					/>

					<WorkspaceNotifications
						workspace={workspace}
						template={template}
						latestVersion={latestVersion}
						permissions={permissions}
						onRestartWorkspace={handleRestart}
						onUpdateWorkspace={handleUpdate}
						onActivateWorkspace={handleDormantActivate}
					/>

					<WorkspaceStatusIndicator workspace={workspace} />

					<WorkspaceActions
						workspace={workspace}
						permissions={permissions}
						isUpdating={isUpdating}
						isRestarting={isRestarting}
						handleStart={handleStart}
						handleStop={handleStop}
						handleRestart={handleRestart}
						handleUpdate={handleUpdate}
						handleCancel={handleCancel}
						handleRetry={handleRetry}
						handleDebug={handleDebug}
						handleDormantActivate={handleDormantActivate}
						handleToggleFavorite={handleToggleFavorite}
					/>
				</div>
			)}
		</Topbar>
	);
};

type OwnerBreadcrumbProps = Readonly<{
	ownerName: string;
	ownerAvatarUrl: string;
}>;

const OwnerBreadcrumb: FC<OwnerBreadcrumbProps> = ({
	ownerName,
	ownerAvatarUrl,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<HelpPopover>
			<HelpPopoverTrigger asChild>
				<span className={BREADCRUMB_SEGMENT_CLASS}>
					<Avatar size="sm" fallback={ownerName} src={ownerAvatarUrl} />
					<span className={BREADCRUMB_TEXT_CLASS}>{ownerName}</span>
				</span>
			</HelpPopoverTrigger>
			<HelpPopoverContent align="center">
				<AvatarData
					title={ownerName}
					subtitle={tI18n("WorkspacePage.WorkspaceTopbar.owner_4b1b8aa3")}
					src={ownerAvatarUrl}
				/>
			</HelpPopoverContent>
		</HelpPopover>
	);
};

type OrganizationBreadcrumbProps = Readonly<{
	orgName: string;
	orgPageUrl?: string;
	orgIconUrl?: string;
}>;

const OrganizationBreadcrumb: FC<OrganizationBreadcrumbProps> = ({
	orgName,
	orgPageUrl,
	orgIconUrl,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<HelpPopover>
			<HelpPopoverTrigger asChild>
				<span className={BREADCRUMB_SEGMENT_CLASS}>
					<Avatar
						size="sm"
						variant="icon"
						src={orgIconUrl}
						fallback={orgName}
					/>
					<span className={BREADCRUMB_TEXT_CLASS}>{orgName}</span>
				</span>
			</HelpPopoverTrigger>
			<HelpPopoverContent align="center">
				<AvatarData
					title={
						orgPageUrl ? (
							<Link asChild showExternalIcon={false} className="text-inherit">
								<RouterLink to={orgPageUrl}>{orgName}</RouterLink>
							</Link>
						) : (
							orgName
						)
					}
					subtitle={tI18n(
						"WorkspacePage.WorkspaceTopbar.organization_d764d425",
					)}
					avatar={
						orgIconUrl && (
							<Avatar
								variant="icon"
								src={orgIconUrl}
								fallback={orgName}
								size="md"
							/>
						)
					}
					imgFallbackText={orgName}
				/>
			</HelpPopoverContent>
		</HelpPopover>
	);
};

type WorkspaceBreadcrumbProps = Readonly<{
	workspaceName: string;
	templateIconUrl: string;
	rootTemplateUrl: string;
	templateVersionName: string;
	latestBuildVersionName: string;
	templateDisplayName: string;
}>;

const WorkspaceBreadcrumb: FC<WorkspaceBreadcrumbProps> = ({
	workspaceName,
	templateIconUrl,
	rootTemplateUrl,
	templateVersionName,
	latestBuildVersionName,
	templateDisplayName,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<div className="flex items-center">
			<HelpPopover>
				<HelpPopoverTrigger asChild>
					<span className={BREADCRUMB_SEGMENT_CLASS}>
						<TopbarAvatar
							src={templateIconUrl}
							fallback={templateDisplayName}
						/>

						<span className={cn(BREADCRUMB_TEXT_CLASS, "font-medium")}>
							{workspaceName}
						</span>
					</span>
				</HelpPopoverTrigger>

				<HelpPopoverContent align="center">
					<AvatarData
						title={
							<Link asChild showExternalIcon={false} className="text-inherit">
								<RouterLink to={rootTemplateUrl}>
									{templateDisplayName}
								</RouterLink>
							</Link>
						}
						subtitle={
							<Link asChild showExternalIcon={false} className="text-inherit">
								<RouterLink
									to={`${rootTemplateUrl}/versions/${encodeURIComponent(templateVersionName)}`}
								>
									{tI18n("WorkspacePage.WorkspaceTopbar.version_74f20322")}
									{latestBuildVersionName}
								</RouterLink>
							</Link>
						}
						avatar={
							<Avatar
								variant="icon"
								src={templateIconUrl}
								fallback={templateDisplayName}
								size="md"
							/>
						}
						imgFallbackText={templateDisplayName}
					/>
				</HelpPopoverContent>
			</HelpPopover>
			<CopyButton
				text={workspaceName}
				label={tI18n(
					"WorkspacePage.WorkspaceTopbar.copy_workspace_name_ba63192e",
				)}
			/>
		</div>
	);
};
