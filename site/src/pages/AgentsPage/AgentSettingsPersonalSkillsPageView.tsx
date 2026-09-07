import { EllipsisVerticalIcon, PlusIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { UserSkillMetadata } from "#/api/typesGenerated";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Loader } from "#/components/Loader/Loader";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";
import { formatDate } from "#/utils/time";
import type { PersonalSkillErrorDisplay } from "./components/PersonalSkillEditor";
import { PersonalSkillEditor } from "./components/PersonalSkillEditor";
import { SectionHeader } from "./components/SectionHeader";
import {
	PERSONAL_SKILLS_MAX_PER_USER,
	type PersonalSkillFormValues,
} from "./utils/personalSkills";

export type PersonalSkillEditorState =
	| {
			mode: "create";
			initialValues: PersonalSkillFormValues;
			existingNames: readonly string[];
			submitError?: PersonalSkillErrorDisplay;
			isSubmitting: boolean;
			onSubmit: (values: PersonalSkillFormValues, content: string) => void;
			onClose: () => void;
	  }
	| {
			mode: "edit";
			initialValues?: PersonalSkillFormValues;
			existingNames: readonly string[];
			loadError?: unknown;
			isLoading: boolean;
			isRetrying: boolean;
			submitError?: PersonalSkillErrorDisplay;
			isSubmitting: boolean;
			onRetry: () => void;
			onSubmit: (values: PersonalSkillFormValues, content: string) => void;
			onClose: () => void;
	  };

export type PersonalSkillDeleteState = {
	skill: UserSkillMetadata;
	error?: PersonalSkillErrorDisplay;
	isDeleting: boolean;
	onConfirm: () => void;
	onClose: () => void;
};

export interface AgentSettingsPersonalSkillsPageViewProps {
	skills: readonly UserSkillMetadata[];
	error: unknown;
	isLoading: boolean;
	isRetrying: boolean;
	onRetry: () => void;
	onCreate: () => void;
	onEdit: (name: string) => void;
	onDelete: (skill: UserSkillMetadata) => void;
	onDownload: (skill: UserSkillMetadata) => void;
	onExportAll: () => void;
	downloadingSkillName?: string;
	isExportingAll?: boolean;
	editorState?: PersonalSkillEditorState;
	deleteState?: PersonalSkillDeleteState;
}

const formatUpdatedAt = (value: string) => {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) {
		return "Unknown";
	}
	return formatDate(date, {
		locale: "en-US",
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		second: undefined,
		minute: "2-digit",
	});
};

const EditSkillDialog: FC<{
	state: Extract<PersonalSkillEditorState, { mode: "edit" }>;
}> = ({ state }) => {
	const { t: tI18n } = useTranslation("agents");

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			state.onClose();
		}
	};

	if (state.isLoading) {
		return (
			<Dialog open onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.loading_personal_skill_654f87c4",
							)}
						</DialogTitle>
						<DialogDescription>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.fetching_the_latest_skill_md_content_58420f5f",
							)}
						</DialogDescription>
					</DialogHeader>
					<Loader />
				</DialogContent>
			</Dialog>
		);
	}

	if (state.loadError || !state.initialValues) {
		return (
			<Dialog open onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.unable_to_load_personal_skill_bc31bdcb",
							)}
						</DialogTitle>
						<DialogDescription>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.the_skill_could_not_be_loaded_for_editing_209016f8",
							)}
						</DialogDescription>
					</DialogHeader>
					{state.loadError ? (
						<ErrorAlert error={state.loadError} showDebugDetail={false} />
					) : (
						<Alert severity="error">
							<AlertDescription>
								{tI18n(
									"AgentsPage.AgentSettingsPersonalSkillsPageView.the_saved_content_could_not_be_parsed_as_skill_m_1e40d1c6",
								)}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={state.onClose}>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.close_7d9eb7ac",
							)}
						</Button>
						<Button onClick={state.onRetry} disabled={state.isRetrying}>
							{state.isRetrying && <Spinner className="size-4" loading />}
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.retry_942087cc",
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<PersonalSkillEditor
			open
			mode="edit"
			initialValues={state.initialValues}
			existingNames={state.existingNames}
			submitError={state.submitError}
			isSubmitting={state.isSubmitting}
			onOpenChange={handleOpenChange}
			onSubmit={state.onSubmit}
		/>
	);
};

const DeleteSkillDialog: FC<{ state: PersonalSkillDeleteState }> = ({
	state,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<ConfirmDialog
			type="delete"
			open
			onClose={state.onClose}
			title={tI18n(
				"AgentsPage.AgentSettingsPersonalSkillsPageView.delete_skill_d60d2a2a",
			)}
			confirmText={tI18n(
				"AgentsPage.AgentSettingsPersonalSkillsPageView.delete_skill_d60d2a2a",
			)}
			description={
				<>
					<p className="m-0">
						{tI18n(
							"AgentsPage.AgentSettingsPersonalSkillsPageView.delete_85941fb9",
						)}
						{state.skill.name}
						{tI18n(
							"AgentsPage.AgentSettingsPersonalSkillsPageView.agents_will_no_longer_be_able_to_use_this_skill__b9205cf2",
						)}
					</p>
					{state.error && (
						<Alert severity="error" className="mt-3">
							<AlertDescription>
								{state.error.message}
								{state.error.detail
									? tI18n(
											"AgentsPage.AgentSettingsPersonalSkillsPageView.value0_dfaa4cde",
											{
												value0: state.error.detail,
											},
										)
									: ""}
							</AlertDescription>
						</Alert>
					)}
				</>
			}
			onConfirm={state.onConfirm}
			confirmLoading={state.isDeleting}
		/>
	);
};

