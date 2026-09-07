import { TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import type { ModelFormValues } from "#/pages/AgentsPage/components/ChatModelAdminPanel/modelConfigFormLogic";

export const ModelFormDialogs: FC<{
	editingModel?: TypesGen.ChatModel;
	onDeleteModel?: (modelId: string) => Promise<void>;
	isDeleting: boolean;
	confirmingDelete: boolean;
	setConfirmingDelete: (open: boolean) => void;
	resetForm: (values: ModelFormValues) => void;
	formValues: ModelFormValues;
	unsavedChanges: {
		isOpen: boolean;
		onCancel: () => void;
		onConfirm: () => void;
	};
	confirmingReplaceDefault: boolean;
	setConfirmingReplaceDefault: (open: boolean) => void;
	currentDefaultModel?: TypesGen.ChatModel;
	onConfirmReplaceDefault: () => void;
}> = ({
	editingModel,
	onDeleteModel,
	isDeleting,
	confirmingDelete,
	setConfirmingDelete,
	resetForm,
	formValues,
	unsavedChanges,
	confirmingReplaceDefault,
	setConfirmingReplaceDefault,
	currentDefaultModel,
	onConfirmReplaceDefault,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			{editingModel && onDeleteModel && (
				<ConfirmDialog
					type="delete"
					title={tI18n(
						"AISettingsPage.ModelsPage.components.ModelFormDialogs.delete_model_b7828ba0",
					)}
					confirmText={tI18n(
						"AISettingsPage.ModelsPage.components.ModelFormDialogs.delete_model_b7828ba0",
					)}
					description={tI18n(
						"AISettingsPage.ModelsPage.components.ModelFormDialogs.are_you_sure_you_want_to_delete_this_model_this__60ab67cb",
					)}
					confirmLoading={isDeleting}
					open={confirmingDelete}
					onClose={() => setConfirmingDelete(false)}
					onConfirm={() => {
						resetForm(formValues);
						void onDeleteModel(editingModel.id);
					}}
				/>
			)}
			<Dialog
				open={unsavedChanges.isOpen}
				onOpenChange={(open) => !open && unsavedChanges.onCancel()}
			>
				<DialogContent className="border-border-warning">
					<DialogHeader>
						<DialogTitle>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormDialogs.unsaved_changes_a710c2b9",
							)}
						</DialogTitle>
						<DialogDescription className="flex items-start gap-3">
							<TriangleAlertIcon className="size-icon-sm mt-1 shrink-0 text-content-primary" />
							<span>
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormDialogs.your_updates_haven_t_been_saved_leave_anyway_0230d6de",
								)}
							</span>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={unsavedChanges.onCancel}
						>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormDialogs.cancel_19766ed6",
							)}
						</Button>
						<Button type="button" onClick={unsavedChanges.onConfirm}>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormDialogs.confirm_eebdd24a",
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={confirmingReplaceDefault}
				onOpenChange={(open) => !open && setConfirmingReplaceDefault(false)}
			>
				<DialogContent className="border-border-warning">
					<DialogHeader>
						<DialogTitle>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormDialogs.replace_default_model_259a3b74",
							)}
						</DialogTitle>
						<DialogDescription className="flex items-center gap-2">
							<TriangleAlertIcon className="size-icon-sm shrink-0 text-content-primary" />
							<span>
								<strong className="text-content-primary">
									{currentDefaultModel?.display_name ||
										currentDefaultModel?.model}
								</strong>{" "}
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormDialogs.is_currently_the_default_replace_it_4f6d113d",
								)}
							</span>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={() => setConfirmingReplaceDefault(false)}
						>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormDialogs.cancel_19766ed6",
							)}
						</Button>
						<Button type="button" onClick={onConfirmReplaceDefault}>
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormDialogs.confirm_eebdd24a",
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
