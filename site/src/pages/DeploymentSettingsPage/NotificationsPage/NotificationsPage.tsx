import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "react-query";
import {
	customNotificationTemplates,
	notificationDispatchMethods,
	selectTemplatesByGroup,
	systemNotificationTemplates,
} from "#/api/queries/notifications";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#/components/Tabs/Tabs";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useSearchParamsKey } from "#/hooks/useSearchParamsKey";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { castNotificationMethod } from "#/modules/notifications/utils";
import { deploymentGroupHasParent } from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import OptionsTable from "../OptionsTable";
import { NotificationEvents } from "./NotificationEvents";
import { Troubleshooting } from "./Troubleshooting";

const NOTIFICATION_TABS = ["events", "settings", "troubleshooting"] as const;

function isNotificationTab(
	value: string,
): value is (typeof NOTIFICATION_TABS)[number] {
	return (NOTIFICATION_TABS as readonly string[]).includes(value);
}

const NotificationsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { permissions } = useAuthenticated();
	const { deploymentConfig } = useDeploymentConfig();
	const canEditDeploymentConfig = permissions.editDeploymentConfig;
	const [systemTemplatesByGroup, customTemplatesByGroup, dispatchMethods] =
		useQueries({
			queries: [
				{
					...systemNotificationTemplates(),
					select: selectTemplatesByGroup,
				},
				{
					...customNotificationTemplates(),
					select: selectTemplatesByGroup,
				},
				notificationDispatchMethods(),
			],
		});
	const tabState = useSearchParamsKey({
		key: "tab",
		defaultValue: "events",
	});

	const activeTab = isNotificationTab(tabState.value)
		? tabState.value
		: NOTIFICATION_TABS[0];

	const ready =
		systemTemplatesByGroup.data != null &&
		customTemplatesByGroup.data != null &&
		dispatchMethods.data != null;
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
						"DeploymentSettingsPage.NotificationsPage.NotificationsPage.notifications_settings_9de63927",
					),
				)}
			</title>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"DeploymentSettingsPage.NotificationsPage.NotificationsPage.notifications_78801183",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"DeploymentSettingsPage.NotificationsPage.NotificationsPage.control_delivery_methods_for_notifications_on_th_4743f344",
					)}{" "}
					<SettingsHeaderDocsLink
						href={docs("/admin/monitoring/notifications")}
						context="about notifications"
					/>
				</SettingsHeaderDescription>
			</SettingsHeader>
			{!ready ? (
				<Loader />
			) : (
				<Tabs value={activeTab} onValueChange={tabState.setValue}>
					<TabsList>
						<TabsTrigger value="events">
							{tI18n(
								"DeploymentSettingsPage.NotificationsPage.NotificationsPage.events_8d14f6e7",
							)}
						</TabsTrigger>
						<TabsTrigger value="settings">
							{tI18n(
								"DeploymentSettingsPage.NotificationsPage.NotificationsPage.settings_74a883a0",
							)}
						</TabsTrigger>
						<TabsTrigger value="troubleshooting">
							{tI18n(
								"DeploymentSettingsPage.NotificationsPage.NotificationsPage.troubleshooting_c3af076f",
							)}
						</TabsTrigger>
					</TabsList>
					<TabsContent value="events" className="py-6">
						<NotificationEvents
							templatesByGroup={allTemplatesByGroup}
							deploymentConfig={deploymentConfig.config}
							canEdit={canEditDeploymentConfig}
							defaultMethod={castNotificationMethod(
								dispatchMethods.data.default,
							)}
							availableMethods={dispatchMethods.data.available.map(
								castNotificationMethod,
							)}
						/>
					</TabsContent>
					<TabsContent value="settings" className="py-6">
						<OptionsTable
							options={deploymentConfig.options.filter((o) =>
								deploymentGroupHasParent(o.group, "Notifications"),
							)}
						/>
					</TabsContent>
					<TabsContent value="troubleshooting" className="py-6">
						<Troubleshooting canEdit={canEditDeploymentConfig} />
					</TabsContent>
				</Tabs>
			)}
		</>
	);
};

export default NotificationsPage;
