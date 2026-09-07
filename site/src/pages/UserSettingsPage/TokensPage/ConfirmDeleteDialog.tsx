import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import type { APIKeyWithOwner } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { useDeleteToken } from "./hooks";

interface ConfirmDeleteDialogProps {
	queryKey: (string | boolean)[];
	token: APIKeyWithOwner | undefined;
	setToken: (arg: APIKeyWithOwner | undefined) => void;
}

export const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
	queryKey,
	token,
	setToken,
}) => {
	const { t: tI18n } = useTranslation("users");

	const tokenName = token?.token_name;

	const { mutate: deleteToken, isPending: isDeleting } =
		useDeleteToken(queryKey);

	const onDeleteSuccess = () => {
		toast.success(
			tI18n(
				"UserSettingsPage.TokensPage.ConfirmDeleteDialog.token_has_been_deleted_e6472c26",
			),
		);
		setToken(undefined);
	};

	const onDeleteError = (error: Error) => {
		const message = getErrorMessage(
			error,
			tI18n(
				"UserSettingsPage.TokensPage.ConfirmDeleteDialog.failed_to_delete_token_51ff93e8",
			),
		);
		toast.error(message, {
			description: getErrorDetail(error),
		});
		setToken(undefined);
	};

	return (
		<ConfirmDialog
			type="delete"
			title={tI18n(
				"UserSettingsPage.TokensPage.ConfirmDeleteDialog.delete_token_31e2b49c",
			)}
			description={
				<>
					{tI18n(
						"UserSettingsPage.TokensPage.ConfirmDeleteDialog.are_you_sure_you_want_to_permanently_delete_toke_506fb2a1",
					)}{" "}
					<strong>{tokenName}</strong>?
				</>
			}
			open={Boolean(token) || isDeleting}
			confirmLoading={isDeleting}
			onConfirm={() => {
				if (!token) {
					return;
				}
				deleteToken(token.id, {
					onError: onDeleteError,
					onSuccess: onDeleteSuccess,
				});
			}}
			onClose={() => {
				setToken(undefined);
			}}
		/>
	);
};
