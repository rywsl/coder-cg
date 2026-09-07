import { ChevronRightIcon, PlusIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link as RouterLink, useNavigate } from "react-router";
import {
	GROUP_MEMBER_AVATAR_LIMIT,
	groupMemberAvatars,
} from "#/api/queries/groups";
import type {
	OrganizationGroupsAISpend,
	PaginatedGroup,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { AvatarDataSkeleton } from "#/components/Avatar/AvatarDataSkeleton";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import type { useFilter } from "#/components/Filter/Filter";
import { GroupsFilter } from "#/components/Filter/GroupsFilter";
import { PaginationContainer } from "#/components/PaginationWidget/PaginationContainer";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import {
	TableLoaderSkeleton,
	TableRowSkeleton,
} from "#/components/TableLoader/TableLoader";
import { useClickableTableRow } from "#/hooks/useClickableTableRow";
import type { PaginationResultInfo } from "#/hooks/usePaginatedQuery";
import { AIBudgetUsage } from "#/modules/groups/AIBudgetUsage";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import { SpendEstimateDocsLink } from "./AICostControl";
import { StatusIconTooltip } from "./StatusIconTooltip";

const EM_DASH = "\u2014";

// Stable keys for the avatar loading skeletons (indexes would trip lint).
const AVATAR_SKELETON_KEYS = ["a", "b", "c", "d", "e"];

export type GroupWithSpend = PaginatedGroup & {
	readonly spend: OrganizationGroupsAISpend["groups"][number] | undefined;
};

/** Attach each group's spend, when present, so rows get a single object. */
export const joinGroupsSpend = (
	groups: readonly PaginatedGroup[] | undefined,
	groupsSpend: OrganizationGroupsAISpend | undefined,
): GroupWithSpend[] | undefined => {
	if (groups === undefined) {
		return undefined;
	}
	const spendByGroupId = new Map(
		groupsSpend?.groups.map((spend) => [spend.group_id, spend]) ?? [],
	);
	return groups.map((group) => ({
		...group,
		spend: spendByGroupId.get(group.id),
	}));
};

type GroupsPageViewProps = {
	groups: GroupWithSpend[] | undefined;
	/** True when the spend query failed; cells then show an em dash. */
	spendError: boolean;
	canCreateGroup: boolean;
	groupsEnabled: boolean;
	showOrganizations: boolean;
	showAIBudget: boolean;
	filterProps: { filter: ReturnType<typeof useFilter> };
	groupsQuery: PaginationResultInfo & {
		isPlaceholderData: boolean;
	};
	permissions: Permissions;
};

export const GroupsPageView: FC<GroupsPageViewProps> = ({
	groups,
	spendError,
	canCreateGroup,
	groupsEnabled,
	showOrganizations,
	showAIBudget,
	filterProps,
	groupsQuery,
	permissions,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<>
			<SettingsHeader
				actions={
					groupsEnabled &&
					canCreateGroup && (
						<Button asChild>
							<RouterLink to="create">
								<PlusIcon />
								{tI18n("GroupsPage.GroupsPageView.new_group_df796c65")}
							</RouterLink>
						</Button>
					)
				}
			>
				<SettingsHeaderTitle>
					{tI18n("GroupsPage.GroupsPageView.groups_39bbb719")}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n("GroupsPage.GroupsPageView.manage_groups_for_this_821d0cf5")}{" "}
					{showOrganizations
						? tI18n("GroupsPage.GroupsPageView.organization_af3a1bb3")
						: tI18n("GroupsPage.GroupsPageView.deployment_aee50b18")}
					. <SettingsHeaderDocsLink href={docs("/admin/users/groups-roles")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			{!groupsEnabled ? (
				<PremiumPaywall
					source="groups"
					message={tI18n("GroupsPage.GroupsPageView.groups_39bbb719")}
					description={tI18n(
						"GroupsPage.GroupsPageView.run_isolated_business_units_on_one_deployment_ea_3b4f63c9",
					)}
					features={[
						tI18n(
							"GroupsPage.GroupsPageView.isolate_provisioners_infrastructure_b9bf8bb0",
						),
						tI18n(
							"GroupsPage.GroupsPageView.sync_org_membership_from_your_idp_48008951",
						),
						tI18n(
							"GroupsPage.GroupsPageView.manage_orgs_at_scale_via_terraform_5dea644c",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<GroupsFilter {...filterProps} />

					<PaginationContainer query={groupsQuery} paginationUnitLabel="groups">
						<Table
							aria-label={tI18n("GroupsPage.GroupsPageView.groups_39bbb719")}
						>
							<TableHeader>
								<TableRow>
									<TableHead className="w-2/5">
										{tI18n("GroupsPage.GroupsPageView.name_dcd1d522")}
									</TableHead>
									<TableHead className={showAIBudget ? "w-1/5" : "w-3/5"}>
										{tI18n("GroupsPage.GroupsPageView.users_6b0cc904")}
									</TableHead>
									{showAIBudget && (
										<TableHead className="w-2/5">
											<div className="flex items-center gap-1">
												{tI18n("GroupsPage.GroupsPageView.ai_spend_aa5699b0")}
												{spendError ? (
													<StatusIconTooltip
														kind="warning"
														message={tI18n(
															"GroupsPage.GroupsPageView.ai_spend_couldn_t_be_loaded_so_budgets_aren_t_sh_ab1deeeb",
														)}
													/>
												) : (
													<StatusIconTooltip
														message={
															<>
																{tI18n(
																	"GroupsPage.GroupsPageView.approximate_ai_spend_compared_to_the_group_s_ai__15f47d8b",
																)}{" "}
																<SpendEstimateDocsLink />
															</>
														}
													/>
												)}
											</div>
										</TableHead>
									)}
									<TableHead className="w-auto" />
								</TableRow>
							</TableHeader>
							<TableBody>
								<GroupsTableBody
									groups={groups}
									canCreateGroup={canCreateGroup}
									showAIBudget={showAIBudget}
									filterUsed={filterProps.filter.used}
								/>
							</TableBody>
						</Table>
					</PaginationContainer>
				</div>
			)}
		</>
	);
};

interface GroupsTableBodyProps {
	groups: GroupWithSpend[] | undefined;
	canCreateGroup: boolean;
	showAIBudget: boolean;
	filterUsed: boolean;
}

const GroupsTableBody: FC<GroupsTableBodyProps> = ({
	groups,
	canCreateGroup,
	showAIBudget,
	filterUsed,
}) => {
	const { t: tI18n } = useTranslation("administration");

	if (groups === undefined) {
		return <TableLoader showAIBudget={showAIBudget} />;
	}
	if (groups.length === 0) {
		// When a search returned no matches, don't nudge the user to create a
		// first group; the org may already have groups that simply don't match.
		if (filterUsed) {
			return (
				<TableRow>
					<TableCell colSpan={999}>
						<EmptyState
							message={tI18n(
								"GroupsPage.GroupsPageView.no_groups_match_your_search_912c257c",
							)}
							description={tI18n(
								"GroupsPage.GroupsPageView.try_a_different_search_term_36b89662",
							)}
						/>
					</TableCell>
				</TableRow>
			);
		}
		return (
			<TableEmpty
				message={tI18n("GroupsPage.GroupsPageView.no_groups_yet_07514d06")}
				description={
					canCreateGroup
						? tI18n(
								"GroupsPage.GroupsPageView.create_your_first_group_0a185439",
							)
						: tI18n(
								"GroupsPage.GroupsPageView.you_don_t_have_permission_to_create_a_group_67edd33f",
							)
				}
				cta={
					canCreateGroup && (
						<Button asChild>
							<RouterLink to="create">
								<PlusIcon />
								{tI18n("GroupsPage.GroupsPageView.new_group_df796c65")}
							</RouterLink>
						</Button>
					)
				}
			/>
		);
	}
	return (
		<>
			{groups.map((group) => (
				<GroupRow key={group.id} group={group} showAIBudget={showAIBudget} />
			))}
		</>
	);
};

interface GroupRowProps {
	group: GroupWithSpend;
	showAIBudget: boolean;
}

const GroupRow: FC<GroupRowProps> = ({ group, showAIBudget }) => {
	const { t: tI18n } = useTranslation("administration");

	const navigate = useNavigate();
	const rowProps = useClickableTableRow({
		onClick: () => navigate(group.name),
	});

	// The list endpoint returns only total_member_count, so fetch a small
	// avatar preview per visible row instead of a full roster.
	const membersQuery = useQuery({
		...groupMemberAvatars(
			group.organization_name,
			group.name,
			GROUP_MEMBER_AVATAR_LIMIT,
		),
		enabled: group.total_member_count > 0,
	});
	const memberAvatars = membersQuery.data?.users ?? [];
	const remainingAvatars = group.total_member_count - memberAvatars.length;
	const skeletonCount = Math.min(
		group.total_member_count,
		GROUP_MEMBER_AVATAR_LIMIT,
	);

	return (
		<TableRow data-testid={`group-${group.id}`} {...rowProps}>
			<TableCell>
				<AvatarData
					avatar={
						<Avatar
							size="lg"
							variant="icon"
							fallback={group.display_name || group.name}
							src={group.avatar_url}
						/>
					}
					title={group.display_name || group.name}
					subtitle={tI18n("GroupsPage.GroupsPageView.value0_members_251dc659", {
						value0: group.total_member_count,
					})}
				/>
			</TableCell>
			<TableCell>
				{group.total_member_count === 0 || membersQuery.isError ? (
					EM_DASH
				) : membersQuery.isLoading ? (
					<div className="flex items-center gap-2">
						{AVATAR_SKELETON_KEYS.slice(0, skeletonCount).map((key) => (
							<Skeleton key={key} className="size-(--avatar-default)" />
						))}
					</div>
				) : (
					<div className="flex items-center gap-2">
						{memberAvatars.map((member) => (
							<Avatar
								key={member.username}
								fallback={member.username}
								src={member.avatar_url}
							/>
						))}
						{remainingAvatars > 0 && (
							<Badge className="h-(--avatar-default)">
								+{remainingAvatars}
							</Badge>
						)}
					</div>
				)}
			</TableCell>
			{showAIBudget && (
				<TableCell>
					{group.spend ? (
						<AIBudgetUsage
							currentSpend={group.spend.current_spend_micros}
							spendLimit={group.spend.total_spend_limit_micros}
						/>
					) : (
						EM_DASH
					)}
				</TableCell>
			)}
			<TableCell>
				<div className="flex">
					<ChevronRightIcon className="size-icon-sm" />
				</div>
			</TableCell>
		</TableRow>
	);
};

const TableLoader: FC<{ showAIBudget: boolean }> = ({ showAIBudget }) => {
	return (
		<TableLoaderSkeleton>
			<TableRowSkeleton>
				<TableCell>
					<div className="flex items-center gap-2">
						<AvatarDataSkeleton />
					</div>
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
				{showAIBudget && (
					<TableCell>
						<Skeleton variant="text" width="50%" />
					</TableCell>
				)}
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
			</TableRowSkeleton>
		</TableLoaderSkeleton>
	);
};
