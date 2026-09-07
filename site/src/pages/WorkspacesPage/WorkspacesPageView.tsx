import { PlayIcon, RotateCcwIcon, SquareIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { UseQueryResult } from "react-query";
import { hasError, isApiValidationError } from "#/api/errors";
import type { Template, Workspace } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import type { UseFilterResult } from "#/components/Filter/Filter";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import { PaginationAmount } from "#/components/PaginationWidget/PaginationAmount";
import { PaginationWidgetBase } from "#/components/PaginationWidget/PaginationWidgetBase";
import { Spinner } from "#/components/Spinner/Spinner";
import { TableToolbar } from "#/components/TableToolbar/TableToolbar";
import { WorkspacesTable } from "#/pages/WorkspacesPage/WorkspacesTable";
import { mustUpdateWorkspace } from "#/utils/workspace";
import { WorkspacesFilter } from "./filter/WorkspacesFilter";
import { WorkspaceHelpPopover } from "./WorkspaceHelpPopover";
import { WorkspacesButton } from "./WorkspacesButton";

type TemplateQuery = UseQueryResult<Template[]>;
interface WorkspacesPageViewProps {
	error: unknown;
	workspaces?: readonly Workspace[];
	checkedWorkspaces: readonly Workspace[];
	count?: number;
	filter: UseFilterResult;
	page: number;
	limit: number;
	onPageChange: (page: number) => void;
	onCheckChange: (checkedWorkspaces: readonly Workspace[]) => void;
	isRunningBatchAction: boolean;
	onBatchDeleteTransition: () => void;
	onBatchUpdateTransition: () => void;
	onBatchStartTransition: () => void;
	onBatchStopTransition: () => void;
	templatesFetchStatus: TemplateQuery["status"];
	templates: TemplateQuery["data"];
	canCreateTemplate: boolean;
	canCreateWorkspace: boolean;
	canChangeVersions: boolean;
	onActionSuccess: () => Promise<void>;
	onActionError: (error: unknown) => void;
	chatsByWorkspace?: Record<string, string>;
}

export const WorkspacesPageView: FC<WorkspacesPageViewProps> = ({
	workspaces,
	error,
	limit,
	count,
	filter,
	onPageChange,
	page,
	checkedWorkspaces,
	onCheckChange,
	onBatchDeleteTransition,
	onBatchUpdateTransition,
	onBatchStopTransition,
	onBatchStartTransition,
	isRunningBatchAction,
	templates,
	templatesFetchStatus,
	canCreateTemplate,
	canCreateWorkspace,
	canChangeVersions,
	onActionSuccess,
	onActionError,
	chatsByWorkspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	// Let's say the user has 5 workspaces, but tried to hit page 100, which
	// does not exist. In this case, the page is not valid and we want to show a
	// better error message.
	const pageNumberIsInvalid = page !== 1 && workspaces?.length === 0;

	return (
		<Margins className="pb-12">
			<PageHeader
				actions={
					canCreateWorkspace && (
						<WorkspacesButton
							templates={templates}
							templatesFetchStatus={templatesFetchStatus}
						>
							{tI18n(
								"WorkspacesPage.WorkspacesPageView.new_workspace_df0caf1b",
							)}
						</WorkspacesButton>
					)
				}
			>
				<PageHeaderTitle>
					<div className="flex flex-row gap-2 items-center">
						<span>
							{tI18n("WorkspacesPage.WorkspacesPageView.workspaces_1377264b")}
						</span>
						<WorkspaceHelpPopover />
					</div>
				</PageHeaderTitle>
			</PageHeader>
			<div className="flex flex-col gap-4">
				{hasError(error) && !isApiValidationError(error) && (
					<ErrorAlert error={error} />
				)}
				<WorkspacesFilter filter={filter} error={error} />
			</div>
			<TableToolbar>
				{checkedWorkspaces.length > 0 ? (
					<>
						<div>
							{tI18n("WorkspacesPage.WorkspacesPageView.selected_da550194")}
							<strong>{checkedWorkspaces.length}</strong>
							{tI18n("WorkspacesPage.WorkspacesPageView.of_88eb5a7e")}{" "}
							<strong>{workspaces?.length}</strong>{" "}
							{workspaces?.length === 1 ? "workspace" : "workspaces"}
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									disabled={isRunningBatchAction}
									variant="outline"
									size="sm"
									className="ml-auto"
								>
									{tI18n(
										"WorkspacesPage.WorkspacesPageView.bulk_actions_19f0dd9a",
									)}
									<Spinner loading={isRunningBatchAction}>
										<ChevronDownIcon />
									</Spinner>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									disabled={
										!checkedWorkspaces?.some(
											(w) =>
												w.latest_build.status === "stopped" &&
												!mustUpdateWorkspace(w, canChangeVersions),
										)
									}
									onClick={onBatchStartTransition}
								>
									<PlayIcon />
									{tI18n("WorkspacesPage.WorkspacesPageView.start_f37b64a8")}
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={
										!checkedWorkspaces?.some(
											(w) => w.latest_build.status === "running",
										)
									}
									onClick={onBatchStopTransition}
								>
									<SquareIcon />
									{tI18n("WorkspacesPage.WorkspacesPageView.stop_af6785b0")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={onBatchUpdateTransition}>
									<RotateCcwIcon
										className="size-icon-sm"
										data-testid="bulk-action-update"
									/>{" "}
									{tI18n("WorkspacesPage.WorkspacesPageView.update_ca6b4901")}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-content-destructive focus:text-content-destructive"
									onClick={onBatchDeleteTransition}
								>
									<TrashIcon />
									{tI18n("WorkspacesPage.WorkspacesPageView.delete_c91ff404")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				) : (
					!pageNumberIsInvalid && (
						<PaginationAmount
							paginationUnitLabel="workspaces"
							limit={limit}
							totalRecords={count}
							currentOffsetStart={(page - 1) * limit + 1}
						/>
					)
				)}
			</TableToolbar>
			{pageNumberIsInvalid ? (
				<EmptyState
					className="border border-solid border-border rounded-lg"
					message={tI18n(
						"WorkspacesPage.WorkspacesPageView.page_not_found_a469ab4c",
					)}
					description={tI18n(
						"WorkspacesPage.WorkspacesPageView.the_page_you_are_trying_to_access_does_not_exist_79743f1b",
					)}
					cta={
						<Button
							onClick={() => {
								onPageChange(1);
							}}
						>
							{tI18n(
								"WorkspacesPage.WorkspacesPageView.back_to_the_first_page_5492a2c4",
							)}
						</Button>
					}
				/>
			) : (
				<WorkspacesTable
					canCreateTemplate={canCreateTemplate}
					canCreateWorkspace={canCreateWorkspace}
					workspaces={workspaces}
					isUsingFilter={filter.used}
					checkedWorkspaces={checkedWorkspaces}
					onCheckChange={onCheckChange}
					templates={templates}
					onActionSuccess={onActionSuccess}
					onActionError={onActionError}
					chatsByWorkspace={chatsByWorkspace}
				/>
			)}
			{count !== undefined && (
				// Temporary styling stopgap before component is migrated to using
				// PaginationContainer (which renders PaginationWidgetBase using CSS
				// flexbox gaps)
				<div className="pt-4">
					<PaginationWidgetBase
						totalRecords={count}
						pageSize={limit}
						onPageChange={onPageChange}
						currentPage={page}
					/>
				</div>
			)}
		</Margins>
	);
};
