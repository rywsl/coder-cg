import { cn } from "cn";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "react-i18next";
import type { GroupsByUserId } from "#/api/queries/groups";
import type * as TypesGen from "#/api/typesGenerated";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { AvatarDataSkeleton } from "#/components/Avatar/AvatarDataSkeleton";
import { LastSeen } from "#/components/LastSeen/LastSeen";
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
import type { UserAdminAction } from "#/modules/users/UserActionDialogs";
import { UserGroupsCell } from "#/modules/users/UserGroupsCell";
import {
	GroupsHelpPopover,
	RolesHelpPopover,
} from "#/modules/users/UserHelpPopovers";
import { UserMoreActions } from "#/modules/users/UserMoreActions";
import { UserRoleCell } from "#/modules/users/UserRoleCell";

dayjs.extend(relativeTime);

export type UsersTableProps = {
	isLoading: boolean;
	users: readonly TypesGen.User[] | undefined;
	groupsByUserId: GroupsByUserId | undefined;
	/**
	 * Used to disable the UI of actions that users cannot perform on themselves,
	 * like delete.
	 */
	me: string;
	canEditUsers: boolean;
	canViewActivity?: boolean;
	/** User roles cannot be edited if OIDC Role Sync is enabled. */
	oidcRoleSyncEnabled?: boolean;
	onAction: (action: UserAdminAction) => void;
};

export const UsersTable: React.FC<UsersTableProps> = (props) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<Table
			data-testid="users-table"
			aria-label={tI18n("UsersPage.UsersTable.users_6b0cc904")}
		>
			<TableHeader>
				<TableRow>
					<TableHead className="w-max">
						{tI18n("UsersPage.UsersTable.user_b512d97e")}
					</TableHead>
					<TableHead className="w-1/6">
						<div className="flex flex-row gap-2 items-center">
							<span>{tI18n("UsersPage.UsersTable.roles_c2533705")}</span>
							<RolesHelpPopover />
						</div>
					</TableHead>
					<TableHead className="w-1/6">
						<div className="flex flex-row gap-2 items-center">
							<span>{tI18n("UsersPage.UsersTable.groups_39bbb719")}</span>
							<GroupsHelpPopover />
						</div>
					</TableHead>
					<TableHead className="w-1/6">
						{tI18n("UsersPage.UsersTable.status_920e413c")}
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<UsersTableBody {...props} />
			</TableBody>
		</Table>
	);
};

const UsersTableBody: React.FC<UsersTableProps> = ({
	isLoading,
	users,
	groupsByUserId,
	me,
	canEditUsers,
	canViewActivity,
	oidcRoleSyncEnabled,
	onAction,
}) => {
	const { t: tI18n } = useTranslation("users");

	if (isLoading) {
		return <UsersTableSkeleton canEditUsers={canEditUsers} />;
	}

	if (!users || users.length === 0) {
		return (
			<TableEmpty
				message={tI18n("UsersPage.UsersTable.no_users_found_bf1e104f")}
			/>
		);
	}

	return users.map((user) => (
		<TableRow key={user.id} data-testid={`user-${user.id}`}>
			<TableCell>
				<AvatarData
					title={user.username}
					subtitle={
						user.is_service_account
							? tI18n("UsersPage.UsersTable.service_account_562c51b8")
							: user.email
					}
					src={user.avatar_url}
				/>
			</TableCell>

			<UserRoleCell roles={user.roles} />

			<UserGroupsCell userGroups={groupsByUserId?.get(user.id)} />

			<TableCell
				className={cn(
					"capitalize",
					user.status === "suspended" && "text-content-secondary",
				)}
			>
				<div>{user.status}</div>
				{(user.status === "active" || user.status === "dormant") && (
					<LastSeen at={user.last_seen_at} className="text-xs" />
				)}
			</TableCell>

			{canEditUsers && (
				<TableCell className="w-px whitespace-nowrap text-right">
					<div className="flex justify-end">
						<UserMoreActions
							user={user}
							me={me}
							canViewActivity={canViewActivity}
							oidcRoleSyncEnabled={oidcRoleSyncEnabled}
							onAction={onAction}
						/>
					</div>
				</TableCell>
			)}
		</TableRow>
	));
};

type UsersTableSkeletonProps = {
	canEditUsers: boolean;
};

const UsersTableSkeleton: React.FC<UsersTableSkeletonProps> = ({
	canEditUsers,
}) => {
	return (
		<TableLoaderSkeleton>
			<TableRowSkeleton>
				<TableCell>
					<AvatarDataSkeleton />
				</TableCell>

				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>

				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>

				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>

				{canEditUsers && (
					<TableCell className="w-px whitespace-nowrap text-right">
						<div className="flex justify-end">
							<Skeleton variant="text" width="25%" />
						</div>
					</TableCell>
				)}
			</TableRowSkeleton>
		</TableLoaderSkeleton>
	);
};
