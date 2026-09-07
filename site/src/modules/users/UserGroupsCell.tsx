import { cn } from "cn";
import { UsersIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Group } from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/Popover/Popover";
import { TableCell } from "#/components/Table/Table";

type GroupsCellProps = {
	userGroups: readonly Group[] | undefined;
};

export const UserGroupsCell: FC<GroupsCellProps> = ({ userGroups }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<TableCell>
			{userGroups === undefined ? (
				<span>{tI18n("users.UserGroupsCell.no_groups_c3389e53")}</span>
			) : (
				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="cursor-pointer bg-transparent border-0 p-0 text-inherit leading-none"
							aria-label={
								userGroups.length === 0
									? tI18n("users.UserGroupsCell.no_groups_c3389e53")
									: tI18n(
											"users.UserGroupsCell.view_value0_group_value1_42c3c02f",
											{
												value0: userGroups.length,
												value1:
													userGroups.length !== 1
														? tI18n("users.UserGroupsCell.s_043a7187")
														: "",
											},
										)
							}
						>
							<div className="flex flex-row gap-2 items-center">
								<UsersIcon
									className={cn([
										"size-4 opacity-50",
										userGroups.length > 0 && "opacity-80",
									])}
								/>

								<span>
									{userGroups.length}
									{tI18n("users.UserGroupsCell.group_099a614d")}
									{userGroups.length !== 1 &&
										tI18n("users.UserGroupsCell.s_043a7187")}
								</span>
							</div>
						</button>
					</PopoverTrigger>

					<PopoverContent
						align="start"
						sideOffset={8}
						className="w-auto min-w-[240px] max-w-sm max-h-[400px] p-0"
					>
						<ul className="m-0 list-none flex flex-col flex-nowrap gap-0 px-0.5 py-1 text-sm">
							{userGroups.map((group) => {
								const groupName = group.display_name || group.name;
								return (
									<li
										key={group.id}
										className="flex gap-x-[10px] items-center px-2 py-1.5"
									>
										<Avatar
											size="sm"
											variant="icon"
											src={group.avatar_url}
											fallback={groupName}
										/>
										<span className="m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap leading-none">
											{groupName || (
												<em>{tI18n("users.UserGroupsCell.n_a_e2f79e5b")}</em>
											)}
										</span>
									</li>
								);
							})}
						</ul>
					</PopoverContent>
				</Popover>
			)}
		</TableCell>
	);
};
