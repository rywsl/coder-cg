import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";

interface ResetPasswordDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	user?: TypesGen.User;
	newPassword?: string;
	loading: boolean;
}

export const ResetPasswordDialog: FC<ResetPasswordDialogProps> = ({
	open,
	onClose,
	onConfirm,
	user,
	newPassword,
	loading,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const description = (
		<>
			<p>
				{tI18n("users.ResetPasswordDialog.you_will_need_to_send_68c8b947")}
				<strong>{user?.username}</strong>
				{tI18n("users.ResetPasswordDialog.the_following_password_7da338a2")}
			</p>
			<CodeExample
				secret={false}
				code={newPassword ?? ""}
				className="min-h-auto select-all w-full mt-6"
			/>
		</>
	);

	return (
		<ConfirmDialog
			type="info"
			hideCancel={false}
			open={open}
			onConfirm={onConfirm}
			onClose={onClose}
			title={tI18n("users.ResetPasswordDialog.reset_password_e0edfeb3")}
			confirmLoading={loading}
			confirmText={tI18n("users.ResetPasswordDialog.reset_password_e0edfeb3")}
			description={description}
		/>
	);
};
