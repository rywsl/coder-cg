import { EllipsisVerticalIcon, UserPlusIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { workspaceSharingSettings } from "#/api/queries/organizations";
import type {
	Group,
	WorkspaceACL,
	WorkspaceGroup,
	WorkspaceRole,
	WorkspaceUser,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
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
import { getGroupSubtitle } from "#/modules/groups";

interface RoleSelectProps {
	value: WorkspaceRole;
	disabled?: boolean;
	onValueChange: (value: WorkspaceRole) => void;
}

const RoleSelect: FC<RoleSelectProps> = ({
	value,
	disabled,
	onValueChange,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const roleLabels: Record<WorkspaceRole, string> = {
		use: tI18n(
			"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.use_c36d819e",
		),
		admin: tI18n(
			"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.admin_c1c224b0",
		),
		"": "",
	};

	return (
		<Select value={value} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger className="w-40 h-auto">
				<SelectValue>
					<span className="bg-surface-secondary rounded-md px-3 py-0.5 inline-block">
						{roleLabels[value]}
					</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="use" className="flex-col items-start py-2 w-64">
					<div className="font-medium text-content-primary">
						{tI18n(
							"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.use_c36d819e",
						)}
					</div>
					<div className="text-xs text-content-secondary leading-snug mt-0.5">
						{tI18n(
							"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.can_read_access_start_and_stop_this_workspace_7c8039dc",
						)}
					</div>
				</SelectItem>
				<SelectItem value="admin" className="flex-col items-start py-2 w-64">
					<div className="font-medium text-content-primary">
						{tI18n(
							"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.admin_c1c224b0",
						)}
					</div>
					<div className="text-xs text-content-secondary leading-snug mt-0.5">
						{tI18n(
							"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.can_manage_workspace_metadata_permissions_and_se_4adf17c9",
						)}
					</div>
				</SelectItem>
			</SelectContent>
		</Select>
	);
};

type AddWorkspaceMemberFormProps = {
	isLoading: boolean;
	onSubmit: () => void;
	disabled: boolean;
	children: ReactNode;
};

export const AddWorkspaceMemberForm: FC<AddWorkspaceMemberFormProps> = ({
	isLoading,
	onSubmit,
	disabled,
	children,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<form action={onSubmit}>
			<div className="flex flex-row items-center gap-2">
				{children}
				<Button disabled={disabled || isLoading} type="submit">
					<Spinner loading={isLoading}>
						<UserPlusIcon className="size-icon-sm" />
					</Spinner>
					{tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.add_member_17108415",
					)}
				</Button>
			</div>
		</form>
	);
};

type RoleSelectFieldProps = {
	value: WorkspaceRole;
	onChange: (value: WorkspaceRole) => void;
	disabled?: boolean;
};

export const RoleSelectField: FC<RoleSelectFieldProps> = ({
	value,
	onChange,
	disabled,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Select
			value={value}
			onValueChange={(val: WorkspaceRole) => onChange(val)}
			disabled={disabled}
		>
			<SelectTrigger className="w-40">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="use">
					{tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.use_c36d819e",
					)}
				</SelectItem>
				<SelectItem value="admin">
					{tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.admin_c1c224b0",
					)}
				</SelectItem>
			</SelectContent>
		</Select>
	);
};

interface WorkspaceSharingFormProps {
	organizationId: string;
	workspaceACL: WorkspaceACL | undefined;
	canUpdatePermissions: boolean;
	error: unknown;
	onUpdateUser: (user: WorkspaceUser, role: WorkspaceRole) => void;
	updatingUserId: WorkspaceUser["id"] | undefined;
	onRemoveUser: (user: WorkspaceUser) => void;
	onUpdateGroup: (group: WorkspaceGroup, role: WorkspaceRole) => void;
	updatingGroupId?: WorkspaceGroup["id"] | undefined;
	onRemoveGroup: (group: Group) => void;
	addMemberForm?: ReactNode;
	isCompact?: boolean;
	showRestartWarning?: boolean;
}

