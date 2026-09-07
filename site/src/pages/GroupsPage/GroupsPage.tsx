import { type FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	organizationGroupsAISpend,
	paginatedGroupsByOrganization,
} from "#/api/queries/groups";
import { organizationsPermissions } from "#/api/queries/organizations";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { useFilter } from "#/components/Filter/Filter";
import { Loader } from "#/components/Loader/Loader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { usePaginatedQuery } from "#/hooks/usePaginatedQuery";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { useGroupsSettings } from "./GroupsPageProvider";
import { GroupsPageView, joinGroupsSpend } from "./GroupsPageView";

const GroupsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { permissions: authPermissions } = useAuthenticated();
	const { template_rbac: groupsEnabled, aibridge } = useFeatureVisibility();
	const { organization, showOrganizations } = useGroupsSettings();
	const aibridgeVisible = Boolean(aibridge);
	const [searchParams, setSearchParams] = useSearchParams();
	const groupsQuery = usePaginatedQuery({
		...paginatedGroupsByOrganization(organization?.name ?? "", searchParams),
		enabled: Boolean(groupsEnabled && organization),
	});
	const filter = useFilter({
		searchParams,
		onSearchParamsChange: setSearchParams,
		onUpdate: groupsQuery.goToFirstPage,
	});
	const groupIds = groupsQuery.data?.groups.map((group) => group.id) ?? [];
	const groupsSpendQuery = useQuery({
		...organizationGroupsAISpend(organization?.name ?? "", groupIds),
		enabled: aibridgeVisible && Boolean(organization) && groupIds.length > 0,
	});
	const groupsWithSpend = joinGroupsSpend(
		groupsQuery.data?.groups,
		groupsSpendQuery.data,
	);
	const permissionsQuery = useQuery({
		...organizationsPermissions([organization?.id ?? ""]),
		enabled: Boolean(organization),
	});

	useEffect(() => {
		if (groupsQuery.error) {
			toast.error(
				getErrorMessage(
					groupsQuery.error,
					tI18n("GroupsPage.GroupsPage.unable_to_load_groups_2d2aa329"),
				),
				{
					description: getErrorDetail(groupsQuery.error),
				},
			);
		}
	}, [groupsQuery.error]);

	useEffect(() => {
		if (groupsSpendQuery.error) {
			toast.error(
				getErrorMessage(
					groupsSpendQuery.error,
					tI18n("GroupsPage.GroupsPage.unable_to_load_ai_spend_56745e64"),
				),
				{
					description: getErrorDetail(groupsSpendQuery.error),
				},
			);
		}
	}, [groupsSpendQuery.error]);

	useEffect(() => {
		if (permissionsQuery.error) {
			toast.error(
				getErrorMessage(
					permissionsQuery.error,
					tI18n("GroupsPage.GroupsPage.unable_to_load_permissions_a4c6356b"),
				),
				{
					description: getErrorDetail(permissionsQuery.error),
				},
			);
		}
	}, [permissionsQuery.error]);

	if (!organization) {
		return (
			<EmptyState
				message={tI18n("GroupsPage.GroupsPage.organization_not_found_00c50f7a")}
			/>
		);
	}

	if (permissionsQuery.isLoading) {
		return <Loader />;
	}

	const title = (
		<title>{pageTitle(tI18n("GroupsPage.GroupsPage.groups_39bbb719"))}</title>
	);

	const permissions = permissionsQuery.data?.[organization.id];

	if (!permissions?.viewGroups) {
		return (
			<>
				{title}
				<RequirePermission isFeatureVisible={false} />
			</>
		);
	}

	return (
		<div className="w-full max-w-(--breakpoint-2xl) pb-10">
			{title}

			<GroupsPageView
				groups={groupsWithSpend}
				spendError={groupsSpendQuery.isError}
				canCreateGroup={permissions.createGroup}
				groupsEnabled={groupsEnabled}
				showOrganizations={showOrganizations}
				showAIBudget={aibridgeVisible}
				filterProps={{ filter }}
				groupsQuery={groupsQuery}
				permissions={authPermissions}
			/>
		</div>
	);
};

export default GroupsPage;
