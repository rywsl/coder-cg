import { Volume2Icon, VolumeOffIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { getChimeEnabled, setChimeEnabled } from "../utils/chime";

interface ChimeButtonProps {
	enabled?: boolean;
	onToggle?: () => void;
}

export const ChimeButton: FC<ChimeButtonProps> = ({ enabled, onToggle }) => {
	const { t: tI18n } = useTranslation("agents");

	const [internalEnabled, setInternalEnabled] = useState(getChimeEnabled);
	const isControlled = enabled !== undefined && onToggle !== undefined;
	const isEnabled = isControlled ? enabled : internalEnabled;

	const handleClick = () => {
		if (isControlled) {
			onToggle();
			return;
		}
		const next = !internalEnabled;
		setInternalEnabled(next);
		setChimeEnabled(next);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="subtle"
					size="icon"
					onClick={handleClick}
					aria-label={
						isEnabled
							? tI18n(
									"AgentsPage.components.ChimeButton.mute_completion_chime_8cde3dfd",
								)
							: tI18n(
									"AgentsPage.components.ChimeButton.enable_completion_chime_83f676ca",
								)
					}
					className="size-7 text-content-secondary hover:text-content-primary"
				>
					{isEnabled ? (
						<Volume2Icon className="text-content-success" />
					) : (
						<VolumeOffIcon className="text-content-secondary" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{isEnabled
					? tI18n(
							"AgentsPage.components.ChimeButton.disable_completion_sound_9cb780ca",
						)
					: tI18n(
							"AgentsPage.components.ChimeButton.enable_completion_sound_213a47ff",
						)}
			</TooltipContent>
		</Tooltip>
	);
};