export const WorkspaceSharingForm: FC<WorkspaceSharingFormProps> = ({
	organizationId,
	workspaceACL,
	canUpdatePermissions,
	error,
	updatingUserId,
	onUpdateUser,
	onRemoveUser,
	updatingGroupId,
	onUpdateGroup,
	onRemoveGroup,
	addMemberForm,
	isCompact,
	showRestartWarning,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const sharingSettingsQuery = useQuery(
		workspaceSharingSettings(organizationId),
	);

	if (sharingSettingsQuery.isLoading) {
		return (
			<TableBody>
				<TableLoader />
			</TableBody>
		);
	}

	if (!sharingSettingsQuery.data) {
		return (
			<TableBody>
				<TableRow>
					<TableCell colSpan={999}>
						<ErrorAlert error={sharingSettingsQuery.error} />
					</TableCell>
				</TableRow>
			</TableBody>
		);
	}

	if (sharingSettingsQuery.data.sharing_disabled) {
		return (
			<TableBody>
				<TableEmpty
					message={tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.this_workspace_cannot_be_shared_bad4b075",
					)}
					description={tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.workspace_sharing_has_been_disabled_for_this_org_a1870104",
					)}
					isCompact={isCompact}
				/>
			</TableBody>
		);
	}

	const isEmpty = Boolean(
		workspaceACL &&
			workspaceACL.users.length === 0 &&
			workspaceACL.group.length === 0,
	);

	const tableHeader = (
		<TableHeader>
			<TableRow>
				<TableHead className="w-[50%] py-2">
					{tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.member_7c968fb7",
					)}
				</TableHead>
				<TableHead className="w-[40%] py-2">
					{tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.role_14736a2e",
					)}
				</TableHead>
				<TableHead className="w-[10%] py-2" />
			</TableRow>
		</TableHeader>
	);

	const tableBody = (
		<TableBody>
			{!workspaceACL ? (
				<TableLoader />
			) : isEmpty ? (
				<TableEmpty
					message={tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.no_shared_members_or_groups_yet_95df21c4",
					)}
					description={tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.add_a_member_or_group_using_the_controls_above_694a1dc1",
					)}
					isCompact={isCompact}
				/>
			) : (
				<>
					{workspaceACL.group.map((group) => (
						<TableRow key={group.id}>
							<TableCell className="py-2 w-[50%]">
								<AvatarData
									avatar={
										<Avatar
											size="lg"
											fallback={group.display_name || group.name}
											src={group.avatar_url}
										/>
									}
									title={group.display_name || group.name}
									subtitle={getGroupSubtitle(group)}
								/>
							</TableCell>
							<TableCell className="py-2 w-[40%]">
								{canUpdatePermissions ? (
									<RoleSelect
										value={group.role}
										disabled={updatingGroupId === group.id}
										onValueChange={(value) => onUpdateGroup(group, value)}
									/>
								) : (
									<div className="capitalize">{group.role}</div>
								)}
							</TableCell>

							<TableCell className="py-2 w-[10%]">
								{canUpdatePermissions && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												size="icon-lg"
												variant="subtle"
												aria-label={tI18n(
													"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.open_menu_b40b3713",
												)}
											>
												<EllipsisVerticalIcon aria-hidden="true" />
												<span className="sr-only">
													{tI18n(
														"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.open_menu_b40b3713",
													)}
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												className="text-content-destructive focus:text-content-destructive"
												onClick={() => onRemoveGroup(group)}
											>
												{tI18n(
													"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.remove_c3812fc4",
												)}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</TableCell>
						</TableRow>
					))}

					{workspaceACL.users.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="py-2 w-[50%]">
								<AvatarData
									title={user.username}
									subtitle={user.name}
									src={user.avatar_url}
								/>
							</TableCell>
							<TableCell className="py-2 w-[40%]">
								{canUpdatePermissions ? (
									<RoleSelect
										value={user.role}
										disabled={updatingUserId === user.id}
										onValueChange={(value) => onUpdateUser(user, value)}
									/>
								) : (
									<div className="capitalize">{user.role}</div>
								)}
							</TableCell>

							<TableCell className="py-2 w-[10%]">
								{canUpdatePermissions && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												size="icon-lg"
												variant="subtle"
												aria-label={tI18n(
													"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.open_menu_b40b3713",
												)}
											>
												<EllipsisVerticalIcon aria-hidden="true" />
												<span className="sr-only">
													{tI18n(
														"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.open_menu_b40b3713",
													)}
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												className="text-content-destructive focus:text-content-destructive"
												onClick={() => onRemoveUser(user)}
											>
												{tI18n(
													"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.remove_c3812fc4",
												)}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</TableCell>
						</TableRow>
					))}
				</>
			)}
		</TableBody>
	);

	if (isCompact) {
		return (
			<div className="flex flex-col gap-4">
				{Boolean(error) && <ErrorAlert error={error} />}
				{canUpdatePermissions && addMemberForm}
				{showRestartWarning && (
					<Alert severity="warning">
						{tI18n(
							"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.workspace_restart_required_for_the_removal_to_ta_549abb7b",
						)}
					</Alert>
				)}
				<div>
					<Table>{tableHeader}</Table>
					<div className="max-h-60 overflow-y-auto">
						<Table>{tableBody}</Table>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{Boolean(error) && <ErrorAlert error={error} />}
			{canUpdatePermissions && addMemberForm}
			{showRestartWarning && (
				<Alert severity="warning">
					{tI18n(
						"workspaces.WorkspaceSharingForm.WorkspaceSharingForm.workspace_restart_required_for_the_removal_to_ta_549abb7b",
					)}
				</Alert>
			)}
			<Table>
				{tableHeader}
				{tableBody}
			</Table>
		</div>
	);
};
