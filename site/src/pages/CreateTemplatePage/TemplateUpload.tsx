import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { FileUpload } from "#/components/FileUpload/FileUpload";
import { Link } from "#/components/Link/Link";

export interface TemplateUploadProps {
	isUploading: boolean;
	onUpload: (file: File) => void;
	onRemove: () => void;
	file?: File;
}

export const TemplateUpload: FC<TemplateUploadProps> = ({
	isUploading,
	onUpload,
	onRemove,
	file,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const description = (
		<>
			{tI18n(
				"CreateTemplatePage.TemplateUpload.the_template_has_to_be_a_tar_or_zip_file_you_can_b24b8c8e",
			)}{" "}
			<Link
				// Prevent trigger the upload
				onClick={(e) => {
					e.stopPropagation();
				}}
				asChild
				showExternalIcon={false}
				className="p-0"
			>
				<RouterLink to="/starter-templates">
					{tI18n(
						"CreateTemplatePage.TemplateUpload.starter_templates_4eb0be2c",
					)}
				</RouterLink>
			</Link>{" "}
			{tI18n(
				"CreateTemplatePage.TemplateUpload.to_get_started_with_coder_395731b5",
			)}
		</>
	);

	return (
		<FileUpload
			isUploading={isUploading}
			onUpload={onUpload}
			onRemove={onRemove}
			file={file}
			removeLabel={tI18n(
				"CreateTemplatePage.TemplateUpload.remove_file_fffa2e32",
			)}
			title={tI18n(
				"CreateTemplatePage.TemplateUpload.upload_template_48297e89",
			)}
			description={description}
			extensions={["tar", "zip"]}
		/>
	);
};
