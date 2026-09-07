import {
	CopyIcon,
	DownloadIcon,
	EditIcon,
	EllipsisVerticalIcon,
	PlusIcon,
	SettingsIcon,
	TrashIcon,
} from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link as RouterLink, useNavigate } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import { workspaces } from "#/api/queries/workspaces";
import type {
	AuthorizationResponse,
	Template,
	TemplateVersion,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { DeprecatedBadge } from "#/components/Badge/PresetBadges";
import { Button, Button as ShadcnButton } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Margins } from "#/components/Margins/Margins";
import { MemoizedInlineMarkdown } from "#/components/Markdown/InlineMarkdown";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import type { WorkspacePermissions } from "#/modules/permissions/workspaces";
import { TemplateStats } from "./TemplateStats";
import { useDeletionDialogState } from "./useDeletionDialogState";

type TemplateMenuProps = {
	organizationName: string;
	templateName: string;
	templateVersion: string;
	templateId: string;
	fileId: string;
	onDelete: () => void;
};

const TemplateMenu: FC<TemplateMenuProps> = ({
	organizationName,
	templateName,
	templateVersion,
	templateId,
	fileId,
	onDelete,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const dialogState = useDeletionDialogState(
		templateId,
		onDelete,
		templateName,
	);
	const navigate = useNavigate();
	const getLink = useLinks();
	const queryText = `organization:${organizationName} template:${templateName}`;
	const workspaceCountQuery = useQuery({
		...workspaces({ q: queryText }),
		select: (res) => res.count,
	});
	const safeToDeleteTemplate = workspaceCountQuery.data === 0;

	const templateLink = getLink(linkToTemplate(organizationName, templateName));

	const handleExport = async (format?: "zip") => {
		try {
			const blob = await API.downloadTemplateVersion(fileId, format);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			const extension = format === "zip" ? "zip" : "tar";
			link.download = `${templateName}-${templateVersion}.${extension}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to export template:", error);
			toast.error(
				tI18n(
					"TemplatePage.TemplatePageHeader.failed_to_export_template_6ff60f15",
				),
				{
					description: getErrorDetail(error),
				},
			);
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<ShadcnButton
						size="icon-lg"
						variant="subtle"
						aria-label={tI18n(
							"TemplatePage.TemplatePageHeader.open_menu_b40b3713",
						)}
					>
						<EllipsisVerticalIcon aria-hidden="true" />
						<span className="sr-only">
							{tI18n("TemplatePage.TemplatePageHeader.open_menu_b40b3713")}
						</span>
					</ShadcnButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<RouterLink to={`${templateLink}/settings`}>
							<SettingsIcon className="size-icon-sm" />
							{tI18n("TemplatePage.TemplatePageHeader.settings_74a883a0")}
						</RouterLink>
					</DropdownMenuItem>

					<DropdownMenuItem asChild>
						<RouterLink to={`${templateLink}/versions/${templateVersion}/edit`}>
							<EditIcon />
							{tI18n("TemplatePage.TemplatePageHeader.edit_files_562123f8")}
						</RouterLink>
					</DropdownMenuItem>

					<DropdownMenuItem asChild>
						<RouterLink to={`/templates/new?fromTemplate=${templateId}`}>
							<CopyIcon className="size-icon-sm" />
							{tI18n("TemplatePage.TemplatePageHeader.duplicate_5d202208")}
						</RouterLink>
					</DropdownMenuItem>

					<DropdownMenuItem onClick={() => handleExport()}>
						<DownloadIcon className="size-icon-sm" />
						{tI18n("TemplatePage.TemplatePageHeader.export_as_tar_41900c57")}
					</DropdownMenuItem>

					<DropdownMenuItem onClick={() => handleExport("zip")}>
						<DownloadIcon className="size-icon-sm" />
						{tI18n("TemplatePage.TemplatePageHeader.export_as_zip_b1ceca2a")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-content-destructive focus:text-content-destructive"
						onClick={dialogState.openDeleteConfirmation}
					>
						<TrashIcon />
						{tI18n("TemplatePage.TemplatePageHeader.delete_9ce78fe3")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{safeToDeleteTemplate ? (
				<DeleteDialog
					isOpen={dialogState.isDeleteDialogOpen}
					onConfirm={dialogState.confirmDelete}
					onCancel={dialogState.cancelDeleteConfirmation}
					entity="template"
					name={templateName}
				/>
			) : (
				<ConfirmDialog
					type="info"
					title={tI18n(
						"TemplatePage.TemplatePageHeader.unable_to_delete_7947dd5a",
					)}
					hideCancel={false}
					open={dialogState.isDeleteDialogOpen}
					onClose={dialogState.cancelDeleteConfirmation}
					confirmText={tI18n(
						"TemplatePage.TemplatePageHeader.see_workspaces_d10011e1",
					)}
					confirmLoading={workspaceCountQuery.status !== "success"}
					onConfirm={() => {
						navigate({
							pathname: "/workspaces",
							search: new URLSearchParams({ filter: queryText }).toString(),
						});
					}}
					description={
						<>
							{workspaceCountQuery.isSuccess && (
								<>
									{tI18n(
										"TemplatePage.TemplatePageHeader.this_template_is_used_by_b6bed58d",
									)}{" "}
									<strong>
										{workspaceCountQuery.data}
										{tI18n(
											"TemplatePage.TemplatePageHeader.workspace_4be0369b",
										)}
										{workspaceCountQuery.data === 1
											? ""
											: tI18n("TemplatePage.TemplatePageHeader.s_043a7187")}
									</strong>
									{tI18n(
										"TemplatePage.TemplatePageHeader.please_delete_all_related_workspaces_before_dele_38081dca",
									)}
								</>
							)}

							{workspaceCountQuery.isLoading &&
								tI18n(
									"TemplatePage.TemplatePageHeader.loading_information_about_workspaces_used_by_thi_2612fd65",
								)}

							{workspaceCountQuery.isError &&
								tI18n(
									"TemplatePage.TemplatePageHeader.unable_to_determine_workspaces_used_by_this_temp_1f1ff23c",
								)}
						</>
					}
				/>
			)}
		</>
	);
};

type TemplatePageHeaderProps = {
	template: Template;
	activeVersion: TemplateVersion;
	permissions: AuthorizationResponse;
	workspacePermissions: WorkspacePermissions;
	onDeleteTemplate: () => void;
};

export const TemplatePageHeader: FC<TemplatePageHeaderProps> = ({
	template,
	activeVersion,
	permissions,
	workspacePermissions,
	onDeleteTemplate,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const getLink = useLinks();
	const templateLink = getLink(
		linkToTemplate(template.organization_name, template.name),
	);

	return (
		<Margins>
			<PageHeader
				actions={
					<>
						{!template.deprecated &&
							workspacePermissions.createWorkspaceForUserID && (
								<Button asChild>
									<RouterLink to={`${templateLink}/workspace`}>
										<PlusIcon />
										{tI18n(
											"TemplatePage.TemplatePageHeader.create_workspace_c63c14cf",
										)}
									</RouterLink>
								</Button>
							)}

						{permissions.canUpdateTemplate && (
							<TemplateMenu
								organizationName={template.organization_name}
								templateId={template.id}
								templateName={template.name}
								templateVersion={activeVersion.name}
								fileId={activeVersion.job.file_id}
								onDelete={onDeleteTemplate}
							/>
						)}
					</>
				}
			>
				<div className="flex flex-row gap-4">
					<Avatar
						size="lg"
						variant="icon"
						src={template.icon}
						fallback={template.name}
					/>
					<div>
						<div className="flex flex-row items-center gap-2">
							<PageHeaderTitle>
								{template.display_name.length > 0
									? template.display_name
									: template.name}
							</PageHeaderTitle>
							{template.deprecated && <DeprecatedBadge />}
						</div>

						{template.deprecation_message !== "" ? (
							<PageHeaderSubtitle>
								<MemoizedInlineMarkdown>
									{template.deprecation_message}
								</MemoizedInlineMarkdown>
							</PageHeaderSubtitle>
						) : (
							template.description !== "" && (
								<PageHeaderSubtitle>{template.description}</PageHeaderSubtitle>
							)
						)}
					</div>
				</div>
			</PageHeader>
			<div className="pb-8">
				<TemplateStats template={template} activeVersion={activeVersion} />
			</div>
		</Margins>
	);
};
