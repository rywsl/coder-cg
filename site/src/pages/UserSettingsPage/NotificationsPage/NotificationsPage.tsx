import { type FC, Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueries, useQueryClient } from "react-query";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail } from "#/api/errors";
import {
	customNotificationTemplates,
	disableNotification,
	notificationDispatchMethods,
	selectTemplatesByGroup,
	systemNotificationTemplates,
	updateUserNotificationPreferences,
	userNotificationPreferences,
} from "#/api/queries/notifications";
import type { NotificationTemplate } from "#/api/typesGenerated";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Switch } from "#/components/Switch/Switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import {
	castNotificationMethod,
	methodIcons,
	methodLabels,
	notificationIsDisabled,
	selectDisabledPreferences,
} from "#/modules/notifications/utils";
import type { Permissions } from "#/modules/permissions";
import { pageTitle } from "#/utils/page";

const NotificationsPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { user, permissions } = useAuthenticated();
	const [
		disabledPreferences,
		systemTemplatesByGroup,
		customTemplatesByGroup,
		dispatchMethods,
	] = useQueries({
		queries: [
			{
				...userNotificationPreferences(user.id),
				select: selectDisabledPreferences,
			},
			{
				...systemNotificationTemplates(),
				select: (data: NotificationTemplate[]) => selectTemplatesByGroup(data),
			},
			{
				...customNotificationTemplates(),
				select: (data: NotificationTemplate[]) => selectTemplatesByGroup(data),
			},
			notificationDispatchMethods(),
		],
	});
	const queryClient = useQueryClient();
	const updatePreferences = useMutation(
		updateUserNotificationPreferences(user.id, queryClient),
	);

	// Notification emails contain a link to disable a specific notification
	// template. This functionality is achieved using the query string parameter
	// "disabled".
	const disableMutation = useMutation(
		disableNotification(user.id, queryClient),
	);
	const [searchParams] = useSearchParams();
	const disabledId = searchParams.get("disabled");
	useEffect(() => {
		if (!disabledId) {
			return;
		}
		searchParams.delete("disabled");
		disableMutation
			.mutateAsync(disabledId)
			.then(() => {
				toast.success(
					tI18n(
						"UserSettingsPage.NotificationsPage.NotificationsPage.notification_has_been_disabled_b84e023f",
					),
				);
			})
			.catch((error) => {
				toast.error(
					tI18n(
						"UserSettingsPage.NotificationsPage.NotificationsPage.error_disabling_notification_f72356fe",
					),
					{
						description: getErrorDetail(error),
					},
				);
			});
	}, [searchParams.delete, disabledId, disableMutation]);

	const ready =
		disabledPreferences.data &&
		systemTemplatesByGroup.data &&
		customTemplatesByGroup.data &&
		dispatchMethods.data;
	// Combine system and custom notification templates
	const allTemplatesByGroup = {
		...systemTemplatesByGroup.data,
		...customTemplatesByGroup.data,
	};

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"UserSettingsPage.NotificationsPage.NotificationsPage.notifications_settings_9de63927",
					),
				)}
			</title>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"UserSettingsPage.NotificationsPage.NotificationsPage.notifications_78801183",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"UserSettingsPage.NotificationsPage.NotificationsPage.control_which_notifications_you_receive_5db0dbc4",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			{ready ? (
				<div className="flex flex-col gap-8">
					{Object.entries(allTemplatesByGroup).map(([group, templates]) => {
						if (!canSeeNotificationGroup(group, permissions)) {
							return null;
						}

						const allDisabled = templates.some((tpl) => {
							return notificationIsDisabled(disabledPreferences.data, tpl);
						});

						return (
							<article
								className="border border-solid rounded-lg overflow-hidden"
								key={group}
							>
								<div className="flex flex-col">
									<header className="flex items-center justify-start gap-2 bg-surface-secondary border-0 border-b border-solid px-4 py-3">
										<div className="flex items-center gap-2">
											<Switch
												id={group}
												checked={!allDisabled}
												onCheckedChange={async (checked) => {
													const updated = { ...disabledPreferences.data };
													for (const tpl of templates) {
														updated[tpl.id] = !checked;
													}
													await updatePreferences.mutateAsync(
														{
															template_disabled_map: updated,
														},
														{
															onSuccess: () => {
																toast.success(
																	tI18n(
																		"UserSettingsPage.NotificationsPage.NotificationsPage.notification_preferences_updated_d9eea3de",
																	),
																);
															},
															onError: (error) => {
																toast.error(
																	tI18n(
																		"UserSettingsPage.NotificationsPage.NotificationsPage.error_updating_notification_preferences_3f32641a",
																	),
																	{
																		description: getErrorDetail(error),
																	},
																);
															},
														},
													);
												}}
											/>
										</div>
										<label htmlFor={group} className="font-medium text-sm">
											{group}
										</label>
									</header>
									{templates.map((tmpl) => {
										const method = castNotificationMethod(
											tmpl.method || dispatchMethods.data.default,
										);
										const Icon = methodIcons[method];
										const label = methodLabels[method];

										const disabled = notificationIsDisabled(
											disabledPreferences.data,
											tmpl,
										);

										return (
											<Fragment key={tmpl.id}>
												<div className="flex items-center justify-between gap-3 px-4 py-3 border-0 not-last:border-b border-solid">
													<div className="flex items-center gap-2">
														<Switch
															id={tmpl.id}
															checked={!disabled}
															onCheckedChange={async (checked) => {
																await updatePreferences.mutateAsync(
																	{
																		template_disabled_map: {
																			...disabledPreferences.data,
																			[tmpl.id]: !checked,
																		},
																	},
																	{
																		onSuccess: () => {
																			toast.success(
																				tI18n(
																					"UserSettingsPage.NotificationsPage.NotificationsPage.notification_preferences_updated_d9eea3de",
																				),
																			);
																		},
																		onError: (error) => {
																			toast.error(
																				tI18n(
																					"UserSettingsPage.NotificationsPage.NotificationsPage.error_updating_notification_preferences_3f32641a",
																				),
																				{
																					description: getErrorDetail(error),
																				},
																			);
																		},
																	},
																);
															}}
														/>
														<label
															htmlFor={tmpl.id}
															className="font-medium text-sm"
														>
															{tmpl.name}
														</label>
													</div>

													<Tooltip>
														<TooltipTrigger asChild>
															<Icon
																className="size-icon-sm text-content-secondary"
																aria-label={label}
															/>
														</TooltipTrigger>
														<TooltipContent side="bottom">
															{tI18n(
																"UserSettingsPage.NotificationsPage.NotificationsPage.delivery_via_6357fef5",
															)}
															{label}
														</TooltipContent>
													</Tooltip>
												</div>
											</Fragment>
										);
									})}
								</div>
							</article>
						);
					})}
				</div>
			) : (
				<Loader />
			)}
		</>
	);
};

export default NotificationsPage;

function canSeeNotificationGroup(
	group: string,
	permissions: Permissions,
): boolean {
	switch (group) {
		case "Template Events":
			return permissions.createTemplates;
		case "User Events":
			return permissions.createUser;
		case "Workspace Events":
		case "Chat Events":
		case "Custom Events":
		case "AI Cost Control Events":
			return true;
		case "AI Cost Control Admin Events":
			return permissions.createUser;
		default:
			return false;
	}
}
