import { ExternalLinkIcon } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "#/components/Button/Button";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	type DesktopConnectionStatus,
	useDesktopConnection,
} from "../../hooks/useDesktopConnection";
import { useZoomShortcuts } from "../../hooks/useZoomShortcuts";
import { DesktopToolbar, type ScaleMode } from "./DesktopToolbar";

interface DesktopPanelProps {
	chatId: string;
	/** When true the panel is the active sidebar tab. */
	isVisible?: boolean;
}

export const DesktopPanel: FC<DesktopPanelProps> = ({ chatId, isVisible }) => {
	const { t: tI18n } = useTranslation("agents");

	// Delay the VNC connection until the desktop tab is first selected.
	// Once activated, the connection stays alive even when the tab is
	// switched away.
	const [activated, setActivated] = useState(false);
	if (isVisible && !activated) {
		setActivated(true);
	}

	const [isControlling, setIsControlling] = useState(false);
	if (!isVisible && isControlling) {
		setIsControlling(false);
	}

	const [scaleMode, setScaleMode] = useState<ScaleMode>("fit");
	const [isPoppedOut, setIsPoppedOut] = useState(false);

	const { status, reconnect, attach } = useDesktopConnection({
		chatId: isPoppedOut ? undefined : chatId,
		activated: activated && !isPoppedOut,
		scaleViewport: scaleMode === "fit",
	});

	useZoomShortcuts(setScaleMode, isVisible);

	// Listen for BroadcastChannel messages from the pop-out window.
	useEffect(() => {
		const channel = new BroadcastChannel(`coder-desktop-${chatId}`);

		channel.addEventListener("message", (event) => {
			if (event.data?.type === "popout-opened") {
				setIsPoppedOut(true);
				setIsControlling(false);
			} else if (event.data?.type === "popout-closed") {
				setIsPoppedOut(false);
			}
		});

		return () => channel.close();
	}, [chatId]);

	const handlePopOut = () => {
		const width = Math.round(screen.availWidth * 0.5);
		const height = Math.round(screen.availHeight * 0.5);
		const left = Math.round((screen.availWidth - width) / 2);
		const top = Math.round((screen.availHeight - height) / 2);
		open(
			`/agents/${chatId}/desktop`,
			`coder-desktop-${chatId}`,
			`popup,width=${width},height=${height},left=${left},top=${top}`,
		);
	};

	const handleBringBack = () => {
		const channel = new BroadcastChannel(`coder-desktop-${chatId}`);
		channel.postMessage({ type: "bring-back" });
		channel.close();
		setIsPoppedOut(false);
	};

	if (isPoppedOut) {
		return (
			<div
				className="flex h-full flex-col items-center justify-center gap-3 text-content-secondary"
				role="status"
			>
				<ExternalLinkIcon className="size-8" />
				<span className="text-sm">
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.desktop_is_open_in_a_separate_window_c86f3b40",
					)}
				</span>
				<Button variant="outline" size="sm" onClick={handleBringBack}>
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.bring_back_8295d4fa",
					)}
				</Button>
			</div>
		);
	}

	return (
		<DesktopPanelView
			status={status}
			reconnect={reconnect}
			attach={attach}
			scaleMode={scaleMode}
			onScaleModeChange={setScaleMode}
			isControlling={isControlling}
			onTakeControl={() => setIsControlling(true)}
			onReleaseControl={() => setIsControlling(false)}
			onPopOut={handlePopOut}
		/>
	);
};

export interface DesktopPanelViewProps {
	status: DesktopConnectionStatus;
	reconnect: () => void;
	attach: (container: HTMLElement) => void;
	scaleMode: ScaleMode;
	onScaleModeChange: (mode: ScaleMode) => void;
	isControlling: boolean;
	onTakeControl: () => void;
	onReleaseControl: () => void;
	onPopOut?: () => void;
}

export const DesktopPanelView: FC<DesktopPanelViewProps> = ({
	status,
	reconnect,
	attach,
	scaleMode,
	onScaleModeChange,
	isControlling,
	onTakeControl,
	onReleaseControl,
	onPopOut,
}) => {
	const { t: tI18n } = useTranslation("agents");

	if (status === "connecting") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 text-content-secondary">
				<Spinner loading className="size-6" />
				<span className="text-sm">
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.connecting_to_desktop_da0cd407",
					)}
				</span>
			</div>
		);
	}

	if (status === "disconnected") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 text-content-secondary">
				<Spinner loading className="size-6" />
				<span className="text-sm">
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.desktop_disconnected_reconnecting_6bb59fc0",
					)}
				</span>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-content-secondary">
				<span className="text-center text-sm">
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.failed_to_connect_to_the_desktop_session_the_age_4b7b2332",
					)}
				</span>
				<Button variant="outline" size="sm" onClick={reconnect}>
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.reconnect_bf8a9eab",
					)}
				</Button>
			</div>
		);
	}

	if (status === "idle") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 text-content-secondary">
				<Spinner loading className="size-6" />
				<span className="text-sm">
					{tI18n(
						"AgentsPage.components.RightPanel.DesktopPanel.initializing_desktop_d9528ef8",
					)}
				</span>
			</div>
		);
	}

	// status === "connected"
	return (
		<div className="flex h-full w-full flex-col">
			<DesktopToolbar
				scaleMode={scaleMode}
				onScaleModeChange={onScaleModeChange}
				isControlling={isControlling}
				onTakeControl={onTakeControl}
				onReleaseControl={onReleaseControl}
				onPopOut={onPopOut}
			/>
			<div className="min-h-0 flex-1 overflow-hidden bg-surface-secondary">
				<div
					ref={(el) => {
						if (el) attach(el);
					}}
					className="h-full w-full"
					inert={!isControlling ? true : undefined}
					role="application"
					aria-label={
						isControlling
							? tI18n(
									"AgentsPage.components.RightPanel.DesktopPanel.remote_desktop_interactive_020fa311",
								)
							: tI18n(
									"AgentsPage.components.RightPanel.DesktopPanel.remote_desktop_view_only_take_control_to_interac_ad95122b",
								)
					}
				/>
			</div>
		</div>
	);
};
