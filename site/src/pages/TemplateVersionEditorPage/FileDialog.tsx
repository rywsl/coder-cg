import { type ChangeEvent, type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { FormField } from "#/components/FormField/FormField";
import { type FileTree, isFolder, validatePath } from "#/utils/filetree";

interface CreateFileDialogProps {
	onClose: () => void;
	checkExists: (path: string) => boolean;
	onConfirm: (path: string) => void;
	open: boolean;
	fileTree: FileTree;
}

export const CreateFileDialog: FC<CreateFileDialogProps> = ({
	checkExists,
	onClose,
	onConfirm,
	open,
	fileTree,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const [pathValue, setPathValue] = useState("");
	const [error, setError] = useState<string>();
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setPathValue(event.target.value);
	};
	const handleConfirm = () => {
		if (pathValue === "") {
			setError("You must enter a path!");
			return;
		}
		if (checkExists(pathValue)) {
			setError("File already exists");
			return;
		}

		const pathError = validatePath(pathValue, fileTree);
		if (pathError) {
			setError(pathError);
			return;
		}
		onConfirm(pathValue);
		setError(undefined);
		setPathValue("");
	};

	return (
		<ConfirmDialog
			open={open}
			onClose={() => {
				onClose();
				setError(undefined);
				setPathValue("");
			}}
			onConfirm={handleConfirm}
			hideCancel={false}
			type="success"
			cancelText={tI18n("TemplateVersionEditorPage.FileDialog.cancel_19766ed6")}
			confirmText={tI18n(
				"TemplateVersionEditorPage.FileDialog.create_4759498a",
			)}
			title={tI18n("TemplateVersionEditorPage.FileDialog.create_file_f1eb5a82")}
			description={
				<div className="flex flex-col gap-8">
					<p>
						{tI18n(
							"TemplateVersionEditorPage.FileDialog.specify_the_path_to_a_file_to_be_created_this_pa_7153a0f0",
						)}
					</p>
					<FormField
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								handleConfirm();
							}
						}}
						field={{
							name: "file-path",
							id: "file-path",
							value: pathValue,
							onChange: handleChange,
							onBlur: () => {},
							error: Boolean(error),
							helperText: error,
						}}
						label={tI18n(
							"TemplateVersionEditorPage.FileDialog.file_path_a1039763",
						)}
						autoComplete="off"
						placeholder={tI18n(
							"TemplateVersionEditorPage.FileDialog.example_tf_aa0ead28",
						)}
					/>
				</div>
			}
		/>
	);
};

interface DeleteFileDialogProps {
	onClose: () => void;
	onConfirm: () => void;
	open: boolean;
	filename: string;
}

export const DeleteFileDialog: FC<DeleteFileDialogProps> = ({
	onClose,
	onConfirm,
	open,
	filename,
}) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<ConfirmDialog
			type="delete"
			onClose={onClose}
			open={open}
			onConfirm={onConfirm}
			title={tI18n("TemplateVersionEditorPage.FileDialog.delete_file_e1e5fe20")}
			description={
				<>
					{tI18n(
						"TemplateVersionEditorPage.FileDialog.are_you_sure_you_want_to_delete_c23295ab",
					)}
					<strong>{filename}</strong>
					{tI18n(
						"TemplateVersionEditorPage.FileDialog.it_will_be_deleted_permanently_9ede105c",
					)}
				</>
			}
		/>
	);
};

interface RenameFileDialogProps {
	onClose: () => void;
	onConfirm: (filename: string) => void;
	checkExists: (path: string) => boolean;
	open: boolean;
	filename: string;
	fileTree: FileTree;
}

export const RenameFileDialog: FC<RenameFileDialogProps> = ({
	checkExists,
	onClose,
	onConfirm,
	open,
	filename,
	fileTree,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const [pathValue, setPathValue] = useState(filename);
	const [error, setError] = useState<string>();
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setPathValue(event.target.value);
	};
	const handleConfirm = () => {
		if (pathValue === "") {
			setError("You must enter a path!");
			return;
		}
		if (checkExists(pathValue)) {
			setError("File already exists");
			return;
		}

		//Check if a folder is renamed to a file
		const [_, extension] = pathValue.split(".");
		if (isFolder(filename, fileTree) && extension) {
			setError(`A folder can't be renamed to a file.`);
			return;
		}
		const pathError = validatePath(pathValue, fileTree);
		if (pathError) {
			setError(pathError);
			return;
		}
		onConfirm(pathValue);
		setError(undefined);
		setPathValue("");
	};

	return (
		<ConfirmDialog
			open={open}
			onClose={() => {
				onClose();
				setError(undefined);
				setPathValue("");
			}}
			onConfirm={handleConfirm}
			hideCancel={false}
			type="success"
			cancelText={tI18n("TemplateVersionEditorPage.FileDialog.cancel_19766ed6")}
			confirmText={tI18n(
				"TemplateVersionEditorPage.FileDialog.rename_3064d79a",
			)}
			title={tI18n("TemplateVersionEditorPage.FileDialog.rename_file_e464ea1f")}
			description={
				<div className="flex flex-col gap-4">
					<p>
						{tI18n("TemplateVersionEditorPage.FileDialog.rename_32a50be4")}
						<strong>{filename}</strong>
						{tI18n(
							"TemplateVersionEditorPage.FileDialog.to_something_else_this_path_can_contain_slashes__1ad84b40",
						)}
					</p>
					<FormField
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								handleConfirm();
							}
						}}
						field={{
							name: "file-path",
							id: "file-path",
							value: pathValue,
							onChange: handleChange,
							onBlur: () => {},
							error: Boolean(error),
							helperText: error,
						}}
						label={tI18n(
							"TemplateVersionEditorPage.FileDialog.file_path_a1039763",
						)}
						autoComplete="off"
						placeholder={filename}
					/>
				</div>
			}
		/>
	);
};
