import { ArrowLeftIcon, TrashIcon, UserPlusIcon } from "lucide-react";
import { type ComponentProps, type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	Link,
	Outlet,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	addMembers,
	deleteGroup,
	group,
	groupMembers,
	groupPermissions,
} from "#/api/queries/groups";
import type {
	Group,
	OrganizationMemberWithUserData,
	ReducedUser,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { useFilter } from "#/components/Filter/Filter";
import type { UsersFilter } from "#/components/Filter/UsersFilter";
import { Loader } from "#/components/Loader/Loader";
import { MultiMemberSelect } from "#/components/MultiUserSelect/MultiUserSelect";
import type { PaginationResult } from "#/components/PaginationWidget/PaginationContainer";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { LinkTabs, LinkTabsList, TabLink } from "#/components/Tabs/Tabs";
import { usePaginatedQuery } from "#/hooks/usePaginatedQuery";
import { isEveryoneGroup } from "#/modules/groups";
import { pageTitle } from "#/utils/page";
import { AIBudgetPeriod } from "./AIBudgetPeriod";

export type GroupPageOutletContext = {
	group: Group;
	members: readonly ReducedUser[];
	permissions: { canUpdateGroup: boolean };
	organization: string;
	groupQuery: ReturnType<typeof useQuery>;
	membersQuery: PaginationResult;
	filterProps: ComponentProps<typeof UsersFilter>;
};

const GroupPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { organization = "default", groupName } = useParams() as {
		organization?: string;
		groupName: string;
	};
	const location = useLocation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const groupQuery = useQuery(
		group(organization, groupName, { exclude_members: true }),
	);
	const membersQuery = usePaginatedQuery(
		groupMembers(organization, groupName, searchParams),
	);
	const useFilterResult = useFilter({
		searchParams,
		onSearchParamsChange: setSearchParams,
		onUpdate: membersQuery.goToFirstPage,
	});

	const groupData = groupQuery.data;
	const { data: permissions } = useQuery({
		...groupPermissions(groupData?.id ?? ""),
		enabled: Boolean(groupData),
	});
	const deleteGroupMutation = useMutation(
		deleteGroup(queryClient, organization),
	);
	const addMembersMutation = useMutation(addMembers(queryClient, organization));
	const [isDeletingGroup, setIsDeletingGroup] = useState(false);
	const isLoading =
		groupQuery.isLoading ||
		!groupData ||
		!permissions ||
		membersQuery.isLoading ||
		!membersQuery.data;
	const canUpdateGroup = permissions ? permissions.canUpdateGroup : false;

	const title = (
		<title>
			{pageTitle(
				(groupData?.display_name || groupData?.name) ??
					tI18n("GroupsPage.GroupPage.loading_47d2a515"),
			)}
		</title>
	);

	const error = groupQuery.error || membersQuery.error;
	if (error) {
		return <ErrorAlert error={error} />;
	}

	if (isLoading) {
		return (
			<>
				{title}
				<Loader />
			</>
		);
	}

	const groupId = groupData.id;
	const activeTab = location.pathname.endsWith("/settings")
		? "settings"
		: "members";

	return (
		<>
			{title}
			<div className="flex justify-between items-center">
				<Button variant="subtle" asChild className="-ml-3">
					<Link to={activeTab === "settings" ? "../.." : ".."} relative="path">
						<ArrowLeftIcon />
						<span>{tI18n("GroupsPage.GroupPage.back_to_groups_033bcce2")}</span>
					</Link>
				</Button>
				{canUpdateGroup && (
					<div className="flex items-center gap-2">
						{!isEveryoneGroup(groupData) && (
							<AddUsersDialog
								organizationId={groupData.organization_id}
								onSubmit={async (users) => {
									await addMembersMutation.mutateAsync({
										groupId: groupData.id,
										userIds: users.map((u) => u.user_id),
									});
								}}
							/>
						)}
						<Button
							variant="destructive"
							disabled={groupData.id === groupData.organization_id}
							onClick={() => {
								setIsDeletingGroup(true);
							}}
						>
							<TrashIcon />
							{tI18n("GroupsPage.GroupPage.delete_e2d0a549")}
						</Button>
					</div>
				)}
			</div>
			<div className="flex flex-col gap-6 pt-6">
				<div className="flex items-center gap-4 min-w-0">
					<Avatar
						src={groupData.avatar_url}
						fallback={groupData.display_name || groupData.name}
						size="lg"
					/>
					<SettingsHeaderTitle>
						<span className="block min-w-0 truncate">
							{groupData.display_name ||
								groupData.name ||
								tI18n("GroupsPage.GroupPage.unknown_group_79ce4cef")}
						</span>
					</SettingsHeaderTitle>
				</div>
				<p className="text-sm text-content-secondary m-0">
					{tI18n("GroupsPage.GroupPage.manage_members_for_this_group_ea9e309e")}
				</p>

				{canUpdateGroup && (
					<LinkTabs
						active={activeTab}
						className="flex items-baseline justify-between"
					>
						<LinkTabsList className="justify-start">
							<TabLink to="." value="members">
								{tI18n("GroupsPage.GroupPage.group_members_dd0fd917")}
							</TabLink>
							<TabLink to="settings" value="settings">
								{tI18n("GroupsPage.GroupPage.group_settings_ba4062f8")}
							</TabLink>
						</LinkTabsList>
						{activeTab === "members" && <AIBudgetPeriod />}
					</LinkTabs>
				)}

				<Outlet
					context={
						{
							group: groupData,
							members: membersQuery.data?.users || [],
							permissions: { canUpdateGroup },
							organization,
							groupQuery,
							membersQuery,
							filterProps: {
								filter: useFilterResult,
							},
						} satisfies GroupPageOutletContext
					}
				/>
			</div>
			{groupQuery.data && (
				<DeleteDialog
					isOpen={isDeletingGroup}
					confirmLoading={deleteGroupMutation.isPending}
					name={groupQuery.data.name}
					entity={tI18n("GroupsPage.GroupPage.group_ad936fcb")}
					onConfirm={async () => {
						try {
							await deleteGroupMutation.mutateAsync({
								groupId,
								groupName: groupData.name,
							});
							toast.success(
								tI18n(
									"GroupsPage.GroupPage.group_value0_deleted_successfully_5d7a788e",
									{
										value0: groupQuery.data.name,
									},
								),
							);
							navigate("..");
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"GroupsPage.GroupPage.failed_to_delete_group_value0_9ebeaab3",
										{
											value0: groupQuery.data.name,
										},
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
					onCancel={() => {
						setIsDeletingGroup(false);
					}}
				/>
			)}
		</>
	);
};

interface AddUsersDialogProps {
	onSubmit: (users: OrganizationMemberWithUserData[]) => Promise<void>;
	organizationId: string;
}

const AddUsersDialog: FC<AddUsersDialogProps> = ({
	onSubmit,
	organizationId,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [filter, setFilter] = useState("");
	const [selected, setSelected] = useState<OrganizationMemberWithUserData[]>(
		[],
	);
	const closeDialog = () => {
		setAddUserDialogOpen(false);
		setFilter("");
		setSelected([]);
	};

	return (
		<>
			<Button onClick={() => setAddUserDialogOpen(true)}>
				<UserPlusIcon />
				{tI18n("GroupsPage.GroupPage.add_users_4cd030d9")}
			</Button>
			<Dialog
				open={addUserDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						closeDialog();
					}
				}}
			>
				<DialogContent
					data-testid="dialog"
					className="max-w-md gap-4 border-border-default bg-surface-primary p-8 text-content-primary"
				>
					<DialogTitle className="font-semibold text-content-primary">
						{tI18n("GroupsPage.GroupPage.add_user_s_28d7e893")}
					</DialogTitle>
					<MultiMemberSelect
						organizationId={organizationId}
						filter={filter}
						setFilter={setFilter}
						onChange={(user, checked) => {
							if (checked) {
								setSelected([...selected, user]);
							} else {
								setSelected(selected.filter((s) => s.user_id !== user.user_id));
							}
						}}
						selected={selected}
					/>
					<DialogFooter className="mt-4 flex-row justify-end gap-3">
						<Button
							variant="outline"
							onClick={closeDialog}
							disabled={submitting}
						>
							{tI18n("GroupsPage.GroupPage.cancel_19766ed6")}
						</Button>
						<Button
							disabled={submitting || selected.length === 0}
							onClick={async () => {
								try {
									setSubmitting(true);
									await onSubmit(selected);
									closeDialog();
								} catch (error) {
									toast.error(
										getErrorMessage(
											error,
											tI18n(
												"GroupsPage.GroupPage.failed_to_add_members_a48a5dd0",
											),
										),
										{
											description: getErrorDetail(error),
										},
									);
								} finally {
									setSubmitting(false);
								}
							}}
						>
							<Spinner loading={submitting} />
							{tI18n("GroupsPage.GroupPage.add_users_4cd030d9")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default GroupPage;
