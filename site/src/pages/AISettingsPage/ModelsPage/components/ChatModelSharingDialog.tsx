import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { chatModelACL, updateChatModelACL } from "#/api/queries/chats";
import type * as TypesGen from "#/api/typesGenerated";
import { getGroupSubtitle, isGroup } from "#/modules/groups";
import {
	ResourceSharingDialog,
	type SharingDialogData,
	type SharingPrincipal,
	type SharingPrincipalSelection,
} from "../../components/ResourceSharingDialog";
import {
	ChatModelPrincipalAutocomplete,
	type ChatModelPrincipalAutocompleteValue,
} from "./ChatModelPrincipalAutocomplete";

type ChatModelSharingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	modelId: string;
	modelName: string;
};

type ChatModelPrincipal = Exclude<ChatModelPrincipalAutocompleteValue, null>;

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
	acl: TypesGen.ChatModelACL,
): SharingDialogData<TypesGen.ChatRole> => ({
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
	option: ChatModelPrincipal,
): SharingPrincipalSelection =>
	isGroup(option)
		? { kind: "group", principal: groupPrincipal(option) }
		: { kind: "user", principal: userPrincipal(option) };

type OpenChatModelSharingDialogProps = Omit<
	ChatModelSharingDialogProps,
	"open"
>;

const OpenChatModelSharingDialog: FC<OpenChatModelSharingDialogProps> = ({
	onOpenChange,
	organizationId,
	modelId,
	modelName,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const queryClient = useQueryClient();
	const aclOptions = chatModelACL(organizationId, modelId);
	const aclQuery = useQuery({ ...aclOptions, refetchOnMount: "always" });
	const updateMutation = useMutation(updateChatModelACL(queryClient));
	const data = aclQuery.data ? sharingDialogData(aclQuery.data) : undefined;

	const close = () => {
		onOpenChange(false);
		queryClient.removeQueries({ queryKey: aclOptions.queryKey, exact: true });
	};

	return (
		<ResourceSharingDialog
			title={tI18n(
				"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.model_permissions_6cccd76d",
			)}
			description={
				<>
					{tI18n(
						"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.manage_which_organization_members_and_groups_can_f823c9bd",
					)}
					{modelName}.
				</>
			}
			loadingLabel={tI18n(
				"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.loading_model_permissions_eda9cd1c",
			)}
			emptyTitle={tI18n(
				"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.no_members_or_groups_have_permission_yet_d375694d",
			)}
			tableLabel={tI18n(
				"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.model_permissions_for_members_and_groups_ca605375",
			)}
			roleLabel={tI18n(
				"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.use_c36d819e",
			)}
			confirmText={tI18n(
				"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.save_permissions_1eab372a",
			)}
			data={data}
			loadError={data ? null : aclQuery.error}
			refetchError={data ? aclQuery.error : null}
			saveError={updateMutation.error}
			isSaving={updateMutation.isPending}
			readRole="read"
			deletedRole=""
			renderAutocomplete={({ value, onChange, excludedPrincipalIds }) => (
				<ChatModelPrincipalAutocomplete
					organizationId={organizationId}
					value={value}
					onChange={onChange}
					modelId={modelId}
					excludedPrincipalIds={excludedPrincipalIds}
					className="w-full"
				/>
			)}
			getPrincipal={selectedPrincipal}
			onClose={close}
			onSave={(req) =>
				updateMutation.mutate(
					{ organizationId, modelId, req },
					{
						onSuccess: () => {
							toast.success(
								tI18n(
									"AISettingsPage.ModelsPage.components.ChatModelSharingDialog.permissions_for_value0_updated_8c0e630e",
									{
										value0: modelName,
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

export const ChatModelSharingDialog: FC<ChatModelSharingDialogProps> = (
	props,
) => (props.open ? <OpenChatModelSharingDialog {...props} /> : null);
