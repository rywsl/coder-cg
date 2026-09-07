import type { SlimRole } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

export type ScopedSlimRole = SlimRole & {
	global?: boolean;
};

export const roleDescriptions: Record<string, string> = {
	owner: i18n.t(
		"components:roles.index.owner_can_manage_all_resources_including_users_g_8a93d4a4",
	),
	"user-admin": i18n.t(
		"components:roles.index.user_admin_can_manage_all_users_and_groups_fc983e6e",
	),
	"template-admin": i18n.t(
		"components:roles.index.template_admin_can_manage_all_templates_and_work_aff81d64",
	),
	auditor: i18n.t(
		"components:roles.index.auditor_can_access_the_audit_logs_7eeb4663",
	),
	"organization-admin": i18n.t(
		"components:roles.index.organization_admin_can_manage_all_resources_with_356c5361",
	),
	"organization-user-admin": i18n.t(
		"components:roles.index.organization_user_admin_can_manage_members_and_g_f19a35c2",
	),
	"organization-template-admin": i18n.t(
		"components:roles.index.organization_template_admin_can_manage_templates_f40e390d",
	),
	"organization-auditor": i18n.t(
		"components:roles.index.organization_auditor_can_access_audit_logs_for_t_915c6dd7",
	),
	"organization-workspace-creation-ban": i18n.t(
		"components:roles.index.prevents_this_user_from_creating_new_workspaces__fffbc52a",
	),
	member: i18n.t(
		"components:roles.index.everybody_is_a_member_this_is_a_shared_and_defau_6ec0044c",
	),
};

export const memberRole: ScopedSlimRole = {
	name: "member",
	display_name: "Member",
} as const;

export function getRoleNames(roles: readonly SlimRole[]): string[] {
	return roles.map((role) => role.name);
}

export function combineGlobalAndOrgRoles(
	globalRoles: readonly SlimRole[],
	orgRoles: readonly SlimRole[],
): ScopedSlimRole[] {
	return [
		...globalRoles.map((it) => ({ ...it, global: true })),
		...orgRoles.map((it) => ({ ...it, global: false })),
	];
}

const roleNamesByAccessLevel: readonly string[] = [
	"owner",
	"organization-admin",
	"user-admin",
	"organization-user-admin",
	"template-admin",
	"organization-template-admin",
	"auditor",
	"organization-auditor",
	"member",
	"organization-member",
];

export function sortRoles<Role extends SlimRole>(
	roles: readonly Role[],
): readonly Role[] {
	if (roles.length < 2) {
		return roles;
	}

	return [...roles].sort((a, b) => {
		const aAccessLevel = roleNamesByAccessLevel.indexOf(a.name);
		const bAccessLevel = roleNamesByAccessLevel.indexOf(b.name);

		// a is not in the access level list, but b is, so b should come first
		if (aAccessLevel === -1 && bAccessLevel !== -1) {
			return 1;
		}
		// b is not in the access level list, but a is, so a should come first
		if (bAccessLevel === -1 && aAccessLevel !== -1) {
			return -1;
		}
		// Neither is in the access level list, so sort them alphabetically
		if (aAccessLevel === -1 && bAccessLevel === -1) {
			return a.name.localeCompare(b.name);
		}
		// Both are in the access level list, so sort them by access level
		return aAccessLevel - bAccessLevel;
	});
}
