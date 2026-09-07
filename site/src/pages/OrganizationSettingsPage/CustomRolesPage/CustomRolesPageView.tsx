import { EllipsisVerticalIcon, PlusIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router";
import type { AssignableRoles, Organization, Role } from "#/api/typesGenerated";
import { PremiumBadge } from "#/components/Badge/PresetBadges";
import { Button, Button as ShadcnButton } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import {
	SettingsHeader,
	SettingsHeaderDescription,
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
import { PremiumPaywallSmall } from "#/modules/paywall/PremiumPaywallSmall";
import type { Permissions } from "#/modules/permissions";
import { DefaultRolesDialog } from "./DefaultRolesDialog";
import { PermissionPillsList } from "./PermissionPillsList";

interface CustomRolesPageViewProps {
	organization: Organization;
	builtInRoles: AssignableRoles[] | undefined;
	customRoles: AssignableRoles[] | undefined;
	onDeleteRole: (role: Role) => void;
	canCreateOrgRole: boolean;
	canUpdateOrgRole: boolean;
	canDeleteOrgRole: boolean;
	canEditDefaultRoles: boolean;
	isCustomRolesEnabled: boolean;
	permissions: Permissions;
	defaultRolesEntitled?: boolean;
	availableOrgRoles?: AssignableRoles[];
	onUpdateDefaultRoles?: (roles: string[]) => Promise<void>;
	isUpdatingDefaultRoles?: boolean;
}

export const CustomRolesPageView: FC<CustomRolesPageViewProps> = ({
	organization,
	builtInRoles,
	customRoles,
	onDeleteRole,
	canCreateOrgRole,
	canUpdateOrgRole,
	canDeleteOrgRole,
	canEditDefaultRoles,
	isCustomRolesEnabled,
	permissions,
	defaultRolesEntitled,
	availableOrgRoles,
	onUpdateDefaultRoles,
	isUpdatingDefaultRoles,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col gap-12">
			{!isCustomRolesEnabled && (
				<PremiumPaywallSmall
					source="custom_roles"
					message={tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.custom_roles_6e845384",
					)}
					description={tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.build_roles_with_the_exact_permissions_your_team_e2ae93f0",
					)}
					features={[
						tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.configure_roles_per_organization_24875798",
						),
						tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.go_beyond_the_built_in_role_set_84002d02",
						),
						tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.assign_custom_roles_to_any_user_84ab06d7",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			)}
			{onUpdateDefaultRoles && (
				<DefaultRolesSection
					organization={organization}
					availableOrgRoles={availableOrgRoles}
					canEditDefaultRoles={canEditDefaultRoles}
					defaultRolesEntitled={Boolean(defaultRolesEntitled)}
					isUpdatingDefaultRoles={Boolean(isUpdatingDefaultRoles)}
					onUpdateDefaultRoles={onUpdateDefaultRoles}
				/>
			)}
			<div>
				<SettingsHeader
					actions={
						canCreateOrgRole &&
						isCustomRolesEnabled && (
							<Button variant="outline" asChild>
								<RouterLink to="create">
									<PlusIcon />
									{tI18n(
										"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.create_custom_role_661dd96c",
									)}
								</RouterLink>
							</Button>
						)
					}
				>
					<SettingsHeaderTitle level="h2" hierarchy="secondary">
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.custom_roles_6e845384",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.create_custom_roles_to_grant_users_a_tailored_se_242ab516",
						)}
					</SettingsHeaderDescription>
				</SettingsHeader>
				<RoleTable
					roles={customRoles}
					isCustomRolesEnabled={isCustomRolesEnabled}
					canCreateOrgRole={canCreateOrgRole}
					canUpdateOrgRole={canUpdateOrgRole}
					canDeleteOrgRole={canDeleteOrgRole}
					onDeleteRole={onDeleteRole}
					aria-label={tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.custom_roles_c703c7f9",
					)}
				/>
			</div>
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle level="h2" hierarchy="secondary">
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.built_in_roles_5c7ec9a7",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.built_in_roles_have_predefined_permissions_you_c_703d4c54",
						)}
					</SettingsHeaderDescription>
				</SettingsHeader>
				<RoleTable
					roles={builtInRoles}
					isCustomRolesEnabled={isCustomRolesEnabled}
					canCreateOrgRole={canCreateOrgRole}
					canUpdateOrgRole={canUpdateOrgRole}
					canDeleteOrgRole={canDeleteOrgRole}
					onDeleteRole={onDeleteRole}
					aria-label={tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.built_in_roles_cc8484f1",
					)}
				/>
			</div>
		</div>
	);
};

