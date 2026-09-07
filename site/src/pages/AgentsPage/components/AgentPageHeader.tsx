import {
	ArrowLeftIcon,
	BellIcon,
	BellOffIcon,
	EllipsisIcon,
	PanelLeftIcon,
	SettingsIcon,
	Volume2Icon,
	VolumeOffIcon,
} from "lucide-react";
import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Link,
	NavLink,
	type To,
	useLocation,
	useOutletContext,
} from "react-router";
import { toast } from "sonner";
import { getErrorMessage } from "#/api/errors";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { ProductLogo } from "#/components/Icons/ProductLogo";
import { Spinner } from "#/components/Spinner/Spinner";
import { useWebpushNotifications } from "#/contexts/useWebpushNotifications";
import type { AgentsPageOutletContext } from "../AgentsPageLayout";
import { getChimeEnabled, setChimeEnabled } from "../utils/chime";

interface AgentPageHeaderProps {
	children?: ReactNode;
	/** When set, shows a back link on mobile instead of the logo
	 *  and hides the mobile actions menu. */
	mobileBack?: { to: To; label: string };
	chimeEnabled?: boolean;
	onToggleChime?: () => void;
	webPush?: ReturnType<typeof useWebpushNotifications>;
	onToggleNotifications?: () => Promise<void> | void;
}

export const AgentPageHeader: FC<AgentPageHeaderProps> = ({
	children,
	mobileBack,
	chimeEnabled: controlledChimeEnabled,
	onToggleChime,
	webPush: controlledWebPush,
	onToggleNotifications,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSidebarCollapsed, onExpandSidebar } =
		useOutletContext<AgentsPageOutletContext>();
	const location = useLocation();

	const [internalChimeEnabled, setInternalChimeEnabled] =
		useState(getChimeEnabled);
	const internalWebPush = useWebpushNotifications();
	const chimeEnabled = controlledChimeEnabled ?? internalChimeEnabled;
	const webPush = controlledWebPush ?? internalWebPush;
	const [isDesktop, setIsDesktop] = useState<boolean>(() => {
		return window.matchMedia("(min-width: 640px)").matches;
	});

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 640px)");
		const onMediaChange = (event: MediaQueryListEvent) => {
			setIsDesktop(event.matches);
		};

		setIsDesktop(mediaQuery.matches);
		if (typeof mediaQuery.addEventListener === "function") {
			mediaQuery.addEventListener("change", onMediaChange);
		} else {
			mediaQuery.addListener(onMediaChange);
		}
		return () => {
			if (typeof mediaQuery.removeEventListener === "function") {
				mediaQuery.removeEventListener("change", onMediaChange);
			} else {
				mediaQuery.removeListener(onMediaChange);
			}
		};
	}, []);

	const handleChimeToggle = () => {
		if (onToggleChime) {
			onToggleChime();
			return;
		}
		const next = !chimeEnabled;
		setInternalChimeEnabled(next);
		setChimeEnabled(next);
	};

	const handleNotificationToggle = async () => {
		if (onToggleNotifications) {
			await onToggleNotifications();
			return;
		}
		try {
			if (webPush.subscribed) {
				await webPush.unsubscribe();
			} else {
				await webPush.subscribe();
			}
		} catch (error) {
			const action = webPush.subscribed ? "disable" : "enable";
			toast.error(
				getErrorMessage(
					error,
					tI18n(
						"AgentsPage.components.AgentPageHeader.failed_to_value0_notifications_ed6c5fe0",
						{
							value0: action,
						},
					),
				),
			);
		}
	};

	return (
		<div className="order-first flex shrink-0 items-center gap-2 pl-4 pr-2 pt-3 pb-0.5 sm:order-0 sm:px-4 sm:py-0.5">
			{mobileBack ? (
				<Button
					asChild
					variant="subtle"
					size="icon"
					aria-label={mobileBack.label}
					className="size-7 shrink-0 sm:hidden"
				>
					<Link to={mobileBack.to}>
						<ArrowLeftIcon />
					</Link>
				</Button>
			) : (
				<div className="inline-flex shrink-0 items-center gap-2 sm:hidden">
					<NavLink to="/workspaces" className="inline-flex">
						<ProductLogo className="size-6" />
					</NavLink>
				</div>
			)}
			{isSidebarCollapsed && (
				<Button
					variant="subtle"
					size="icon"
					onClick={onExpandSidebar}
					aria-label={tI18n(
						"AgentsPage.components.AgentPageHeader.expand_sidebar_37a5d648",
					)}
					className="hidden size-7 min-w-0 shrink-0 sm:inline-flex"
				>
					<PanelLeftIcon />
				</Button>
			)}
			<div className="min-w-0 flex-1" />
			{children && isDesktop && (
				<div className="hidden items-center gap-2 sm:flex">{children}</div>
			)}
			{/* Mobile: meatball menu with all actions */}
			{!mobileBack && !isDesktop && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="subtle"
							size="icon"
							aria-label={tI18n(
								"AgentsPage.components.AgentPageHeader.more_options_bc79cdff",
							)}
							className="size-7 text-content-secondary hover:text-content-primary sm:hidden"
						>
							<EllipsisIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="mobile-full-width-dropdown mobile-full-width-dropdown-top [&_[role=menuitem]]:text-sm"
					>
						<DropdownMenuItem asChild>
							<Link
								to="/agents/settings"
								state={{ from: location.pathname + location.search }}
							>
								<SettingsIcon className="size-icon-sm" />
								{tI18n(
									"AgentsPage.components.AgentPageHeader.settings_74a883a0",
								)}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
								handleChimeToggle();
							}}
						>
							{chimeEnabled ? (
								<Volume2Icon className="size-icon-sm" />
							) : (
								<VolumeOffIcon className="size-icon-sm" />
							)}
							{chimeEnabled
								? tI18n(
										"AgentsPage.components.AgentPageHeader.turn_sound_off_853b0ebe",
									)
								: tI18n(
										"AgentsPage.components.AgentPageHeader.turn_sound_on_bad2768c",
									)}
						</DropdownMenuItem>
						{webPush.enabled && (
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									void handleNotificationToggle();
								}}
								disabled={webPush.loading}
							>
								{webPush.loading ? (
									<Spinner size="sm" loading className="h-icon w-icon-sm" />
								) : webPush.subscribed ? (
									<BellIcon className="size-icon-sm" />
								) : (
									<BellOffIcon className="size-icon-sm" />
								)}
								{webPush.subscribed
									? tI18n(
											"AgentsPage.components.AgentPageHeader.turn_notifications_off_ec5c552b",
										)
									: tI18n(
											"AgentsPage.components.AgentPageHeader.turn_notifications_on_e455bfe7",
										)}
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
};
