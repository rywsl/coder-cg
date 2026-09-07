import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { isApiError } from "#/api/errors";
import type { Group } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { AvatarCard } from "#/components/Avatar/AvatarCard";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useDashboard } from "#/modules/dashboard/useDashboard";

type AccountGroupsProps = {
	groups: readonly Group[] | undefined;
	error: unknown;
	loading: boolean;
};

export const AccountUserGroups: FC<AccountGroupsProps> = ({
	groups,
	error,
	loading,
}) => {
	const { t: tI18n } = useTranslation("users");

	const { showOrganizations } = useDashboard();

	return (
		<div>
			<SettingsHeader>
				<SettingsHeaderTitle hierarchy="secondary">
					{tI18n(
						"UserSettingsPage.AccountPage.AccountUserGroups.your_groups_62375359",
					)}
				</SettingsHeaderTitle>
				{groups && (
					<SettingsHeaderDescription>
						{tI18n(
							"UserSettingsPage.AccountPage.AccountUserGroups.you_are_in_0c6dac04",
						)}{" "}
						<em className="not-italic text-content-primary font-semibold">
							{groups.length}
							{tI18n(
								"UserSettingsPage.AccountPage.AccountUserGroups.group_42d62443",
							)}
							{groups.length !== 1 &&
								tI18n(
									"UserSettingsPage.AccountPage.AccountUserGroups.s_043a7187",
								)}
						</em>
					</SettingsHeaderDescription>
				)}
			</SettingsHeader>
			<div className="flex flex-col gap-6">
				{isApiError(error) && <ErrorAlert error={error} />}

				{groups && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{groups.map((group) => (
							<AvatarCard
								key={group.id}
								imgUrl={group.avatar_url}
								header={group.display_name || group.name}
								subtitle={
									showOrganizations ? (
										group.organization_display_name
									) : (
										<>
											{group.total_member_count}
											{tI18n(
												"UserSettingsPage.AccountPage.AccountUserGroups.member_262e1806",
											)}
											{group.total_member_count !== 1 &&
												tI18n(
													"UserSettingsPage.AccountPage.AccountUserGroups.s_043a7187",
												)}
										</>
									)
								}
							/>
						))}
					</div>
				)}

				{loading && <Loader />}
			</div>
		</div>
	);
};
