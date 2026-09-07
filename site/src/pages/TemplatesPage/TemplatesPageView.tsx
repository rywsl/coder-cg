import { cn } from "cn";
import { ArrowRightIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router";
import { hasError, isApiValidationError } from "#/api/errors";
import type {
	AuthorizationResponse,
	Template,
	TemplateExample,
} from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { AvatarDataSkeleton } from "#/components/Avatar/AvatarDataSkeleton";
import { Badge } from "#/components/Badge/Badge";
import { DeprecatedBadge } from "#/components/Badge/PresetBadges";
import { Button } from "#/components/Button/Button";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverLink,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
} from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import { Skeleton } from "#/components/Skeleton/Skeleton";
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
import { useClickableTableRow } from "#/hooks/useClickableTableRow";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import type { WorkspacePermissions } from "#/modules/permissions/workspaces";
import { createDayString } from "#/utils/createDayString";
import { docs } from "#/utils/docs";
import {
	formatTemplateActiveDevelopersLabel,
	formatTemplateBuildTime,
} from "#/utils/templates";
import { EmptyTemplates } from "./EmptyTemplates";
import { type TemplateFilterState, TemplatesFilter } from "./TemplatesFilter";

const ClassicParameterFlowAlert: FC<{ templateCount: number }> = ({
	templateCount,
}) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<Alert severity="warning" prominent className="mt-6">
			<AlertTitle>
				{templateCount === 1
					? tI18n(
							"TemplatesPage.TemplatesPageView.1_template_still_uses_classic_parameters_fe34d2de",
						)
					: tI18n(
							"TemplatesPage.TemplatesPageView.value0_templates_still_use_classic_parameters_de9d39dc",
							{
								value0: templateCount,
							},
						)}
			</AlertTitle>
			<AlertDescription>
				{tI18n(
					"TemplatesPage.TemplatesPageView.classic_parameters_are_deprecated_switch_to_dyna_9f7cbdf2",
				)}{" "}
				<Link
					href={docs("/admin/templates/extending-templates/dynamic-parameters")}
					target="_blank"
					rel="noreferrer"
				>
					{tI18n("TemplatesPage.TemplatesPageView.view_docs_61479fda")}
					<span className="sr-only">
						{tI18n("TemplatesPage.TemplatesPageView.opens_in_new_tab_541f18a6")}
					</span>
				</Link>
			</AlertDescription>
		</Alert>
	);
};

const TemplateHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverTitle>
					{tI18n("TemplatesPage.TemplatesPageView.what_is_a_template_00a8b592")}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"TemplatesPage.TemplatesPageView.with_templates_you_can_create_a_common_configura_f5e85c91",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink href={docs("/admin/templates")}>
						{tI18n("TemplatesPage.TemplatesPageView.manage_templates_cb930c76")}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</HelpPopoverContent>
		</HelpPopover>
	);
};

interface TemplateActionsProps {
	template: Template;
	workspacePermissions: Record<string, WorkspacePermissions> | undefined;
	templatePageLink: string;
}

const TemplateActions: FC<TemplateActionsProps> = ({
	template,
	workspacePermissions,
	templatePageLink,
}) => {
	const { t: tI18n } = useTranslation("templates");

	if (template.deleted) {
		return null;
	}

	if (template.deprecated) {
		return <DeprecatedBadge />;
	}

	if (
		!workspacePermissions?.[template.organization_id]?.createWorkspaceForUserID
	) {
		return null;
	}

	return (
		<Button
			asChild
			variant="outline"
			size="sm"
			className="transition-none group-hover:border-border-secondary"
			title={tI18n(
				"TemplatesPage.TemplatesPageView.create_a_workspace_using_the_value0_template_4b56eaa3",
				{
					value0: template.display_name,
				},
			)}
			onClick={(e) => {
				e.stopPropagation();
			}}
		>
			<RouterLink to={`${templatePageLink}/workspace`}>
				<ArrowRightIcon />
				{tI18n("TemplatesPage.TemplatesPageView.create_workspace_c63c14cf")}
			</RouterLink>
		</Button>
	);
};

interface TemplateRowProps {
	canUpdateTemplate: boolean;
	showOrganizations: boolean;
	template: Template;
	workspacePermissions: Record<string, WorkspacePermissions> | undefined;
}

