import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	setGroupRole,
	setUserRole,
	templateACL,
} from "#/api/queries/templates";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import { useTemplateSettings } from "../TemplateSettingsLayout";
import { TemplatePermissionsPageView } from "./TemplatePermissionsPageView";

const TemplatePermissionsPage: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	const { permissions: authPermissions } = useAuthenticated();
	const { template, permissions } = useTemplateSettings();
	const { template_rbac: isTemplateRBACEnabled } = useFeatureVisibility();
	const templateACLQuery = useQuery(templateACL(template.id));
	const queryClient = useQueryClient();

	const addUserMutation = useMutation(setUserRole(queryClient));
	const updateUserMutation = useMutation(setUserRole(queryClient));
	const removeUserMutation = useMutation(setUserRole(queryClient));

	const addGroupMutation = useMutation(setGroupRole(queryClient));
	const updateGroupMutation = useMutation(setGroupRole(queryClient));
	const removeGroupMutation = useMutation(setGroupRole(queryClient));

	return (
		<>
			<title>
				{pageTitle(
					template.name,
					tI18n(
						"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.permissions_abccc78c",
					),
				)}
			</title>
			<div className="flex flex-col gap-12">
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.permissions_abccc78c",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.manage_which_members_and_groups_can_use_this_tem_3ba9a607",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/templates/template-permissions")}
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				{!isTemplateRBACEnabled ? (
					<PremiumPaywall
						source="template_permissions"
						message={tI18n(
							"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.template_permissions_c09a9049",
						)}
						description={tI18n(
							"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.restrict_template_access_by_user_or_group_915c58fd",
						)}
						features={[
							tI18n(
								"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.choose_use_or_admin_level_access_76e80c68",
							),
							tI18n(
								"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.prevent_unauthorized_template_use_a1d6c048",
							),
							tI18n(
								"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.let_teams_self_serve_templates_without_admin_bot_ad94d1ee",
							),
						]}
						canViewPremium={authPermissions.viewAllLicenses}
					/>
				) : (
					<TemplatePermissionsPageView
						templateID={template.id}
						templateACL={templateACLQuery.data}
						canUpdatePermissions={Boolean(permissions?.canUpdateTemplate)}
						onAddUser={async (user, role, reset) => {
							await addUserMutation.mutateAsync({
								templateId: template.id,
								userId: user.id,
								role,
							});
							reset();
						}}
						isAddingUser={addUserMutation.isPending}
						onUpdateUser={async (user, role) => {
							await updateUserMutation.mutateAsync(
								{
									templateId: template.id,
									userId: user.id,
									role,
								},
								{
									onSuccess: () => {
										toast.success(
											tI18n(
												"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.role_for_value0_updated_to_value1_successfully_6c424737",
												{
													value0: user.username,
													value1: role,
												},
											),
										);
									},
									onError: (error) => {
										toast.error(
											getErrorMessage(
												error,
												tI18n(
													"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.failed_to_update_role_for_value0_93a20247",
													{
														value0: user.username,
													},
												),
											),
											{
												description: getErrorDetail(error),
											},
										);
									},
								},
							);
						}}
						updatingUserId={
							updateUserMutation.isPending
								? updateUserMutation.variables?.userId
								: undefined
						}
						onRemoveUser={async (user) => {
							await removeUserMutation.mutateAsync(
								{
									templateId: template.id,
									userId: user.id,
									role: "",
								},
								{
									onSuccess: () => {
										toast.success(
											tI18n(
												"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.user_value0_removed_successfully_eae0bc24",
												{
													value0: user.username,
												},
											),
										);
									},
									onError: (error) => {
										toast.error(
											getErrorMessage(
												error,
												tI18n(
													"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.failed_to_remove_user_value0_51b0d1c5",
													{
														value0: user.username,
													},
												),
											),
											{
												description: getErrorDetail(error),
											},
										);
									},
								},
							);
						}}
						onAddGroup={async (group, role, reset) => {
							await addGroupMutation.mutateAsync({
								templateId: template.id,
								groupId: group.id,
								role,
							});
							reset();
						}}
						isAddingGroup={addGroupMutation.isPending}
						onUpdateGroup={async (group, role) => {
							await updateGroupMutation.mutateAsync(
								{
									templateId: template.id,
									groupId: group.id,
									role,
								},
								{
									onSuccess: () => {
										toast.success(
											tI18n(
												"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.role_for_value0_updated_to_value1_successfully_6c424737",
												{
													value0: group.display_name || group.name,
													value1: role,
												},
											),
										);
									},
									onError: (error) => {
										toast.error(
											getErrorMessage(
												error,
												tI18n(
													"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.failed_to_update_role_for_value0_93a20247",
													{
														value0: group.display_name || group.name,
													},
												),
											),
											{
												description: getErrorDetail(error),
											},
										);
									},
								},
							);
						}}
						updatingGroupId={
							updateGroupMutation.isPending
								? updateGroupMutation.variables?.groupId
								: undefined
						}
						onRemoveGroup={async (group) => {
							await removeGroupMutation.mutateAsync(
								{
									groupId: group.id,
									templateId: template.id,
									role: "",
								},
								{
									onSuccess: () => {
										toast.success(
											tI18n(
												"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.group_value0_removed_successfully_2b8bc601",
												{
													value0: group.display_name || group.name,
												},
											),
										);
									},
									onError: (error) => {
										toast.error(
											getErrorMessage(
												error,
												tI18n(
													"TemplateSettingsPage.TemplatePermissionsPage.TemplatePermissionsPage.failed_to_remove_group_value0_94317567",
													{
														value0: group.display_name || group.name,
													},
												),
											),
											{
												description: getErrorDetail(error),
											},
										);
									},
								},
							);
						}}
					/>
				)}
			</div>
		</>
	);
};

export default TemplatePermissionsPage;
