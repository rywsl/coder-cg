import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "#/components/Dialog/Dialog";
import { RECORDING_UNAVAILABLE_TEXT } from "./ChatElements/tools/previewConstants";

interface VideoLightboxProps {
	src: string;
	open: boolean;
	onClose: () => void;
}

export const VideoLightbox: FC<VideoLightboxProps> = ({
	src,
	open,
	onClose,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const [videoError, setVideoError] = useState(false);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent
				className="max-h-[85vh] max-w-[90vw] w-fit border-0 bg-transparent p-0 shadow-none"
				aria-describedby={undefined}
			>
				<DialogTitle className="sr-only">
					{tI18n(
						"AgentsPage.components.VideoLightbox.recording_playback_708c8c8d",
					)}
				</DialogTitle>
				{videoError ? (
					<div className="flex items-center justify-center rounded bg-surface-secondary p-8 text-sm text-content-secondary">
						{RECORDING_UNAVAILABLE_TEXT}
					</div>
				) : (
					// biome-ignore lint/a11y/useMediaCaption: Screen recordings do not have caption tracks.
					<video
						src={src}
						controls
						className="max-h-[85vh] max-w-[90vw] rounded"
						onError={() => setVideoError(true)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
