import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import {
	mcpServerConfigACL,
	updateMCPServerConfigACL,
} from "#/api/queries/chats";
import type * as TypesGen from "#/api/typesGenerated";
import { getGroupSubtitle, isGroup } from "#/modules/groups";
import {
	ResourceSharingDialog,
	type SharingDialogData,
	type SharingPrincipal,
	type SharingPrincipalSelection,
} from "../../components/ResourceSharingDialog";
import {
	MCPServerPrincipalAutocomplete,
	type MCPServerPrincipalAutocompleteValue,
} from "./MCPServerPrincipalAutocomplete";

type MCPServerSharingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	serverId: string;
	serverName: string;
};

type MCPServerPrincipal = Exclude<MCPServerPrincipalAutocompleteValue, null>;

const groupPrincipal = (group: TypesGen.Group): SharingPrincipal => ({
	id: group.id,
	name: group.display_name || group.name,
	subtitle: getGroupSubtitle(group),
	avatarUrl: group.avatar_url,
});

const userPrincipal = (user: TypesGen.MinimalUser): SharingPrincipal => ({
	id: user.id,
	name: user.username,
	subtitle: user.name || "User",
	avatarUrl: user.avatar_url,
});

const sharingDialogData = (
	acl: TypesGen.MCPServerConfigACL,
): SharingDialogData<TypesGen.MCPServerConfigRole> => ({
	acl: {
		user_roles: Object.fromEntries(
			acl.users.map((user) => [user.id, user.role]),
		),
		group_roles: Object.fromEntries(
			acl.groups.map((group) => [group.id, group.role]),
		),
	},
	principals: {
		users: Object.fromEntries(
			acl.users.map((user) => [user.id, userPrincipal(user)]),
		),
		groups: Object.fromEntries(
			acl.groups.map((group) => [group.id, groupPrincipal(group)]),
		),
	},
});

const selectedPrincipal = (
	option: MCPServerPrincipal,
): SharingPrincipalSelection =>
	isGroup(option)
		? { kind: "group", principal: groupPrincipal(option) }
		: { kind: "user", principal: userPrincipal(option) };

type OpenMCPServerSharingDialogProps = Omit<
	MCPServerSharingDialogProps,
	"open"
>;

const OpenMCPServerSharingDialog: FC<OpenMCPServerSharingDialogProps> = ({
	onOpenChange,
	organizationId,
	serverId,
	serverName,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const queryClient = useQueryClient();
	const aclOptions = mcpServerConfigACL(organizationId, serverId);
	const aclQuery = useQuery({ ...aclOptions, refetchOnMount: "always" });
	const updateMutation = useMutation(updateMCPServerConfigACL(queryClient));
	const data = aclQuery.data ? sharingDialogData(aclQuery.data) : undefined;

	const close = () => {
		onOpenChange(false);
		queryClient.removeQueries({ queryKey: aclOptions.queryKey, exact: true });
	};

	return (
		<ResourceSharingDialog
			title={tI18n(
				"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.server_permissions_d2673811",
			)}
			description={
				<>
					{tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.manage_which_organization_members_and_groups_can_f823c9bd",
					)}
					{serverName}.
				</>
			}
			loadingLabel={tI18n(
				"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.loading_server_permissions_7d424583",
			)}
			emptyTitle={tI18n(
				"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.no_members_or_groups_have_permission_yet_d375694d",
			)}
			tableLabel={tI18n(
				"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.server_permissions_for_members_and_groups_1ad60e30",
			)}
			roleLabel={tI18n(
				"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.read_9b9a8d05",
			)}
			confirmText={tI18n(
				"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.save_permissions_1eab372a",
			)}
			data={data}
			loadError={data ? null : aclQuery.error}
			refetchError={data ? aclQuery.error : null}
			saveError={updateMutation.error}
			isSaving={updateMutation.isPending}
			readRole="read"
			deletedRole=""
			renderAutocomplete={({ value, onChange, excludedPrincipalIds }) => (
				<MCPServerPrincipalAutocomplete
					organizationId={organizationId}
					value={value}
					onChange={onChange}
					serverId={serverId}
					excludedPrincipalIds={excludedPrincipalIds}
					className="w-full"
				/>
			)}
			getPrincipal={selectedPrincipal}
			onClose={close}
			onSave={(req) =>
				updateMutation.mutate(
					{ organization: organizationId, id: serverId, req },
					{
						onSuccess: () => {
							toast.success(
								tI18n(
									"AISettingsPage.MCPServersPage.components.MCPServerSharingDialog.permissions_for_value0_updated_8c0e630e",
									{
										value0: serverName,
									},
								),
							);
							close();
						},
					},
				)
			}
		/>
	);
};

export const MCPServerSharingDialog: FC<MCPServerSharingDialogProps> = (
	props,
) => (props.open ? <OpenMCPServerSharingDialog {...props} /> : null);
