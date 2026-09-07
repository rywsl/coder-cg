import { cn } from "cn";
import {
	ChevronLeftIcon,
	ExternalLinkIcon,
	PlayIcon,
	PlusIcon,
	TriangleAlertIcon,
	XIcon,
} from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Link as RouterLink,
	useNavigate,
	unstable_usePrompt as usePrompt,
} from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import type {
	ProvisionerJobLog,
	Template,
	TemplateVersion,
	TemplateVersionVariable,
	VariableValue,
	WorkspaceResource,
} from "#/api/typesGenerated";
import { Alert, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { Sidebar } from "#/components/FullPageLayout/Sidebar";
import {
	Topbar,
	TopbarAvatar,
	TopbarButton,
	TopbarData,
	TopbarDivider,
	TopbarIconButton,
} from "#/components/FullPageLayout/Topbar";
import { Loader } from "#/components/Loader/Loader";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import {
	AlertVariant,
	ProvisionerAlert,
} from "#/modules/provisioners/ProvisionerAlert";
import { ProvisionerStatusAlert } from "#/modules/provisioners/ProvisionerStatusAlert";
import { WildcardHostnameWarning } from "#/modules/resources/WildcardHostnameWarning";
import { isBinaryData } from "#/modules/templates/TemplateFiles/isBinaryData";
import { TemplateFileTree } from "#/modules/templates/TemplateFiles/TemplateFileTree";
import { TemplateResourcesTable } from "#/modules/templates/TemplateResourcesTable/TemplateResourcesTable";
import { WorkspaceBuildLogs } from "#/modules/workspaces/WorkspaceBuildLogs/WorkspaceBuildLogs";
import type { PublishVersionData } from "#/pages/TemplateVersionEditorPage/types";
import {
	createFile,
	existsFile,
	type FileTree,
	getFileText,
	isFolder,
	moveFile,
	removeFile,
	updateFile,
} from "#/utils/filetree";
import {
	CreateFileDialog,
	DeleteFileDialog,
	RenameFileDialog,
} from "./FileDialog";
import { MissingTemplateVariablesDialog } from "./MissingTemplateVariablesDialog";
import { MonacoEditor } from "./MonacoEditor";
import { ProvisionerTagsPopover } from "./ProvisionerTagsPopover";
import { PublishTemplateVersionDialog } from "./PublishTemplateVersionDialog";
import { TemplateVersionStatusBadge } from "./TemplateVersionStatusBadge";

type Tab = "logs" | "resources" | undefined; // Undefined is to hide the tab

interface TemplateVersionEditorProps {
	template: Template;
	templateVersion: TemplateVersion;
	fileTree: FileTree;
	onFileTreeChange: (updater: (fileTree: FileTree) => FileTree) => void;
	buildLogs?: ProvisionerJobLog[];
	resources?: WorkspaceResource[];
	isBuilding: boolean;
	canPublish: boolean;
	onPreview: (files: FileTree) => Promise<void>;
	onPublish: () => void;
	onConfirmPublish: (data: PublishVersionData) => void;
	onCancelPublish: () => void;
	publishingError?: unknown;
	publishedVersion?: TemplateVersion;
	createWorkspaceUrl: string | undefined;
	isAskingPublishParameters: boolean;
	isPromptingMissingVariables: boolean;
	isPublishing: boolean;
	missingVariables?: TemplateVersionVariable[];
	onSubmitMissingVariableValues: (values: VariableValue[]) => void;
	onCancelSubmitMissingVariableValues: () => void;
	defaultTab?: Tab;
	provisionerTags: Record<string, string>;
	onUpdateProvisionerTags: (tags: Record<string, string>) => void;
	activePath: string | undefined;
	onActivePathChange: (path: string | undefined) => void;
}

export const TemplateVersionEditor: FC<TemplateVersionEditorProps> = ({
	isBuilding,
	canPublish,
	template,
	templateVersion,
	fileTree,
	onFileTreeChange,
	onPreview,
	onPublish,
	onConfirmPublish,
	onCancelPublish,
	isAskingPublishParameters,
	isPublishing,
	publishingError,
	publishedVersion,
	createWorkspaceUrl,
	buildLogs,
	resources,
	isPromptingMissingVariables,
	missingVariables,
	onSubmitMissingVariableValues,
	onCancelSubmitMissingVariableValues,
	defaultTab,
	provisionerTags,
	onUpdateProvisionerTags,
	activePath,
	onActivePathChange,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const navigate = useNavigate();
	const getLink = useLinks();
	const [selectedTab, setSelectedTab] = useState<Tab>(defaultTab);
	const [createFileOpen, setCreateFileOpen] = useState(false);
	const [deleteFileOpen, setDeleteFileOpen] = useState<string>();
	const [renameFileOpen, setRenameFileOpen] = useState<string>();
	const [dirty, setDirty] = useState(false);
	const matchingProvisioners = templateVersion.matched_provisioners?.count;
	const availableProvisioners = templateVersion.matched_provisioners?.available;

	const triggerPreview = useCallback(async () => {
		try {
			await onPreview(fileTree);
			setSelectedTab("logs");
		} catch (error) {
			toast.error(
				getErrorMessage(
					error,
					tI18n(
						"TemplateVersionEditorPage.TemplateVersionEditor.error_on_previewing_the_template_e65da07e",
					),
				),
				{
					description: getErrorDetail(error),
				},
			);
		}
	}, [fileTree, onPreview]);

	// Stop ctrl+s from saving files and make ctrl+enter trigger a preview.
	useEffect(() => {
		const keyListener = async (event: KeyboardEvent) => {
			if (!(navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
				return;
			}
			switch (event.key) {
				case "s":
					// Prevent opening the save dialog!
					event.preventDefault();
					break;
				case "Enter":
					event.preventDefault();
					await triggerPreview();
					break;
			}
		};
		document.addEventListener("keydown", keyListener);
		return () => {
			document.removeEventListener("keydown", keyListener);
		};
	}, [triggerPreview]);

	const canBuild = !isBuilding;
	const templateLink = getLink(
		linkToTemplate(template.organization_name, template.name),
	);

	// Automatically switch to the template preview tab when the build succeeds.
	const previousVersion = useRef<TemplateVersion>(undefined);
	useEffect(() => {
		if (!previousVersion.current) {
			previousVersion.current = templateVersion;
			return;
		}

		if (
			["running", "pending"].includes(previousVersion.current.job.status) &&
			templateVersion.job.status === "succeeded"
		) {
			setDirty(false);
			toast.success(
				tI18n(
					"TemplateVersionEditorPage.TemplateVersionEditor.template_version_value0_built_successfully_c8aaee62",
					{
						value0: previousVersion.current.name,
					},
				),
				{
					action: {
						label: tI18n(
							"TemplateVersionEditorPage.TemplateVersionEditor.view_template_b6532e54",
						),
						onClick: () => navigate(templateLink),
					},
				},
			);
		}
		previousVersion.current = templateVersion;
	}, [templateVersion, navigate, templateLink]);

	const editorValue = activePath ? getFileText(activePath, fileTree) : "";
	const isEditorValueBinary =
		typeof editorValue === "string" ? isBinaryData(editorValue) : false;

	useLeaveSiteWarning(dirty);

	const gotBuildLogs = buildLogs && buildLogs.length > 0;

	return (
		<>
			<div className="h-full flex flex-col">
				<Topbar className="grid grid-cols-[1fr_2fr_1fr]" data-testid="topbar">
					<div>
						<Tooltip>
							<TooltipTrigger asChild>
								<TopbarIconButton asChild>
									<RouterLink
										to={templateLink}
										aria-label={tI18n(
											"TemplateVersionEditorPage.TemplateVersionEditor.back_to_the_template_79d3f3df",
										)}
									>
										<ChevronLeftIcon />
									</RouterLink>
								</TopbarIconButton>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{tI18n(
									"TemplateVersionEditorPage.TemplateVersionEditor.back_to_the_template_79d3f3df",
								)}
							</TooltipContent>
						</Tooltip>
					</div>

					<TopbarData>
						<TopbarAvatar
							src={template.icon}
							fallback={template.display_name || template.name}
						/>
						<RouterLink
							to={templateLink}
							className="text-content-primary no-underline hover:underline"
						>
							{template.display_name || template.name}
						</RouterLink>
						<TopbarDivider />
						<span className="text-content-secondary">
							{templateVersion.name}
						</span>
					</TopbarData>

					<div className="flex items-center justify-end gap-2 pr-4">
						<span className="mr-2">
							<Button asChild size="sm" variant="outline">
								<a
									href="https://registry.coder.com"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center"
								>
									{tI18n(
										"TemplateVersionEditorPage.TemplateVersionEditor.browse_the_coder_registry_e8b55341",
									)}
									<ExternalLinkIcon className="size-icon-sm ml-1" />
								</a>
							</Button>
						</span>

						<TemplateVersionStatusBadge version={templateVersion} />

						<div className="flex gap-1 items-center">
							<TopbarButton
								title={tI18n(
									"TemplateVersionEditorPage.TemplateVersionEditor.build_template_ctrl_enter_7e5225d6",
								)}
								disabled={!canBuild}
								onClick={async () => {
									await triggerPreview();
								}}
							>
								<PlayIcon />
								{tI18n(
									"TemplateVersionEditorPage.TemplateVersionEditor.build_bdd254b6",
								)}
							</TopbarButton>
							<ProvisionerTagsPopover
								tags={provisionerTags}
								onTagsChange={onUpdateProvisionerTags}
							/>
						</div>

						<TopbarButton
							variant="default"
							disabled={dirty || !canPublish}
							onClick={onPublish}
						>
							{tI18n(
								"TemplateVersionEditorPage.TemplateVersionEditor.publish_859390eb",
							)}
						</TopbarButton>
					</div>
				</Topbar>

				<div className="flex flex-1 basis-0 overflow-hidden relative">
					{publishedVersion && (
						<div
							// We need this to reset the dismissable state of the component
							// when the published version changes
							key={publishedVersion.id}
							className="absolute w-full flex justify-center p-3 z-10"
						>
							<Alert
								severity="success"
								prominent
								dismissible
								actions={
									<Button asChild size="sm">
										<RouterLink to={createWorkspaceUrl ?? ""}>
											{tI18n(
												"TemplateVersionEditorPage.TemplateVersionEditor.create_a_workspace_954bd1fe",
											)}
										</RouterLink>
									</Button>
								}
							>
								<AlertTitle>
									{tI18n(
										"TemplateVersionEditorPage.TemplateVersionEditor.successfully_published_1680e6c0",
									)}
									{publishedVersion.name}!
								</AlertTitle>
							</Alert>
						</div>
					)}

					<Sidebar>
						<div className="h-[42px] py-0 pr-2 pl-4 flex items-center">
							<span className="text-content-primary text-sm">
								{tI18n(
									"TemplateVersionEditorPage.TemplateVersionEditor.files_abc7e989",
								)}
							</span>

							<div className="ml-auto [&_svg]:fill-content-primary">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon"
											variant="subtle"
											aria-label={tI18n(
												"TemplateVersionEditorPage.TemplateVersionEditor.create_file_f1eb5a82",
											)}
											onClick={(event) => {
												setCreateFileOpen(true);
												event.currentTarget.blur();
											}}
										>
											<PlusIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{tI18n(
											"TemplateVersionEditorPage.TemplateVersionEditor.create_file_f1eb5a82",
										)}
									</TooltipContent>
								</Tooltip>
							</div>
							<CreateFileDialog
								fileTree={fileTree}
								open={createFileOpen}
								onClose={() => {
									setCreateFileOpen(false);
								}}
								checkExists={(path) => existsFile(path, fileTree)}
								onConfirm={(path) => {
									onFileTreeChange((fileTree) =>
										createFile(path, fileTree, ""),
									);
									onActivePathChange(path);
									setCreateFileOpen(false);
									setDirty(true);
								}}
							/>
							<DeleteFileDialog
								onConfirm={() => {
									if (!deleteFileOpen) {
										throw new Error("delete file must be set");
									}
									onFileTreeChange((fileTree) =>
										removeFile(deleteFileOpen, fileTree),
									);
									setDeleteFileOpen(undefined);
									if (activePath === deleteFileOpen) {
										onActivePathChange(undefined);
									}
									setDirty(true);
								}}
								open={Boolean(deleteFileOpen)}
								onClose={() => setDeleteFileOpen(undefined)}
								filename={deleteFileOpen || ""}
							/>
							<RenameFileDialog
								fileTree={fileTree}
								open={Boolean(renameFileOpen)}
								onClose={() => {
									setRenameFileOpen(undefined);
								}}
								filename={renameFileOpen || ""}
								checkExists={(path) => existsFile(path, fileTree)}
								onConfirm={(newPath) => {
									if (!renameFileOpen) {
										return;
									}
									onFileTreeChange((fileTree) =>
										moveFile(renameFileOpen, newPath, fileTree),
									);
									onActivePathChange(newPath);
									setRenameFileOpen(undefined);
									setDirty(true);
								}}
							/>
						</div>
						<TemplateFileTree
							fileTree={fileTree}
							onDelete={(file) => setDeleteFileOpen(file)}
							onSelect={(filePath) => {
								if (!isFolder(filePath, fileTree)) {
									onActivePathChange(filePath);
								}
							}}
							onRename={(file) => setRenameFileOpen(file)}
							activePath={activePath}
						/>
					</Sidebar>

					<div className="flex flex-col w-full min-h-full overflow-hidden">
						<div className="flex-1 overflow-y-auto" data-pixel="ignore">
							{activePath ? (
								isEditorValueBinary ? (
									<div
										role="alert"
										className="w-full h-full flex items-center justify-center p-10"
									>
										<div className="flex flex-col items-center max-w-[420px] text-center">
											<TriangleAlertIcon className="text-content-warning size-icon-lg" />
											<p className="m-0 p-0 mt-6">
												{tI18n(
													"TemplateVersionEditorPage.TemplateVersionEditor.the_file_is_not_displayed_in_the_text_editor_bec_c649b8ff",
												)}
											</p>
										</div>
									</div>
								) : (
									<MonacoEditor
										value={editorValue}
										path={activePath}
										onChange={(value) => {
											if (!activePath) {
												return;
											}
											onFileTreeChange((fileTree) =>
												updateFile(activePath, value, fileTree),
											);
											setDirty(true);
										}}
									/>
								)
							) : (
								<div>
									{tI18n(
										"TemplateVersionEditorPage.TemplateVersionEditor.no_file_opened_37fa1f8b",
									)}
								</div>
							)}
						</div>

						<div className="border-0 border-t border-solid border-border overflow-hidden flex flex-col">
							<div
								className={cn(
									"flex items-center",
									selectedTab && "border-0 border-b border-solid border-border",
								)}
							>
								<div className="flex">
									<button
										type="button"
										disabled={!buildLogs}
										className={tabClassName(selectedTab === "logs")}
										onClick={() => {
											setSelectedTab("logs");
										}}
									>
										{tI18n(
											"TemplateVersionEditorPage.TemplateVersionEditor.output_b2439bcb",
										)}
									</button>

									<button
										type="button"
										disabled={!canPublish}
										className={tabClassName(selectedTab === "resources")}
										onClick={() => {
											setSelectedTab("resources");
										}}
									>
										{tI18n(
											"TemplateVersionEditorPage.TemplateVersionEditor.resources_e89b30aa",
										)}
									</button>
								</div>

								{selectedTab === "logs" && gotBuildLogs && (
									<a
										href={`/api/v2/templateversions/${templateVersion.id}/logs?format=text`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 px-3 text-xs text-content-secondary hover:text-content-primary"
									>
										{tI18n(
											"TemplateVersionEditorPage.TemplateVersionEditor.view_raw_logs_ed3f405c",
										)}
										<ExternalLinkIcon className="size-3" />
									</a>
								)}

								{selectedTab && (
									<Button
										size="icon"
										variant="subtle"
										onClick={() => {
											setSelectedTab(undefined);
										}}
										className={cn(
											(selectedTab !== "logs" || !gotBuildLogs) && "ml-auto",
										)}
									>
										<XIcon />
									</Button>
								)}
							</div>

							{selectedTab === "logs" && (
								<div className="flex flex-col h-[280px] overflow-y-auto">
									{templateVersion.job.error ? (
										<div>
											<ProvisionerAlert
												title={tI18n(
													"TemplateVersionEditorPage.TemplateVersionEditor.error_during_the_build_f68af1e2",
												)}
												detail={templateVersion.job.error}
												severity="error"
												tags={templateVersion.job.tags}
												variant={AlertVariant.Inline}
											/>
										</div>
									) : (
										!gotBuildLogs && (
											<>
												<ProvisionerStatusAlert
													matchingProvisioners={matchingProvisioners}
													availableProvisioners={availableProvisioners}
													tags={templateVersion.job.tags}
													variant={AlertVariant.Inline}
												/>
												<Loader className="h-full" />
											</>
										)
									)}

									{gotBuildLogs && (
										<WorkspaceBuildLogs
											className={cn(
												"rounded-none border-0",
												"[&_.logs-header]:border-0 [&_.logs-header]:px-4 [&_.logs-header]:py-2 [&_.logs-header]:font-mono",
												"[&_.logs-header:first-of-type]:pt-4 [&_.logs-header:last-child]:pb-4",
												"[&_.logs-line]:pl-4",
												"[&_.logs-container]:border-0!",
											)}
											hideTimestamps
											logs={buildLogs}
										/>
									)}

									{resources && (
										<WildcardHostnameWarning resources={resources} />
									)}
								</div>
							)}

							{selectedTab === "resources" && (
								<div
									className={cn(
										"h-[280px] overflow-y-auto",
										"[&_.resource-card]:border-l-0 [&_.resource-card]:border-r-0",
										"[&_.resource-card:first-of-type]:border-t-0 [&_.resource-card:last-child]:border-b-0",
									)}
								>
									{resources && (
										<TemplateResourcesTable
											resources={resources.filter(
												(r) => r.workspace_transition === "start",
											)}
										/>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<PublishTemplateVersionDialog
				key={templateVersion.name}
				publishingError={publishingError}
				open={isAskingPublishParameters || isPublishing}
				onClose={onCancelPublish}
				onConfirm={onConfirmPublish}
				isPublishing={isPublishing}
				defaultName={templateVersion.name}
			/>
			<MissingTemplateVariablesDialog
				open={isPromptingMissingVariables}
				onClose={onCancelSubmitMissingVariableValues}
				onSubmit={onSubmitMissingVariableValues}
				missingVariables={missingVariables}
			/>
		</>
	);
};

const useLeaveSiteWarning = (enabled: boolean) => {
	const { t: tI18n } = useTranslation("templates");

	const MESSAGE = tI18n(
		"TemplateVersionEditorPage.TemplateVersionEditor.you_have_unpublished_changes_are_you_sure_you_wa_1da66002",
	);

	// This works for regular browser actions like close tab and back button
	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (enabled) {
				e.preventDefault();
				return MESSAGE;
			}
		};

		window.addEventListener("beforeunload", onBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
		};
	}, [enabled, MESSAGE]);

	// This is used for react router navigation that is not triggered by the
	// browser
	usePrompt({
		message: MESSAGE,
		when: ({ nextLocation }) => {
			// We need to check the path because we change the URL when new template
			// version is created during builds
			return enabled && !nextLocation.pathname.endsWith("/edit");
		},
	});
};

const tabClassName = (isActive: boolean) =>
	cn(
		"p-3 text-[10px] uppercase tracking-[0.5px] font-medium bg-transparent font-[inherit] border-0",
		"text-content-secondary transition-all duration-150",
		"flex gap-2 items-center justify-center relative",
		"[&_svg]:max-w-3 [&_svg]:max-h-3",
		"enabled:cursor-pointer",
		"hover:enabled:text-content-primary",
		"disabled:text-content-disabled",
		isActive && [
			"text-content-primary",
			"after:content-[''] after:block after:w-full after:h-px after:bg-surface-invert-primary after:absolute after:-bottom-px",
		],
	);
