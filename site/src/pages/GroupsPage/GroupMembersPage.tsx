import { cn } from "cn";
import dayjs from "dayjs";
import { EllipsisVerticalIcon } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useOutletContext } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	groupAIBudget,
	groupMembersAISpend,
	removeMember,
} from "#/api/queries/groups";
import { meAISpend } from "#/api/queries/users";
import type {
	Group,
	GroupMemberAISpend,
	ReducedUser,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { UsersFilter } from "#/components/Filter/UsersFilter";
import { LastSeen } from "#/components/LastSeen/LastSeen";
import { PaginationContainer } from "#/components/PaginationWidget/PaginationContainer";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { formatBudgetUSD } from "#/utils/currency";
import { SpendEstimateDocsLink } from "./AICostControl";
import {
	effectiveBudgetGroup,
	GroupMemberBudgetCells,
} from "./GroupMemberBudgetCells";
import type { GroupPageOutletContext } from "./GroupPage";
import { StatusIconTooltip } from "./StatusIconTooltip";
import { UserAIBudgetOverrideDialog } from "./UserAIBudgetOverrideDialog";

type MemberWithSpend = ReducedUser & {
	readonly spend: GroupMemberAISpend | undefined;
};

const GroupMembersPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const {
		group: groupData,
		members,
		organization,
		permissions,
		membersQuery,
		filterProps,
	} = useOutletContext<GroupPageOutletContext>();
	const queryClient = useQueryClient();
	const removeMemberMutation = useMutation(
		removeMember(queryClient, organization),
	);
	const { permissions: sitePermissions } = useAuthenticated();
	const canUpdateGroup = permissions ? permissions.canUpdateGroup : false;
	// Setting a user's AI budget override updates both the user and the group
	// its spend is charged to, so it needs permission on both.
	const canUpdateBudgetOverride = canUpdateGroup && sitePermissions.updateUsers;
	const [budgetUser, setBudgetUser] = useState<MemberWithSpend | null>(null);

	const aibridgeVisible = Boolean(useFeatureVisibility().aibridge);
	const { data: aiSpend } = useQuery({
		...meAISpend(),
		enabled: aibridgeVisible,
	});
	const { data: groupBudget } = useQuery({
		...groupAIBudget(groupData.id),
		enabled: aibridgeVisible,
	});
	const memberIds = members.map((member) => member.id);
	const membersSpendQuery = useQuery({
		...groupMembersAISpend(groupData.id, memberIds),
		enabled: aibridgeVisible && memberIds.length > 0,
	});
	const spendByUserId = new Map(
		membersSpendQuery.data?.members.map((spend) => [spend.user_id, spend]) ??
			[],
	);
	// Join each member with its spend (undefined when loading, failed, or
	// omitted by the backend) so each row gets a single object.
	const membersWithSpend = members.map(
		(member): MemberWithSpend => ({
			...member,
			spend: spendByUserId.get(member.id),
		}),
	);
	const aiBudgetNote = [
		tI18n(
			"GroupsPage.GroupMembersPage.approximate_monthly_ai_spend_for_this_user_571db012",
		),
		// Spend resets at period_end, rendered in the viewer's local time.
		aiSpend &&
			`Resets ${dayjs(aiSpend.period_end).format("MMM D, YYYY h:mm A")}.`,
		// A $0 default still shows: it means no spending allowance.
		groupBudget &&
			`The group's default limit is ${formatBudgetUSD(groupBudget.spend_limit_micros)} per member.`,
	]
		.filter(Boolean)
		.join(" ");

	useEffect(() => {
		if (membersSpendQuery.error) {
			toast.error(
				getErrorMessage(
					membersSpendQuery.error,
					tI18n("GroupsPage.GroupMembersPage.unable_to_load_ai_spend_56745e64"),
				),
				{
					description: getErrorDetail(membersSpendQuery.error),
				},
			);
		}
	}, [membersSpendQuery.error]);

	return (
		<div className="flex flex-col w-full gap-1 pb-8">
			<UsersFilter {...filterProps} />
			<PaginationContainer query={membersQuery} paginationUnitLabel="members">
				<Table
					aria-label={tI18n(
						"GroupsPage.GroupMembersPage.group_members_dd0fd917",
					)}
				>
					<TableHeader>
						<TableRow>
							<TableHead className={aibridgeVisible ? undefined : "w-2/5"}>
								{tI18n("GroupsPage.GroupMembersPage.user_b512d97e")}
							</TableHead>
							<TableHead className={aibridgeVisible ? undefined : "w-3/5"}>
								{tI18n("GroupsPage.GroupMembersPage.status_920e413c")}
							</TableHead>
							{aibridgeVisible && (
								<>
									<TableHead>
										<div className="flex items-center gap-1">
											{tI18n("GroupsPage.GroupMembersPage.ai_spend_aa5699b0")}
											{membersSpendQuery.isError ? (
												<StatusIconTooltip
													kind="warning"
													message={tI18n(
														"GroupsPage.GroupMembersPage.ai_spend_couldn_t_be_loaded_so_budgets_aren_t_sh_ab1deeeb",
													)}
												/>
											) : (
												<StatusIconTooltip
													message={
														<>
															{aiBudgetNote} <SpendEstimateDocsLink />
														</>
													}
												/>
											)}
										</div>
									</TableHead>
									<TableHead>
										<div className="flex items-center gap-1">
											{tI18n(
												"GroupsPage.GroupMembersPage.budget_group_37717ac8",
											)}
											<StatusIconTooltip
												message={tI18n(
													"GroupsPage.GroupMembersPage.the_group_or_individual_budget_currently_respons_0c8ae32a",
												)}
											/>
										</div>
									</TableHead>
								</>
							)}
							<TableHead className="w-auto" />
						</TableRow>
					</TableHeader>

					<TableBody>
						{members.length === 0 ? (
							<TableEmpty
								message={tI18n(
									"GroupsPage.GroupMembersPage.no_members_found_a4e937d2",
								)}
							/>
						) : (
							membersWithSpend.map((member) => (
								<GroupMemberRow
									member={member}
									group={groupData}
									key={member.id}
									canUpdate={canUpdateGroup}
									showAIBudget={aibridgeVisible}
									onManageAIBudget={() => setBudgetUser(member)}
									onRemove={async () => {
										const mutation = removeMemberMutation.mutateAsync({
											groupId: groupData.id,
											userId: member.id,
										});
										toast.promise(mutation, {
											loading: tI18n(
												"GroupsPage.GroupMembersPage.removing_member_value0_from_value1_b16c41a9",
												{
													value0: member.username,
													value1: groupData.name,
												},
											),
											success: tI18n(
												"GroupsPage.GroupMembersPage.member_value0_has_been_removed_from_value1_succe_fae29014",
												{
													value0: member.username,
													value1: groupData.name,
												},
											),
											error: (error) => ({
												message: tI18n(
													"GroupsPage.GroupMembersPage.failed_to_remove_member_value0_from_value1_115f2e59",
													{
														value0: member.username,
														value1: groupData.name,
													},
												),
												description: getErrorDetail(error),
											}),
										});
									}}
								/>
							))
						)}
					</TableBody>
				</Table>
			</PaginationContainer>
			{aibridgeVisible && budgetUser && (
				<UserAIBudgetOverrideDialog
					open
					onOpenChange={(open) => {
						if (!open) {
							setBudgetUser(null);
						}
					}}
					user={budgetUser}
					currentGroup={groupData}
					effectiveGroupId={budgetUser.spend?.effective_group_id}
					canUpdate={canUpdateBudgetOverride}
				/>
			)}
		</div>
	);
};