interface DefaultRolesSectionProps {
	organization: Organization;
	availableOrgRoles?: AssignableRoles[];
	canEditDefaultRoles: boolean;
	defaultRolesEntitled: boolean;
	isUpdatingDefaultRoles: boolean;
	onUpdateDefaultRoles: (roles: string[]) => Promise<void>;
}

const DefaultRolesSection: FC<DefaultRolesSectionProps> = ({
	organization,
	availableOrgRoles,
	canEditDefaultRoles,
	defaultRolesEntitled,
	isUpdatingDefaultRoles,
	onUpdateDefaultRoles,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [isEditing, setIsEditing] = useState(false);

	return (
		<div>
			<SettingsHeader
				actions={
					canEditDefaultRoles && (
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsEditing(true)}
							disabled={
								isUpdatingDefaultRoles ||
								!defaultRolesEntitled ||
								!availableOrgRoles
							}
						>
							{tI18n(
								"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.edit_default_roles_6b1ab2b8",
							)}
						</Button>
					)
				}
			>
				<SettingsHeaderTitle level="h2" hierarchy="secondary">
					{tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.default_roles_28dec485",
					)}
					{!defaultRolesEntitled && <PremiumBadge />}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.roles_granted_to_every_member_of_this_organizati_6b092ace",
					)}
					{!defaultRolesEntitled &&
						tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.editing_organization_settings_requires_a_premium_c058e600",
						)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<div className="text-sm">
				{organization.default_org_member_roles.length === 0 ? (
					<span className="text-content-secondary">
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.no_default_roles_members_have_only_the_permissio_52075c35",
						)}
					</span>
				) : (
					<DefaultRolesSummary
						roleNames={organization.default_org_member_roles}
						availableRoles={availableOrgRoles}
					/>
				)}
			</div>
			<DefaultRolesDialog
				open={isEditing}
				currentRoles={organization.default_org_member_roles}
				availableRoles={availableOrgRoles}
				onCancel={() => setIsEditing(false)}
				onConfirm={async (roles) => {
					await onUpdateDefaultRoles(roles);
					setIsEditing(false);
				}}
				isUpdating={isUpdatingDefaultRoles}
			/>
		</div>
	);
};

interface DefaultRolesSummaryProps {
	roleNames: readonly string[];
	availableRoles?: AssignableRoles[];
}

const DefaultRolesSummary: FC<DefaultRolesSummaryProps> = ({
	roleNames,
	availableRoles,
}) => {
	const displayNameFor = (name: string): string => {
		const role = availableRoles?.find((r) => r.name === name);
		return role?.display_name || role?.name || name;
	};

	return (
		<ul className="list-disc pl-5 m-0 flex flex-col gap-1">
			{roleNames.map((name) => (
				<li key={name}>{displayNameFor(name)}</li>
			))}
		</ul>
	);
};

interface RoleTableBodyProps {
	roles: AssignableRoles[] | undefined;
	isCustomRolesEnabled: boolean;
	canCreateOrgRole: boolean;
	canUpdateOrgRole: boolean;
	canDeleteOrgRole: boolean;
	onDeleteRole: (role: Role) => void;
}

interface RoleTableProps extends RoleTableBodyProps {
	"aria-label": string;
}

