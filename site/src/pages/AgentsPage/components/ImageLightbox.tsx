import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "#/components/Dialog/Dialog";

interface ImageLightboxProps {
	src: string;
	onClose: () => void;
}

export const ImageLightbox: FC<ImageLightboxProps> = ({ src, onClose }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="max-h-[85vh] max-w-[90vw] w-fit border-0 bg-transparent p-0 shadow-none"
				aria-describedby={undefined}
			>
				<DialogTitle className="sr-only">
					{tI18n("AgentsPage.components.ImageLightbox.image_preview_f0924743")}
				</DialogTitle>
				<img
					src={src}
					alt={tI18n(
						"AgentsPage.components.ImageLightbox.attachment_preview_c9e88695",
					)}
					className="max-h-[85vh] max-w-[90vw] rounded object-contain"
				/>
			</DialogContent>
		</Dialog>
	);
};
