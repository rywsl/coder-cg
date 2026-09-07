import { cn } from "cn";
import { RefreshCwIcon, SettingsIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { InboxNotification } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/Popover/Popover";
import { ScrollArea } from "#/components/ScrollArea/ScrollArea";
import { Spinner } from "#/components/Spinner/Spinner";
import { InboxButton } from "./InboxButton";
import { InboxItem } from "./InboxItem";
import { UnreadBadge } from "./UnreadBadge";

type InboxPopoverProps = {
	notifications: readonly InboxNotification[] | undefined;
	unreadCount: number;
	error: unknown;
	isLoadingMoreNotifications: boolean;
	hasMoreNotifications: boolean;
	onRetry: () => void;
	onMarkAllAsRead: () => void;
	onMarkNotificationAsRead: (notificationId: string) => void;
	onLoadMoreNotifications: () => void;
	defaultOpen?: boolean;
};

export const InboxPopover: FC<InboxPopoverProps> = ({
	defaultOpen,
	unreadCount,
	notifications,
	error,
	isLoadingMoreNotifications,
	hasMoreNotifications,
	onRetry,
	onMarkAllAsRead,
	onMarkNotificationAsRead,
	onLoadMoreNotifications,
}) => {
	const { t: tI18n } = useTranslation("notifications");

	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<InboxButton unreadCount={unreadCount} />
			</PopoverTrigger>
			<PopoverContent
				className="w-(--radix-popper-available-width) max-w-[466px]"
				align="end"
			>
				{/*
				 * data-radix-scroll-area-viewport is used to set the max-height of the ScrollArea
				 * https://github.com/shadcn-ui/ui/issues/542#issuecomment-2339361283
				 */}
				<ScrollArea
					className={cn([
						"[--bottom-offset:48px]",
						"[--max-height:calc(var(--radix-popover-content-available-height)-var(--bottom-offset))]",
						"[&>[data-radix-scroll-area-viewport]]:max-h-(--max-height)",
					])}
				>
					<div
						className={cn([
							"flex items-center justify-between p-3 border-0 border-b border-solid border-border",
							"sticky top-0 bg-surface-primary z-10 rounded-t",
						])}
					>
						<div className="flex items-center gap-2">
							<span className="text-xl font-semibold">
								{tI18n(
									"notifications.NotificationsInbox.InboxPopover.inbox_94835ea2",
								)}
							</span>
							{unreadCount > 0 && <UnreadBadge count={unreadCount} />}
						</div>

						<div className="flex justify-end gap-1">
							<Button
								variant="subtle"
								size="sm"
								disabled={!(notifications && notifications.length > 0)}
								onClick={onMarkAllAsRead}
							>
								{tI18n(
									"notifications.NotificationsInbox.InboxPopover.mark_all_as_read_d7592650",
								)}
							</Button>
							<Button variant="outline" size="icon" asChild>
								<RouterLink
									to="/settings/notifications"
									onClick={() => setIsOpen(false)}
								>
									<SettingsIcon />
									<span className="sr-only">
										{tI18n(
											"notifications.NotificationsInbox.InboxPopover.notification_settings_63568f05",
										)}
									</span>
								</RouterLink>
							</Button>
						</div>
					</div>

					{notifications ? (
						notifications.length > 0 ? (
							<div
								className={cn([
									"[&>[role=menuitem]]:border-0 [&>[role=menuitem]:not(:last-child)]:border-b",
									"[&>[role=menuitem]]:border-solid [&>[role=menuitem]]:border-border",
								])}
							>
								{notifications.map((notification) => (
									<InboxItem
										key={notification.id}
										notification={notification}
										onMarkNotificationAsRead={onMarkNotificationAsRead}
									/>
								))}
								{hasMoreNotifications && (
									<Button
										variant="subtle"
										size="sm"
										disabled={isLoadingMoreNotifications}
										onClick={onLoadMoreNotifications}
										className="w-full"
									>
										<Spinner loading={isLoadingMoreNotifications} size="sm" />
										{tI18n(
											"notifications.NotificationsInbox.InboxPopover.load_more_ac8991ef",
										)}
									</Button>
								)}
							</div>
						) : (
							<div className="p-6 flex items-center justify-center min-h-48">
								<div className="text-sm text-center flex flex-col">
									<span className="font-medium">
										{tI18n(
											"notifications.NotificationsInbox.InboxPopover.no_notifications_cbce2040",
										)}
									</span>
									<span className="text-xs text-content-secondary">
										{tI18n(
											"notifications.NotificationsInbox.InboxPopover.new_notifications_will_be_displayed_here_8ceeec99",
										)}
									</span>
								</div>
							</div>
						)
					) : error === undefined ? (
						<div className="p-6 flex items-center justify-center min-h-48">
							<Spinner loading />
							<span className="sr-only">
								{tI18n(
									"notifications.NotificationsInbox.InboxPopover.loading_notifications_f3484ee6",
								)}
							</span>
						</div>
					) : (
						<div className="p-6 flex items-center justify-center min-h-48">
							<div className="text-sm text-center flex flex-col">
								<span className="font-medium">
									{tI18n(
										"notifications.NotificationsInbox.InboxPopover.error_loading_notifications_15cb91ac",
									)}
								</span>
								<span className="text-xs text-content-secondary">
									{tI18n(
										"notifications.NotificationsInbox.InboxPopover.click_on_the_button_below_to_retry_c1527d25",
									)}
								</span>
								<div className="mt-3">
									<Button size="sm" variant="outline" onClick={onRetry}>
										<RefreshCwIcon />
										{tI18n(
											"notifications.NotificationsInbox.InboxPopover.retry_942087cc",
										)}
									</Button>
								</div>
							</div>
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
};