const RoleTable: FC<RoleTableProps> = ({
	"aria-label": ariaLabel,
	...bodyProps
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Table aria-label={ariaLabel}>
			<TableHeader>
				<TableRow>
					<TableHead className="w-2/5">
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.name_dcd1d522",
						)}
					</TableHead>
					<TableHead className="w-3/5">
						{tI18n(
							"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.permissions_abccc78c",
						)}
					</TableHead>
					<TableHead className="w-auto" />
				</TableRow>
			</TableHeader>
			<TableBody>
				<RoleTableBody {...bodyProps} />
			</TableBody>
		</Table>
	);
};

const RoleTableBody: FC<RoleTableBodyProps> = ({
	roles,
	isCustomRolesEnabled,
	canCreateOrgRole,
	canUpdateOrgRole,
	canDeleteOrgRole,
	onDeleteRole,
}) => {
	const { t: tI18n } = useTranslation("administration");

	if (roles === undefined) {
		return <TableLoader />;
	}
	if (roles.length === 0) {
		return (
			<TableEmpty
				message={tI18n(
					"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.no_custom_roles_yet_7ff860eb",
				)}
				description={
					canCreateOrgRole && isCustomRolesEnabled
						? tI18n(
								"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.create_your_first_custom_role_6393c00c",
							)
						: !isCustomRolesEnabled
							? tI18n(
									"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.upgrade_to_a_premium_license_to_create_a_custom__fe46c114",
								)
							: tI18n(
									"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.you_don_t_have_permission_to_create_a_custom_rol_18978706",
								)
				}
				cta={
					canCreateOrgRole &&
					isCustomRolesEnabled && (
						<Button asChild>
							<RouterLink to="create">
								<PlusIcon />
								{tI18n(
									"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.create_custom_role_661dd96c",
								)}
							</RouterLink>
						</Button>
					)
				}
			/>
		);
	}
	return (
		<>
			{[...roles]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((role) => (
					<RoleRow
						key={role.name}
						role={role}
						canUpdateOrgRole={canUpdateOrgRole}
						canDeleteOrgRole={canDeleteOrgRole}
						onDelete={() => onDeleteRole(role)}
					/>
				))}
		</>
	);
};

interface RoleRowProps {
	role: AssignableRoles;
	canUpdateOrgRole: boolean;
	canDeleteOrgRole: boolean;
	onDelete: () => void;
}

const RoleRow: FC<RoleRowProps> = ({
	role,
	onDelete,
	canUpdateOrgRole,
	canDeleteOrgRole,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const navigate = useNavigate();

	return (
		<TableRow data-testid={`role-${role.name}`} className="h-14">
			<TableCell>{role.display_name || role.name}</TableCell>
			<TableCell>
				<PermissionPillsList permissions={role.organization_permissions} />
			</TableCell>
			<TableCell>
				{!role.built_in && (canUpdateOrgRole || canDeleteOrgRole) && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<ShadcnButton
								size="icon-lg"
								variant="subtle"
								aria-label={tI18n(
									"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.open_menu_b40b3713",
								)}
							>
								<EllipsisVerticalIcon aria-hidden="true" />
								<span className="sr-only">
									{tI18n(
										"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.open_menu_b40b3713",
									)}
								</span>
							</ShadcnButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{canUpdateOrgRole && (
								<DropdownMenuItem onClick={() => navigate(role.name)}>
									{tI18n(
										"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.edit_464c4ffd",
									)}
								</DropdownMenuItem>
							)}
							{canDeleteOrgRole && (
								<DropdownMenuItem
									className="text-content-destructive focus:text-content-destructive"
									onClick={onDelete}
								>
									{tI18n(
										"OrganizationSettingsPage.CustomRolesPage.CustomRolesPageView.delete_9ce78fe3",
									)}
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</TableCell>
		</TableRow>
	);
};

const TableLoader = () => {
	return (
		<TableLoaderSkeleton>
			<TableRowSkeleton>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
				<TableCell>
					<Skeleton variant="text" width="25%" />
				</TableCell>
			</TableRowSkeleton>
		</TableLoaderSkeleton>
	);
};
