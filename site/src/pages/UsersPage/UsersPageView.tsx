import { UserPlusIcon } from "lucide-react";
import { type ComponentProps, type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { UsersFilter } from "#/components/Filter/UsersFilter";
import {
	PaginationContainer,
	type PaginationResult,
} from "#/components/PaginationWidget/PaginationContainer";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	UserActionDialogs,
	type UserAdminAction,
} from "#/modules/users/UserActionDialogs";
import { UsersTable, type UsersTableProps } from "./UsersTable";

type UsersPageViewProps = Omit<UsersTableProps, "users" | "onAction"> & {
	filterProps: ComponentProps<typeof UsersFilter>;
	usersQuery: PaginationResult<TypesGen.GetUsersResponse>;
	canCreateUser?: boolean;
};

export const UsersPageView: FC<UsersPageViewProps> = ({
	filterProps,
	usersQuery,
	canCreateUser,
	...props
}) => {
	const { t: tI18n } = useTranslation("users");

	const [action, setAction] = useState<UserAdminAction | undefined>();

	return (
		<>
			<SettingsHeader
				actions={
					canCreateUser && (
						<Button asChild>
							<Link to="create">
								<UserPlusIcon />
								{tI18n("UsersPage.UsersPageView.create_user_f06da128")}
							</Link>
						</Button>
					)
				}
			>
				<SettingsHeaderTitle>
					{tI18n("UsersPage.UsersPageView.users_6b0cc904")}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"UsersPage.UsersPageView.manage_user_accounts_and_permissions_28ffc747",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<UsersFilter {...filterProps} />
			<PaginationContainer query={usersQuery} paginationUnitLabel="users">
				<UsersTable
					{...props}
					users={usersQuery.data?.users}
					onAction={setAction}
				/>
			</PaginationContainer>
			<UserActionDialogs action={action} onClose={() => setAction(undefined)} />
		</>
	);
};
