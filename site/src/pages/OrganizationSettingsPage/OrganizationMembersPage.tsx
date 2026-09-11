import { type FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	addOrganizationMember,
	paginatedOrganizationMembers,
	removeOrganizationMember,
	updateOrganizationMemberRoles,
} from "#/api/queries/organizations";
import { organizationRoles } from "#/api/queries/roles";
import type {
	AssignableRoles,
	OrganizationMemberWithUserData,
	User,
} from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { useFilter } from "#/components/Filter/Filter";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { usePaginatedQuery } from "#/hooks/usePaginatedQuery";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { RoleSelectorDialog } from "#/modules/roles/RoleSelectorDialog";
import { pageTitle } from "#/utils/page";
import { OrganizationMembersPageView } from "./OrganizationMembersPageView";

const OrganizationMembersPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const queryClient = useQueryClient();
	const { user: me } = useAuthenticated();
	const { organization: organizationName } = useParams() as {
		organization: string;
	};
	const { organization, organizationPermissions } = useOrganizationSettings();
	const searchParamsResult = useSearchParams();

	const organizationRolesQuery = useQuery(organizationRoles(organizationName));
	const membersQuery = usePaginatedQuery(
		paginatedOrganizationMembers(organizationName, searchParamsResult[0]),
	);
	const filterProps = useFilter({
		searchParams: searchParamsResult[0],
		onSearchParamsChange: searchParamsResult[1],
		onUpdate: membersQuery.goToFirstPage,
	});

	const addMemberMutation = useMutation(
		addOrganizationMember(queryClient, organizationName),
	);

	const [memberToEditRoles, setMemberToEditRoles] =
		useState<OrganizationMemberWithUserData>();
	const updateMemberRolesMutation = useMutation(
		updateOrganizationMemberRoles(queryClient, organizationName),
	);

	const [memberToRemove, setMemberToRemove] =
		useState<OrganizationMemberWithUserData>();
	const removeMemberMutation = useMutation(
		removeOrganizationMember(queryClient, organizationName),
	);

	// Resolve the org's default member role names against the assignable
	// roles list so the dialog can show full display names + descriptions.
	const defaultMemberImpliedRoles = useMemo<AssignableRoles[]>(() => {
		const available = organizationRolesQuery.data;
		if (!available) {
			return [];
		}
		return (organization?.default_org_member_roles ?? [])
			.map((name) => available.find((r) => r.name === name))
			.filter((r): r is AssignableRoles => r !== undefined);
	}, [organization?.default_org_member_roles, organizationRolesQuery.data]);

	if (!organization) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.OrganizationMembersPage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	const title = (
		<title>
			{pageTitle(
				tI18n(
					"OrganizationSettingsPage.OrganizationMembersPage.members_1044a4c0",
				),
				organization.display_name || organization.name,
			)}
		</title>
	);

	if (!organizationPermissions) {
		return (
			<>
				{title}
				<RequirePermission isFeatureVisible={false} />
			</>
		);
	}

	return (
		<>
			{title}
			<OrganizationMembersPageView
				error={
					membersQuery.error ??
					organizationRolesQuery.error ??
					addMemberMutation.error ??
					removeMemberMutation.error ??
					updateMemberRolesMutation.error
				}
				filterProps={{ filter: filterProps }}
				organizationName={organizationName}
				membersQuery={membersQuery}
				members={membersQuery.data?.members}
				addMembers={async (users: User[]) => {
					// TODO: Replace with a batch endpoint (POST /organizations/{org}/members)
					// to add all users in a single request instead of N individual calls.
					// See branch jakehwll/devex-112-organizations-batch-endpoint.
					await Promise.all(
						users.map((user) => addMemberMutation.mutateAsync(user.id)),
					);
					void membersQuery.refetch();
				}}
				onEditMemberRoles={setMemberToEditRoles}
				isUpdatingMemberRoles={updateMemberRolesMutation.isPending}
				removeMember={setMemberToRemove}
				me={me.id}
				canEditMembers={organizationPermissions.editMembers}
				canViewMembers={organizationPermissions.viewMembers}
			/>
			<RoleSelectorDialog
				key={memberToEditRoles?.username}
				user={memberToEditRoles}
				availableRoles={organizationRolesQuery.data}
				additionalImpliedRoles={defaultMemberImpliedRoles}
				onCancel={() => setMemberToEditRoles(undefined)}
				onUpdateRoles={async (roles) => {
					const member = memberToEditRoles;
					if (!member) {
						return;
					}
					try {
						await updateMemberRolesMutation.mutateAsync({
							userId: member.user_id,
							roles,
						});
						toast.success(
							tI18n(
								"OrganizationSettingsPage.OrganizationMembersPage.value0_s_roles_have_been_updated_709670d0",
								{
									value0: member.username,
								},
							),
						);
						setMemberToEditRoles(undefined);
					} catch (e) {
						toast.error(
							getErrorMessage(
								e,
								tI18n(
									"OrganizationSettingsPage.OrganizationMembersPage.error_updating_member_roles_a2b89cd1",
								),
							),
							{
								description: getErrorDetail(e),
							},
						);
					}
				}}
				isUpdatingRoles={updateMemberRolesMutation.isPending}
			/>
			<ConfirmDialog
				type="delete"
				open={memberToRemove !== undefined}
				onClose={() => setMemberToRemove(undefined)}
				title={tI18n(
					"OrganizationSettingsPage.OrganizationMembersPage.remove_member_9438e0ba",
				)}
				confirmText={tI18n(
					"OrganizationSettingsPage.OrganizationMembersPage.remove_c3812fc4",
				)}
				onConfirm={() => {
					if (memberToRemove) {
						const mutation = removeMemberMutation.mutateAsync(
							memberToRemove.user_id,
							{
								onSuccess: () => {
									membersQuery.refetch();
								},
							},
						);
						toast.promise(mutation, {
							loading: tI18n(
								"OrganizationSettingsPage.OrganizationMembersPage.removing_value0_from_value1_5ac7cb4b",
								{
									value0: memberToRemove.username,
									value1: organization.display_name,
								},
							),
							success: tI18n(
								"OrganizationSettingsPage.OrganizationMembersPage.value0_has_been_removed_from_value1_c6858675",
								{
									value0: memberToRemove.username,
									value1: organization.display_name,
								},
							),
							error: (error) =>
								getErrorMessage(
									error,
									tI18n(
										"OrganizationSettingsPage.OrganizationMembersPage.failed_to_remove_value0_from_value1_9227ee44",
										{
											value0: memberToRemove.username,
											value1: organization.display_name,
										},
									),
								),
						});
						setMemberToRemove(undefined);
					}
				}}
				description={
					<div className="flex flex-col gap-4">
						<p>
							{tI18n(
								"OrganizationSettingsPage.OrganizationMembersPage.removing_this_member_will_8fe8e7a7",
							)}
							<ul>
								<li>
									{tI18n(
										"OrganizationSettingsPage.OrganizationMembersPage.remove_the_member_from_all_groups_in_this_organi_d713beb3",
									)}
								</li>
								<li>
									{tI18n(
										"OrganizationSettingsPage.OrganizationMembersPage.remove_all_user_role_assignments_4d8b95c1",
									)}
								</li>
								<li>
									{tI18n(
										"OrganizationSettingsPage.OrganizationMembersPage.orphan_all_the_member_s_workspaces_associated_wi_dc60c5b1",
									)}
								</li>
							</ul>
						</p>

						<p className="pb-5">
							{tI18n(
								"OrganizationSettingsPage.OrganizationMembersPage.are_you_sure_you_want_to_remove_this_member_308e35ff",
							)}
						</p>
					</div>
				}
			/>
		</>
	);
};

export default OrganizationMembersPage;
