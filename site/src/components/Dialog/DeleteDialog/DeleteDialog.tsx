import { type FC, type FormEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import { Spinner } from "#/components/Spinner/Spinner";

interface DeleteDialogProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	entity: string;
	name: string;
	info?: string;
	confirmLoading?: boolean;
	verb?: string;
	title?: string;
	label?: string;
	confirmText?: string;
}

export const DeleteDialog: FC<DeleteDialogProps> = ({
	isOpen,
	onCancel,
	onConfirm,
	entity,
	info,
	name,
	confirmLoading = false,
	// Optional overrides for verbiage, e.g. "unlinking" vs "deleting".
	verb,
	title,
	label,
	confirmText = "Delete",
}) => {
	const { t: tI18n } = useTranslation("components");

	const confirmId = useId();
	const errorId = `${confirmId}-error`;

	const [userConfirmationText, setUserConfirmationText] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	const deletionConfirmed = name === userConfirmationText;
	const hasError = !deletionConfirmed && userConfirmationText.length > 0;
	const displayErrorMessage = hasError && !isFocused;

	const resetConfirmation = () => {
		setUserConfirmationText("");
		setIsFocused(false);
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			resetConfirmation();
			onCancel();
		}
	};

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (deletionConfirmed && !confirmLoading) {
			onConfirm();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent variant="destructive" data-testid="dialog">
				<DialogHeader>
					<DialogTitle>
						{title ??
							tI18n("Dialog.DeleteDialog.DeleteDialog.delete_value0_50256b39", {
								value0: entity,
							})}
					</DialogTitle>
					<DialogDescription>
						{verb ??
							tI18n("Dialog.DeleteDialog.DeleteDialog.deleting_21ed2f9e")}
						{tI18n("Dialog.DeleteDialog.DeleteDialog.this_1891012c")}
						{entity}
						{tI18n("Dialog.DeleteDialog.DeleteDialog.is_irreversible_80238c6e")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					{info && (
						<Alert severity="warning" prominent>
							{info}
						</Alert>
					)}
					<p className="m-0 text-sm text-content-secondary font-medium">
						{tI18n("Dialog.DeleteDialog.DeleteDialog.type_068e513f")}
						<strong className="text-content-primary">{name}</strong>
						{tI18n(
							"Dialog.DeleteDialog.DeleteDialog.below_to_confirm_ecf5e7eb",
						)}
					</p>
				</div>

				<form className="flex flex-col gap-6" onSubmit={onSubmit}>
					<div className="flex flex-col gap-2">
						<Label htmlFor={confirmId}>
							{label ??
								tI18n(
									"Dialog.DeleteDialog.DeleteDialog.name_of_the_value0_to_delete_4817e976",
									{
										value0: entity,
									},
								)}
						</Label>
						<Input
							id={confirmId}
							name="confirmation"
							autoComplete="off"
							autoFocus
							placeholder={name}
							value={userConfirmationText}
							onChange={(event) => setUserConfirmationText(event.target.value)}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							aria-invalid={displayErrorMessage}
							aria-describedby={displayErrorMessage ? errorId : undefined}
							data-testid="delete-dialog-name-confirmation"
						/>
						{displayErrorMessage && (
							<span id={errorId} className="text-xs text-content-destructive">
								{userConfirmationText}
								{tI18n(
									"Dialog.DeleteDialog.DeleteDialog.does_not_match_the_name_of_this_8beeeeee",
								)}
								{entity}
							</span>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={confirmLoading}
							onClick={() => handleOpenChange(false)}
						>
							{tI18n("Dialog.DeleteDialog.DeleteDialog.cancel_19766ed6")}
						</Button>
						<Button
							type="submit"
							variant="destructive"
							disabled={!deletionConfirmed || confirmLoading}
							data-testid="confirm-button"
						>
							<Spinner loading={confirmLoading} />
							{confirmText}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
