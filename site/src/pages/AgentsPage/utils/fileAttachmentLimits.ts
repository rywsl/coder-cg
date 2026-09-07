import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { MaxChatFileSizeBytes } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

export const formatAgentAttachmentTooLargeError = (fileSize: number): string =>
	i18n.t(
		"agents:AgentsPage.utils.fileAttachmentLimits.file_too_large_value0_mib_maximum_is_value1_mib_ac932f13",
		{
			value0: (fileSize / 1024 / 1024).toFixed(1),
			value1: MaxChatFileSizeBytes / 1024 / 1024,
		},
	);

export const formatAgentAttachmentUploadError = (error: unknown): string => {
	const message = getErrorMessage(
		error,
		i18n.t(
			"agents:AgentsPage.utils.fileAttachmentLimits.upload_failed_6efc5d27",
		),
	);
	const detail = getErrorDetail(error);
	return detail ? `${message}. ${detail}` : message;
};

export const readAgentAttachmentText = (file: File): Promise<string> => {
	if (typeof file.text === "function") {
		return file.text();
	}
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file content."));
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}
			reject(new Error("Failed to read file content."));
		};
		reader.readAsText(file);
	});
};
