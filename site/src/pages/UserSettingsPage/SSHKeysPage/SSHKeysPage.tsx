import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { regenerateUserSSHKey, userSSHKey } from "#/api/queries/sshKeys";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	SettingsHeader,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { SSHKeysPageView } from "./SSHKeysPageView";

const SSHKeysPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const [isConfirmingRegeneration, setIsConfirmingRegeneration] =
		useState(false);

	const userSSHKeyQuery = useQuery(userSSHKey("me"));
	const queryClient = useQueryClient();
	const regenerateSSHKeyMutation = useMutation(
		regenerateUserSSHKey("me", queryClient),
	);

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n("UserSettingsPage.SSHKeysPage.SSHKeysPage.ssh_keys_f9a7470a")}
				</SettingsHeaderTitle>
			</SettingsHeader>
			<SSHKeysPageView
				isLoading={userSSHKeyQuery.isLoading}
				getSSHKeyError={userSSHKeyQuery.error}
				sshKey={userSSHKeyQuery.data}
				onRegenerateClick={() => setIsConfirmingRegeneration(true)}
			/>
			<ConfirmDialog
				type="delete"
				hideCancel={false}
				open={isConfirmingRegeneration}
				confirmLoading={regenerateSSHKeyMutation.isPending}
				title={tI18n(
					"UserSettingsPage.SSHKeysPage.SSHKeysPage.regenerate_ssh_key_0a4bb7a8",
				)}
				description={tI18n(
					"UserSettingsPage.SSHKeysPage.SSHKeysPage.you_will_need_to_replace_the_public_ssh_key_on_s_2d0f1412",
				)}
				confirmText={tI18n(
					"UserSettingsPage.SSHKeysPage.SSHKeysPage.confirm_eebdd24a",
				)}
				onClose={() => setIsConfirmingRegeneration(false)}
				onConfirm={async () => {
					try {
						await regenerateSSHKeyMutation.mutateAsync();
						toast.success(
							tI18n(
								"UserSettingsPage.SSHKeysPage.SSHKeysPage.ssh_key_regenerated_successfully_1cf1a3cc",
							),
						);
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"UserSettingsPage.SSHKeysPage.SSHKeysPage.failed_to_regenerate_ssh_key_fde6f92d",
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
					} finally {
						setIsConfirmingRegeneration(false);
					}
				}}
			/>
		</>
	);
};

export default SSHKeysPage;
