import {
	ExternalLinkIcon,
	HandIcon,
	MaximizeIcon,
	MousePointer2Icon,
	ScalingIcon,
} from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
export type ScaleMode = "native" | "fit";

interface DesktopToolbarProps {
	scaleMode: ScaleMode;
	onScaleModeChange: (mode: ScaleMode) => void;
	isControlling: boolean;
	onTakeControl: () => void;
	onReleaseControl: () => void;
	onPopOut?: () => void;
	isPoppedOut?: boolean;
}

export const DesktopToolbar: FC<DesktopToolbarProps> = ({
	scaleMode,
	onScaleModeChange,
	isControlling,
	onTakeControl,
	onReleaseControl,
	onPopOut,
	isPoppedOut,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div
			className="flex h-8 shrink-0 items-center justify-end gap-1 border-0 border-b border-solid border-border-default bg-surface-primary px-1.5"
			role="group"
			aria-label={tI18n(
				"AgentsPage.components.RightPanel.DesktopToolbar.desktop_controls_ad491372",
			)}
		>
			{/* Take/Release control */}
			<Button
				variant="subtle"
				size="sm"
				onClick={isControlling ? onReleaseControl : onTakeControl}
				aria-pressed={isControlling}
				className="h-6 gap-1.5 px-2 text-xs"
			>
				{isControlling ? (
					<>
						<HandIcon className="size-3.5" />
						{tI18n(
							"AgentsPage.components.RightPanel.DesktopToolbar.release_control_dd69db70",
						)}
					</>
				) : (
					<>
						<MousePointer2Icon className="size-3.5" />
						{tI18n(
							"AgentsPage.components.RightPanel.DesktopToolbar.take_control_fbf728c3",
						)}
					</>
				)}
			</Button>
			{/* Zoom toggle */}
			<Button
				variant="subtle"
				size="sm"
				onClick={() =>
					onScaleModeChange(scaleMode === "native" ? "fit" : "native")
				}
				aria-label={
					scaleMode === "native"
						? tI18n(
								"AgentsPage.components.RightPanel.DesktopToolbar.zoom_to_fit_ctrl_0_126aef3a",
							)
						: tI18n(
								"AgentsPage.components.RightPanel.DesktopToolbar.zoom_to_100_ctrl_1_dcbfdadd",
							)
				}
				className="h-6 gap-1.5 px-2 text-xs"
			>
				{scaleMode === "native" ? (
					<>
						<ScalingIcon className="size-3.5" />
						{tI18n(
							"AgentsPage.components.RightPanel.DesktopToolbar.zoom_to_fit_543f1a82",
						)}
					</>
				) : (
					<>
						<MaximizeIcon className="size-3.5" />
						{tI18n(
							"AgentsPage.components.RightPanel.DesktopToolbar.zoom_to_100_c23bdb43",
						)}
					</>
				)}
			</Button>
			{/* Detach button */}
			{onPopOut && !isPoppedOut && (
				<Button
					variant="subtle"
					size="sm"
					onClick={onPopOut}
					aria-label={tI18n(
						"AgentsPage.components.RightPanel.DesktopToolbar.detach_desktop_to_new_window_84f9dc13",
					)}
					className="h-6 gap-1.5 px-2 text-xs"
				>
					<ExternalLinkIcon className="size-3.5" />
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopToolbar.detach_74bc1174",
					)}
				</Button>
			)}
		</div>
	);
};
