import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorMessage } from "#/api/errors";

export const useDeletionDialogState = (
	templateId: string,
	onDelete: () => void,
	templateName?: string,
) => {
	const { t: tI18n } = useTranslation("templates");

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const deleteMutation = useMutation({
		mutationFn: () => API.deleteTemplate(templateId),
	});

	const openDeleteConfirmation = () => {
		setIsDeleteDialogOpen(true);
	};

	const cancelDeleteConfirmation = () => {
		setIsDeleteDialogOpen(false);
	};

	const confirmDelete = () => {
		const label = templateName ? ` "${templateName}"` : "";
		const mutation = deleteMutation.mutateAsync();
		toast.promise(mutation, {
			loading: tI18n(
				"TemplatePage.useDeletionDialogState.deleting_template_value0_b2252c56",
				{
					value0: label,
				},
			),
			success: tI18n(
				"TemplatePage.useDeletionDialogState.template_value0_deleted_successfully_1ffb0a52",
				{
					value0: label,
				},
			),
			error: (error) =>
				getErrorMessage(
					error,
					tI18n(
						"TemplatePage.useDeletionDialogState.failed_to_delete_template_value0_afd6d675",
						{
							value0: label,
						},
					),
				),
		});
		mutation.then(() => onDelete());
	};

	return {
		isDeleteDialogOpen,
		openDeleteConfirmation,
		cancelDeleteConfirmation,
		confirmDelete,
	};
};
