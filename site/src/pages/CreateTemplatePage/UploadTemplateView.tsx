import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { uploadFile } from "#/api/queries/files";
import {
	JobError,
	templateVersionLogs,
	templateVersionVariables,
} from "#/api/queries/templates";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { CreateTemplateForm } from "./CreateTemplateForm";
import type { CreateTemplatePageViewProps } from "./types";
import { firstVersionFromFile, getFormPermissions, newTemplate } from "./utils";

export const UploadTemplateView: FC<CreateTemplatePageViewProps> = ({
	onCreateTemplate,
	onOpenBuildLogsDrawer,
	variablesSectionRef,
	isCreating,
	error,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const navigate = useNavigate();
	const { entitlements, showOrganizations } = useDashboard();
	const formPermissions = getFormPermissions(entitlements);

	const uploadFileMutation = useMutation(uploadFile());
	const uploadedFile = uploadFileMutation.data;

	const isJobError = error instanceof JobError;
	const templateVersionLogsQuery = useQuery({
		...templateVersionLogs(isJobError ? error.version.id : ""),
		enabled: isJobError,
	});

	const missedVariables = useQuery({
		...templateVersionVariables(isJobError ? error.version.id : ""),
		enabled:
			isJobError && error.job.error_code === "REQUIRED_TEMPLATE_VARIABLES",
	});

	return (
		<CreateTemplateForm
			{...formPermissions}
			onOpenBuildLogsDrawer={onOpenBuildLogsDrawer}
			variablesSectionRef={variablesSectionRef}
			variables={missedVariables.data}
			error={error}
			isSubmitting={isCreating}
			onCancel={() => navigate(-1)}
			jobError={isJobError ? error.job.error : undefined}
			logs={templateVersionLogsQuery.data}
			upload={{
				onUpload: async (file: File) => {
					try {
						await uploadFileMutation.mutateAsync(file);
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"CreateTemplatePage.UploadTemplateView.failed_to_upload_file_c6ec4a0f",
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
						uploadFileMutation.reset();
					}
				},
				isUploading: uploadFileMutation.isPending,
				onRemove: uploadFileMutation.reset,
				file: uploadFileMutation.variables,
			}}
			showOrganizationPicker={showOrganizations}
			onSubmit={async (formData) => {
				await onCreateTemplate({
					organization: formData.organization,
					version: firstVersionFromFile(
						uploadedFile!.hash,
						formData.user_variable_values,
						formData.provisioner_type,
						formData.tags,
					),
					template: newTemplate(formData),
				});
			}}
		/>
	);
};