const TemplateRow: FC<TemplateRowProps> = ({
	canUpdateTemplate,
	showOrganizations,
	template,
	workspacePermissions,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const getLink = useLinks();
	const templatePageLink = getLink(
		linkToTemplate(template.organization_name, template.name),
	);
	const navigate = useNavigate();

	const developerCount = formatTemplateActiveDevelopersLabel(
		template.active_user_count,
	);

	const clickableRow = useClickableTableRow({
		onClick: () => navigate(templatePageLink),
	});

	return (
		<TableRow
			key={template.id}
			data-testid={`template-${template.id}`}
			{...clickableRow}
			className={cn("group", clickableRow.className)}
		>
			<TableCell>
				<AvatarData
					title={
						<span className="flex flex-row items-center gap-2">
							{template.display_name || template.name}
							{canUpdateTemplate && template.use_classic_parameter_flow && (
								<Badge
									variant="warning"
									size="sm"
									className="border-0 shadow-none"
								>
									<TriangleAlertIcon aria-hidden="true" />
									{tI18n("TemplatesPage.TemplatesPageView.deprecated_6b2e8f83")}
								</Badge>
							)}
						</span>
					}
					subtitle={template.description}
					avatar={
						<Avatar
							size="lg"
							variant="icon"
							src={template.icon}
							fallback={template.display_name || template.name}
						/>
					}
				/>
			</TableCell>
			<TableCell className="text-content-secondary">
				{showOrganizations ? (
					<AvatarData
						title={template.organization_display_name}
						subtitle={tI18n(
							"TemplatesPage.TemplatesPageView.used_by_value0_2401cb33",
							{
								value0: developerCount,
							},
						)}
						avatar={<Avatar variant="icon" src={template.organization_icon} />}
					/>
				) : (
					developerCount
				)}
			</TableCell>
			<TableCell className="text-content-secondary">
				{formatTemplateBuildTime(template.build_time_stats.start.P50)}
			</TableCell>
			<TableCell data-pixel="ignore" className="text-content-secondary">
				{createDayString(template.updated_at)}
			</TableCell>
			<TableCell className="whitespace-nowrap">
				<TemplateActions
					template={template}
					workspacePermissions={workspacePermissions}
					templatePageLink={templatePageLink}
				/>
			</TableCell>
		</TableRow>
	);
};

interface TemplatesPageViewProps {
	error?: unknown;
	filterState: TemplateFilterState;
	showOrganizations: boolean;
	canCreateTemplates: boolean;
	templateBuilderEnabled: boolean;
	examples: TemplateExample[] | undefined;
	templates: Template[] | undefined;
	templateUpdatePermissions: AuthorizationResponse;
	workspacePermissions: Record<string, WorkspacePermissions> | undefined;
}

export const TemplatesPageView: FC<TemplatesPageViewProps> = ({
	error,
	filterState,
	showOrganizations,
	canCreateTemplates,
	templateBuilderEnabled,
	examples,
	templates,
	templateUpdatePermissions,
	workspacePermissions,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const isLoading = !templates;
	const isEmpty = !isLoading && templates.length === 0;
	const classicParameterFlowTemplateCount =
		templates?.filter(
			(template) =>
				template.use_classic_parameter_flow &&
				templateUpdatePermissions[template.organization_id],
		).length ?? 0;
	const showClassicParameterFlow = classicParameterFlowTemplateCount > 0;

	return (
		<Margins className="pb-12">
			{showClassicParameterFlow && (
				<ClassicParameterFlowAlert
					templateCount={classicParameterFlowTemplateCount}
				/>
			)}
			<PageHeader
				actions={
					canCreateTemplates && (
						<Button asChild size="lg">
							<RouterLink
								to={
									templateBuilderEnabled
										? "/templates/new/builder"
										: "/starter-templates"
								}
							>
								<PlusIcon />
								{tI18n("TemplatesPage.TemplatesPageView.new_template_30d87ec4")}
							</RouterLink>
						</Button>
					)
				}
			>
				<PageHeaderTitle>
					<div className="flex flex-row gap-2 items-center">
						{tI18n("TemplatesPage.TemplatesPageView.templates_56b564b7")}
						<TemplateHelpPopover />
					</div>
				</PageHeaderTitle>
				<PageHeaderSubtitle>
					{tI18n(
						"TemplatesPage.TemplatesPageView.select_a_template_to_create_a_workspace_8b30fe76",
					)}
				</PageHeaderSubtitle>
			</PageHeader>
			<TemplatesFilter
				filter={filterState.filter}
				error={error}
				userMenu={filterState.menus.user}
			/>
			{/* Validation errors are shown on the filter, other errors are an alert box. */}
			{hasError(error) && !isApiValidationError(error) && (
				<ErrorAlert error={error} />
			)}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[35%]">
							{tI18n("TemplatesPage.TemplatesPageView.name_dcd1d522")}
						</TableHead>
						<TableHead className="w-[15%]">
							{showOrganizations
								? tI18n("TemplatesPage.TemplatesPageView.organization_d764d425")
								: tI18n("TemplatesPage.TemplatesPageView.used_by_681bf81a")}
						</TableHead>
						<TableHead className="w-[10%]">
							{tI18n("TemplatesPage.TemplatesPageView.build_time_8e28a482")}
						</TableHead>
						<TableHead className="w-[15%]">
							{tI18n("TemplatesPage.TemplatesPageView.last_updated_382ac5f3")}
						</TableHead>
						<TableHead className="w-[1%]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableLoader />
					) : isEmpty ? (
						<EmptyTemplates
							canCreateTemplates={canCreateTemplates}
							templateBuilderEnabled={templateBuilderEnabled}
							examples={examples ?? []}
							isUsingFilter={filterState.filter.used}
						/>
					) : (
						templates.map((template) => (
							<TemplateRow
								key={template.id}
								canUpdateTemplate={
									templateUpdatePermissions[template.organization_id] ?? false
								}
								showOrganizations={showOrganizations}
								template={template}
								workspacePermissions={workspacePermissions}
							/>
						))
					)}
				</TableBody>
			</Table>
		</Margins>
	);
};

const TableLoader: FC = () => {
	return (
		<TableLoaderSkeleton>
			<TableRowSkeleton>
				<TableCell>
					<AvatarDataSkeleton />
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
			</TableRowSkeleton>
		</TableLoaderSkeleton>
	);
};
