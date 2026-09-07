import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { workspaceResolveAutostart } from "#/api/queries/workspaceQuota";
import type {
	Template,
	TemplateVersion,
	Workspace,
	WorkspaceBuild,
} from "#/api/typesGenerated";
import { MemoizedInlineMarkdown } from "#/components/Markdown/InlineMarkdown";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { TemplateUpdateMessage } from "#/modules/templates/TemplateUpdateMessage";

dayjs.extend(relativeTime);

import { useQuery } from "react-query";
import { formatDate } from "#/utils/time";
import type { WorkspacePermissions } from "../../../modules/workspaces/permissions";
import {
	NotificationActionButton,
	type NotificationItem,
	Notifications,
} from "./Notifications";

type WorkspaceNotificationsProps = {
	workspace: Workspace;
	template: Template;
	permissions: WorkspacePermissions;
	onRestartWorkspace: () => void;
	onUpdateWorkspace: () => void;
	onActivateWorkspace: () => void;
	latestVersion?: TemplateVersion;
};

export const WorkspaceNotifications: FC<WorkspaceNotificationsProps> = ({
	workspace,
	template,
	latestVersion,
	permissions,
	onRestartWorkspace,
	onUpdateWorkspace,
	onActivateWorkspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const notifications: NotificationItem[] = [];

	// Outdated
	const canAutostartQuery = useQuery(workspaceResolveAutostart(workspace.id));
	const isParameterMismatch =
		canAutostartQuery.data?.parameter_mismatch ?? false;
	const canAutostart = !isParameterMismatch;
	const updateRequired =
		(workspace.template_require_active_version ||
			workspace.automatic_updates === "always") &&
		workspace.outdated;
	const autoStartFailing = workspace.autostart_schedule && !canAutostart;
	const requiresManualUpdate = updateRequired && autoStartFailing;

	if (workspace.outdated && latestVersion) {
		const actions = (
			<NotificationActionButton onClick={onUpdateWorkspace}>
				{tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.update_c1c1009d",
				)}
			</NotificationActionButton>
		);
		if (requiresManualUpdate) {
			notifications.push({
				title: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.autostart_has_been_disabled_for_your_workspace_89971730",
				),
				severity: "warning",
				detail: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.autostart_is_unable_to_automatically_update_your_fa2675b2",
				),

				actions,
			});
		} else {
			notifications.push({
				title: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.an_update_is_available_for_your_workspace_870d6c03",
				),
				severity: "info",
				detail: (
					<TemplateUpdateMessage>{latestVersion.message}</TemplateUpdateMessage>
				),
				actions,
			});
		}
	}

	// Unhealthy
	if (
		workspace.latest_build.status === "running" &&
		!workspace.health.healthy
	) {
		const troubleshootingURL = findTroubleshootingURL(workspace.latest_build);

		if (isStartupScriptFailure(workspace)) {
			// Restarting won't fix a broken startup script, so omit the Restart
			// button and guide the user to their template admin instead.
			notifications.push({
				title: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.a_startup_script_has_failed_4c1d3704",
				),
				severity: "warning",
				detail: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.the_workspace_agent_is_running_but_a_startup_scr_8e3f1049",
				),
				actions: troubleshootingURL ? (
					<NotificationActionButton
						onClick={() => window.open(troubleshootingURL, "_blank")}
					>
						{tI18n(
							"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.troubleshooting_c3af076f",
						)}
					</NotificationActionButton>
				) : undefined,
			});
		} else {
			const hasActions = permissions.updateWorkspace || troubleshootingURL;
			notifications.push({
				title: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.one_or_more_workspace_agents_need_attention_436c9ece",
				),
				severity: "warning",
				detail: tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.expand_an_agent_s_logs_to_view_per_agent_health__598391cc",
				),
				actions: hasActions ? (
					<>
						{permissions.updateWorkspace && (
							<NotificationActionButton onClick={onRestartWorkspace}>
								{tI18n(
									"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.restart_6b983a81",
								)}
							</NotificationActionButton>
						)}
						{troubleshootingURL && (
							<NotificationActionButton
								onClick={() => window.open(troubleshootingURL, "_blank")}
							>
								{tI18n(
									"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.troubleshooting_c3af076f",
								)}
							</NotificationActionButton>
						)}
					</>
				) : undefined,
			});
		}
	}

	// Dormant
	const { entitlements } = useDashboard();
	const advancedSchedulingEnabled =
		entitlements.features.advanced_template_scheduling.enabled;
	if (advancedSchedulingEnabled && workspace.dormant_at) {
		const formatDateTime = (dateStr: string, timestamp: boolean): string => {
			const date = new Date(dateStr);
			return formatDate(date, {
				month: "long",
				day: "numeric",
				year: "numeric",
				...(timestamp ? { hour: "numeric", minute: "numeric" } : {}),
			});
		};
		const actions = (
			<NotificationActionButton onClick={onActivateWorkspace}>
				{tI18n(
					"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.activate_24433c70",
				)}
			</NotificationActionButton>
		);
		notifications.push({
			actions,
			title: tI18n(
				"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.workspace_is_dormant_92f03ac0",
			),
			severity: "warning",
			detail: workspace.deleting_at ? (
				<>
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.this_workspace_has_not_been_used_for_ac55990c",
					)}{" "}
					{dayjs(workspace.last_used_at).fromNow(true)}
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.and_was_marked_dormant_on_a8bc8a38",
					)}
					{formatDateTime(workspace.dormant_at, false)}
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.it_is_scheduled_to_be_deleted_on_cdd98e41",
					)}
					{formatDateTime(workspace.deleting_at, true)}
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.to_keep_it_you_must_activate_the_workspace_9951b971",
					)}
				</>
			) : (
				<>
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.this_workspace_has_not_been_used_for_ac55990c",
					)}{" "}
					{dayjs(workspace.last_used_at).fromNow(true)}
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.and_was_marked_dormant_on_a8bc8a38",
					)}
					{formatDateTime(workspace.dormant_at, false)}
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.it_is_not_scheduled_for_auto_deletion_but_will_b_680b2960",
					)}
				</>
			),
		});
	}

	// Pending in Queue
	const [showAlertPendingInQueue, setShowAlertPendingInQueue] = useState(false);
	// 2023-11-15 - MES - This effect will be called every single render because
	// "now" will always change and invalidate the dependency array. Need to
	// figure out if this effect really should run every render (possibly meaning
	// no dependency array at all), or how to get the array stabilized (ideal)
	const now = dayjs();
	useEffect(() => {
		if (
			workspace.latest_build.status !== "pending" ||
			workspace.latest_build.job.queue_size === 0
		) {
			if (!showAlertPendingInQueue) {
				return;
			}

			const hideTimer = setTimeout(() => {
				setShowAlertPendingInQueue(false);
			}, 250);
			return () => {
				clearTimeout(hideTimer);
			};
		}

		const t = Math.max(
			0,
			5000 - dayjs().diff(dayjs(workspace.latest_build.created_at)),
		);
		const showTimer = setTimeout(() => {
			setShowAlertPendingInQueue(true);
		}, t);

		return () => {
			clearTimeout(showTimer);
		};
	}, [workspace, now, showAlertPendingInQueue]);

	if (showAlertPendingInQueue) {
		notifications.push({
			title: tI18n(
				"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.workspace_build_is_pending_965cf1fd",
			),
			severity: "info",
			detail: (
				<>
					{tI18n(
						"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.this_workspace_build_job_is_waiting_for_a_provis_462d45a7",
					)}
					<span className="block mt-3">
						{tI18n(
							"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.position_in_queue_7f05c4b1",
						)}{" "}
						<strong>{workspace.latest_build.job.queue_position}</strong>
					</span>
				</>
			),
		});
	}

	// Deprecated
	if (template.deprecated) {
		notifications.push({
			title: tI18n(
				"WorkspacePage.WorkspaceNotifications.WorkspaceNotifications.this_workspace_uses_a_deprecated_template_d634763c",
			),
			severity: "warning",
			detail: (
				<MemoizedInlineMarkdown>
					{template.deprecation_message}
				</MemoizedInlineMarkdown>
			),
		});
	}

	const infoNotifications = notifications.filter((n) => n.severity === "info");
	const warningNotifications = notifications.filter(
		(n) => n.severity === "warning",
	);

	// We have to avoid rendering out a div at all if there is no content so
	// that we don't introduce additional gaps via the parent flex container
	if (infoNotifications.length === 0 && warningNotifications.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center gap-3">
			{infoNotifications.length > 0 && (
				<Notifications
					items={infoNotifications}
					severity="info"
					icon={<InfoIcon aria-hidden="true" className="size-icon-sm" />}
				/>
			)}

			{warningNotifications.length > 0 && (
				<Notifications
					items={warningNotifications}
					severity="warning"
					icon={
						<TriangleAlertIcon aria-hidden="true" className="size-icon-sm" />
					}
				/>
			)}
		</div>
	);
};

const findTroubleshootingURL = (
	workspaceBuild: WorkspaceBuild,
): string | undefined => {
	for (const resource of workspaceBuild.resources) {
		if (resource.agents) {
			for (const agent of resource.agents) {
				if (agent.troubleshooting_url) {
					return agent.troubleshooting_url;
				}
			}
		}
	}
	return undefined;
};

/**
 * Returns true when every failing agent's lifecycle state is "start_error",
 * meaning the agent process is running but a startup script exited with an
 * error. Restarting the workspace will not fix this because the template admin
 * must correct the startup script.
 */
const isStartupScriptFailure = (workspace: Workspace): boolean => {
	const failingIds = new Set(workspace.health.failing_agents);
	if (failingIds.size === 0) {
		return false;
	}
	for (const resource of workspace.latest_build.resources) {
		for (const agent of resource.agents ?? []) {
			if (failingIds.has(agent.id) && agent.lifecycle_state !== "start_error") {
				return false;
			}
		}
	}
	return true;
};