export const AgentSettingsPersonalSkillsPageView: FC<
	AgentSettingsPersonalSkillsPageViewProps
> = ({
	skills,
	error,
	isLoading,
	isRetrying,
	onRetry,
	onCreate,
	onEdit,
	onDelete,
	onDownload,
	onExportAll,
	downloadingSkillName,
	isExportingAll = false,
	editorState,
	deleteState,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const isAtLimit = skills.length >= PERSONAL_SKILLS_MAX_PER_USER;
	const addSkillAction = (
		<Button
			variant="outline"
			onClick={onCreate}
			disabled={isLoading || isAtLimit}
		>
			<PlusIcon />
			{tI18n(
				"AgentsPage.AgentSettingsPersonalSkillsPageView.add_skill_bc4db5d3",
			)}
		</Button>
	);
	const headerActions = (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				onClick={onExportAll}
				disabled={isLoading || isExportingAll || skills.length === 0}
			>
				{isExportingAll && <Spinner className="size-4" loading />}
				{tI18n(
					"AgentsPage.AgentSettingsPersonalSkillsPageView.export_all_51427688",
				)}
			</Button>
			{addSkillAction}
		</div>
	);

	return (
		<div className="flex flex-col gap-8">
			<SectionHeader
				label={tI18n(
					"AgentsPage.AgentSettingsPersonalSkillsPageView.personal_skills_4907a3e2",
				)}
				description={tI18n(
					"AgentsPage.AgentSettingsPersonalSkillsPageView.reusable_instructions_your_agents_can_pick_when__cf248082",
				)}
				action={headerActions}
			/>
			{isAtLimit && (
				<Alert severity="warning">
					<AlertDescription>
						{tI18n(
							"AgentsPage.AgentSettingsPersonalSkillsPageView.you_have_reached_the_limit_of_b8d0b466",
						)}
						{PERSONAL_SKILLS_MAX_PER_USER}{" "}
						{tI18n(
							"AgentsPage.AgentSettingsPersonalSkillsPageView.personal_skills_delete_a_skill_before_creating_a_aa3ac4f0",
						)}
					</AlertDescription>
				</Alert>
			)}
			{Boolean(error) && <ErrorAlert error={error} />}
			<Table
				aria-label={tI18n(
					"AgentsPage.AgentSettingsPersonalSkillsPageView.personal_skills_4907a3e2",
				)}
			>
				<TableHeader>
					<TableRow>
						<TableHead>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.name_dcd1d522",
							)}
						</TableHead>
						<TableHead>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.description_526e0087",
							)}
						</TableHead>
						<TableHead>
							{tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.updated_3a5ecca1",
							)}
						</TableHead>
						<TableHead className="w-14">
							<span className="sr-only">
								{tI18n(
									"AgentsPage.AgentSettingsPersonalSkillsPageView.actions_ff8059dc",
								)}
							</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody size="lg">
					{isLoading ? (
						<TableLoader />
					) : skills.length === 0 && error ? (
						<TableEmpty
							message={tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.failed_to_load_personal_skills_d273c102",
							)}
							cta={
								<Button
									variant="outline"
									onClick={onRetry}
									disabled={isRetrying}
								>
									{isRetrying && <Spinner className="size-4" loading />}
									{tI18n(
										"AgentsPage.AgentSettingsPersonalSkillsPageView.retry_942087cc",
									)}
								</Button>
							}
						/>
					) : skills.length === 0 ? (
						<TableEmpty
							message={tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.no_personal_skills_yet_be7fabe3",
							)}
							description={tI18n(
								"AgentsPage.AgentSettingsPersonalSkillsPageView.create_a_personal_skill_to_save_reusable_agent_g_1a6d5f8c",
							)}
							cta={addSkillAction}
						/>
					) : (
						skills.map((skill) => (
							<TableRow key={skill.id}>
								<TableCell>{skill.name}</TableCell>
								<TableCell>
									{skill.description || (
										<span className="text-content-disabled">
											{tI18n(
												"AgentsPage.AgentSettingsPersonalSkillsPageView.no_description_bcd8cc53",
											)}
										</span>
									)}
								</TableCell>
								<TableCell>{formatUpdatedAt(skill.updated_at)}</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												size="icon"
												variant="subtle"
												aria-label={tI18n(
													"AgentsPage.AgentSettingsPersonalSkillsPageView.open_menu_b40b3713",
												)}
											>
												{downloadingSkillName === skill.name ? (
													<Spinner className="size-4" loading />
												) : (
													<EllipsisVerticalIcon aria-hidden="true" />
												)}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => onDownload(skill)}
												disabled={downloadingSkillName === skill.name}
											>
												{tI18n(
													"AgentsPage.AgentSettingsPersonalSkillsPageView.download_d6eafe82",
												)}
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => onEdit(skill.name)}>
												{tI18n(
													"AgentsPage.AgentSettingsPersonalSkillsPageView.edit_464c4ffd",
												)}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-content-destructive focus:text-content-destructive"
												onClick={() => onDelete(skill)}
											>
												{tI18n(
													"AgentsPage.AgentSettingsPersonalSkillsPageView.delete_9ce78fe3",
												)}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
			{editorState?.mode === "create" && (
				<PersonalSkillEditor
					open
					mode="create"
					initialValues={editorState.initialValues}
					existingNames={editorState.existingNames}
					submitError={editorState.submitError}
					isSubmitting={editorState.isSubmitting}
					onOpenChange={(open) => {
						if (!open) {
							editorState.onClose();
						}
					}}
					onSubmit={editorState.onSubmit}
				/>
			)}
			{editorState?.mode === "edit" && <EditSkillDialog state={editorState} />}
			{deleteState && <DeleteSkillDialog state={deleteState} />}
		</div>
	);
};