interface GroupMemberRowProps {
	member: MemberWithSpend;
	group: Group;
	canUpdate: boolean;
	showAIBudget: boolean;
	onManageAIBudget: () => void;
	onRemove: () => void;
}

const GroupMemberRow: FC<GroupMemberRowProps> = ({
	member,
	group,
	canUpdate,
	showAIBudget,
	onManageAIBudget,
	onRemove,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const budgetFromOtherOrganization =
		effectiveBudgetGroup(member.spend, group).kind === "otherOrg";

	return (
		<TableRow key={member.id}>
			<TableCell width={showAIBudget ? undefined : "59%"}>
				<AvatarData
					avatar={
						<Avatar
							size="lg"
							fallback={member.username}
							src={member.avatar_url}
						/>
					}
					title={member.username}
					subtitle={
						member.is_service_account
							? tI18n("GroupsPage.GroupMembersPage.service_account_562c51b8")
							: member.email
					}
				/>
			</TableCell>
			<TableCell
				width={showAIBudget ? undefined : "40%"}
				className={cn(
					"capitalize",
					member.status === "suspended" ? "text-content-secondary" : "",
				)}
			>
				<div>{member.status}</div>
				<LastSeen at={member.last_seen_at} className="text-xs" />
			</TableCell>
			{showAIBudget && (
				<GroupMemberBudgetCells
					group={group}
					userID={member.id}
					spend={member.spend}
				/>
			)}
			<TableCell className="w-1 whitespace-nowrap">
				{canUpdate && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="icon-lg"
								variant="subtle"
								aria-label={tI18n(
									"GroupsPage.GroupMembersPage.open_menu_b40b3713",
								)}
							>
								<EllipsisVerticalIcon aria-hidden="true" />
								<span className="sr-only">
									{tI18n("GroupsPage.GroupMembersPage.open_menu_b40b3713")}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{showAIBudget && (
								<DropdownMenuItem
									onClick={onManageAIBudget}
									disabled={budgetFromOtherOrganization}
								>
									{tI18n(
										"GroupsPage.GroupMembersPage.manage_ai_budget_a299a2a5",
									)}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								className="text-content-destructive focus:text-content-destructive"
								onClick={onRemove}
								disabled={group.id === group.organization_id}
							>
								{tI18n("GroupsPage.GroupMembersPage.remove_c3812fc4")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</TableCell>
		</TableRow>
	);
};

export default GroupMembersPage;
