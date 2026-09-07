import { EllipsisVerticalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type {
	Group,
	OrganizationMemberWithUserData,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { PremiumBadge } from "#/components/Badge/PresetBadges";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
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
import { UserGroupsCell } from "#/modules/users/UserGroupsCell";
import {
	GroupsHelpPopover,
	RolesHelpPopover,
} from "#/modules/users/UserHelpPopovers";
import { UserRoleCell } from "#/modules/users/UserRoleCell";

export type OrganizationMembersTableProps = {
	// State
	organizationName: string;
	members: Array<OrganizationMemberTableEntry> | undefined;

	// Actions
	onEditMemberRoles: (member: OrganizationMemberWithUserData) => void;
	isUpdatingMemberRoles: boolean;
	removeMember: (member: OrganizationMemberWithUserData) => void;

	// Permissions
	/**
	 * Used to disable the UI of actions that users cannot perform on themselves,
	 * like delete.
	 */
	me: string;
	canEditMembers: boolean;
	canViewActivity: boolean;
};

type OrganizationMemberTableEntry = OrganizationMemberWithUserData & {
	groups: readonly Group[] | undefined;
};

export const OrganizationMembersTable: React.FC<
	OrganizationMembersTableProps
> = (props) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-max">
						{tI18n(
							"OrganizationSettingsPage.OrganizationMembersTable.user_b512d97e",
						)}
					</TableHead>
					<TableHead className="w-1/6">
						<div className="flex flex-row items-center gap-2">
							<span>
								{tI18n(
									"OrganizationSettingsPage.OrganizationMembersTable.roles_c2533705",
								)}
							</span>
							<RolesHelpPopover />
						</div>
					</TableHead>
					<TableHead className="w-1/6">
						<div className="flex flex-row items-center gap-2">
							<span>
								{tI18n(
									"OrganizationSettingsPage.OrganizationMembersTable.groups_39bbb719",
								)}
							</span>
							<GroupsHelpPopover />
						</div>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<OrganizationMembersTableBody {...props} />
			</TableBody>
		</Table>
	);
};

const OrganizationMembersTableBody: React.FC<OrganizationMembersTableProps> = ({
	organizationName,
	members,

	isUpdatingMemberRoles,
	removeMember,
	onEditMemberRoles,

	me,
	canEditMembers,
	canViewActivity,
}) => {
	const { t: tI18n } = useTranslation("administration");

	if (!members) {
		return <TableLoader />;
	}

	if (!members.length) {
		return (
			<TableEmpty
				message={tI18n(
					"OrganizationSettingsPage.OrganizationMembersTable.no_members_in_this_organization_79ba6b4b",
				)}
			/>
		);
	}

	return (
		<>
			{members.map((member) => (
				<TableRow key={member.user_id} className="align-baseline">
					<TableCell>
						<AvatarData
							avatar={
								<Avatar
									fallback={member.username}
									src={member.avatar_url}
									size="lg"
								/>
							}
							title={member.name || member.username}
							subtitle={member.email}
						/>
					</TableCell>
					<UserRoleCell
						globalRoles={member.global_roles}
						roles={member.roles}
					/>
					<UserGroupsCell userGroups={member.groups} />
					<TableCell className="w-px whitespace-nowrap text-right">
						<div className="flex justify-end">
							{member.user_id !== me && canEditMembers && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="icon-lg"
											variant="subtle"
											aria-label={tI18n(
												"OrganizationSettingsPage.OrganizationMembersTable.open_menu_b40b3713",
											)}
										>
											<EllipsisVerticalIcon aria-hidden="true" />
											<span className="sr-only">
												{tI18n(
													"OrganizationSettingsPage.OrganizationMembersTable.open_menu_b40b3713",
												)}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem asChild>
											<Link
												to={`/workspaces?filter=${encodeURIComponent(`owner:${member.username} organization:${organizationName}`)}`}
											>
												{tI18n(
													"OrganizationSettingsPage.OrganizationMembersTable.view_workspaces_8cf7e8d0",
												)}
											</Link>
										</DropdownMenuItem>

										{canViewActivity && (
											<DropdownMenuItem asChild disabled={!canViewActivity}>
												<Link
													to={`/audit?filter=${encodeURIComponent(`username:${member.username} organization:${organizationName}`)}`}
												>
													{tI18n(
														"OrganizationSettingsPage.OrganizationMembersTable.view_activity_c469de16",
													)}
													{!canViewActivity && <PremiumBadge />}
												</Link>
											</DropdownMenuItem>
										)}

										<DropdownMenuItem
											disabled={isUpdatingMemberRoles}
											onClick={() => onEditMemberRoles(member)}
										>
											{tI18n(
												"OrganizationSettingsPage.OrganizationMembersTable.edit_roles_3b3489d0",
											)}
										</DropdownMenuItem>

										<DropdownMenuSeparator />

										<DropdownMenuItem
											className="text-content-destructive focus:text-content-destructive"
											onClick={() => removeMember(member)}
										>
											{tI18n(
												"OrganizationSettingsPage.OrganizationMembersTable.remove_708d2523",
											)}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					</TableCell>
				</TableRow>
			))}
		</>
	);
};
