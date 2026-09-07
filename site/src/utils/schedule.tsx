import cronParser from "cron-parser";
import cronstrue from "cronstrue/i18n";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import type { Template, Workspace } from "#/api/typesGenerated";
import { HelpPopoverTitle } from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import { i18n } from "#/i18n";
import { currentLocale } from "#/i18n/locale";
import type { WorkspaceActivityStatus } from "#/modules/workspaces/activity";
import { isWorkspaceOn } from "./workspace";

// REMARK: some plugins depend on utc, so it's listed first. Otherwise they're
//         sorted alphabetically.
dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
/**
 * @fileoverview Client-side counterpart of the coderd/autostart/schedule Go
 * package. This package is a variation on crontab that uses minute, hour and
 * day of week.
 */

/**
 * DEFAULT_TIMEZONE is the default timezone that crontab assumes unless one is
 * specified.
 */
const DEFAULT_TIMEZONE = "UTC";

/**
 * stripTimezone strips a leading timezone from a schedule string
 */
export const stripTimezone = (raw: string): string => {
	return raw.replace(/CRON_TZ=\S*\s/, "");
};

/**
 * extractTimezone returns a leading timezone from a schedule string if one is
 * specified; otherwise the specified defaultTZ
 */
export const extractTimezone = (
	raw: string,
	defaultTZ = DEFAULT_TIMEZONE,
): string => {
	const matches = raw.match(/CRON_TZ=\S*\s/g);

	if (matches && matches.length > 0) {
		return matches[0].replace(/CRON_TZ=/, "").trim();
	}
	return defaultTZ;
};

export const autostartDisplay = (schedule: string | undefined): string => {
	if (schedule) {
		return (
			cronstrue
				.toString(stripTimezone(schedule), {
					locale: currentLocale() === "zh-CN" ? "zh_CN" : "en",
					throwExceptionOnParseError: false,
				})
				// We don't want to keep the At because it is on the label
				.replace(currentLocale() === "zh-CN" ? /^在/ : "At", "")
		);
	}
	return i18n.t("pages:schedule.manual_b0b9fe24");
};

const isShuttingDown = (workspace: Workspace, deadline?: Dayjs): boolean => {
	if (!deadline) {
		if (!workspace.latest_build.deadline) {
			return false;
		}
		deadline = dayjs(workspace.latest_build.deadline).utc();
	}
	const now = dayjs().utc();
	return isWorkspaceOn(workspace) && now.isAfter(deadline);
};

export const autostopDisplay = (
	workspace: Workspace,
	activityStatus: WorkspaceActivityStatus,
	template: Template,
): {
	message: ReactNode;
	tooltip?: ReactNode;
	danger?: boolean;
} => {
	const ttl = workspace.ttl_ms;

	if (isWorkspaceOn(workspace) && workspace.latest_build.deadline) {
		// Workspace is on --> derive from latest_build.deadline. Note that the
		// user may modify their workspace object (ttl) while the workspace is
		// running and depending on system semantics, the deadline may still
		// represent the previously defined ttl. Thus, we always derive from the
		// deadline as the source of truth.

		const deadline = dayjs(workspace.latest_build.deadline).tz(
			dayjs.tz.guess(),
		);
		const now = dayjs(workspace.latest_build.deadline);

		if (activityStatus === "connected") {
			const hasMaxDeadline = Boolean(workspace.latest_build.max_deadline);
			const maxDeadline = dayjs(workspace.latest_build.max_deadline);
			if (hasMaxDeadline && maxDeadline.isBefore(now.add(2, "hour"))) {
				return {
					message: i18n.t("pages:schedule.required_to_stop_soon_424e7fd3"),
					tooltip: (
						<>
							<HelpPopoverTitle>
								{i18n.t("pages:schedule.upcoming_stop_required_69160888")}
							</HelpPopoverTitle>
							{i18n.t(
								"pages:schedule.this_workspace_will_be_required_to_stop_by_0f5607b6",
							)}{" "}
							{dayjs(workspace.latest_build.max_deadline).format(
								"MMMM D [at] h:mm A",
							)}
							{i18n.t(
								"pages:schedule.you_can_restart_your_workspace_before_then_to_av_1784720d",
							)}
						</>
					),
					danger: true,
				};
			}
		}

		if (isShuttingDown(workspace, deadline)) {
			return {
				message: i18n.t("pages:schedule.workspace_is_shutting_down_361cba69"),
			};
		}
		let title = (
			<HelpPopoverTitle>
				{i18n.t("pages:schedule.template_autostop_requirement_8bc5771a")}
			</HelpPopoverTitle>
		);
		let reason: ReactNode = ` because the ${template.display_name} template has an autostop requirement.`;
		if (template.autostop_requirement && template.allow_user_autostop) {
			title = (
				<HelpPopoverTitle>
					{i18n.t("pages:schedule.autostop_schedule_a7778164")}
				</HelpPopoverTitle>
			);
			reason = (
				<span data-pixel="ignore">
					{" "}
					{i18n.t(
						"pages:schedule.because_this_workspace_has_enabled_autostop_you__7b608106",
					)}{" "}
					<Link asChild showExternalIcon={false} size="sm" className="p-0">
						<RouterLink to="settings/schedule">
							{i18n.t("pages:schedule.schedule_settings_2972bc7b")}
						</RouterLink>
					</Link>
					.
				</span>
			);
		}
		return {
			message: i18n.t("pages:schedule.stop_value0_ef47536e", {
				value0: deadline.fromNow(),
			}),
			tooltip: (
				<span data-pixel="ignore">
					{title}
					{i18n.t("pages:schedule.this_workspace_will_be_stopped_on_9d765e99")}{" "}
					{deadline.format("MMMM D [at] h:mm A")}
					{reason}
				</span>
			),
			danger: isShutdownSoon(workspace),
		};
	}
	if (!ttl || ttl < 1) {
		// If the workspace is not on, and the ttl is 0 or undefined, then the
		// workspace is set to manually shutdown.
		return {
			message: i18n.t("pages:schedule.manual_b0b9fe24"),
		};
	}
	// The workspace has a ttl set, but is either in an unknown state or is
	// not running. Therefore, we derive from workspace.ttl.
	const duration = dayjs.duration(ttl, "milliseconds");
	return {
		message: i18n.t("pages:schedule.stop_value0_after_start_d4b3b7f6", {
			value0: duration.humanize(),
		}),
	};
};

const isShutdownSoon = (workspace: Workspace): boolean => {
	const deadline = workspace.latest_build.deadline;
	if (!deadline) {
		return false;
	}
	const deadlineDate = new Date(deadline);
	const now = new Date();
	const diff = deadlineDate.getTime() - now.getTime();
	const oneHour = 1000 * 60 * 60;
	return diff < oneHour;
};

export const deadlineExtensionMin = dayjs.duration(30, "minutes");
export const deadlineExtensionMax = dayjs.duration(24, "hours");

/**
 * Depends on the time the workspace was last updated and a global constant.
 * @param ws workspace
 * @returns the latest datetime at which the workspace can be automatically shut down.
 */
export function getMaxDeadline(ws: Workspace | undefined): dayjs.Dayjs {
	// note: we count runtime from updated_at as started_at counts from the start of
	// the workspace build process, which can take a while.
	if (ws === undefined) {
		throw new Error(
			"Cannot calculate max deadline because workspace is undefined",
		);
	}
	const startedAt = dayjs(ws.latest_build.updated_at);
	return startedAt.add(deadlineExtensionMax);
}

/**
 * Depends on the current time and a global constant.
 * @returns the earliest datetime at which the workspace can be automatically shut down.
 */
export function getMinDeadline(): dayjs.Dayjs {
	return dayjs().add(deadlineExtensionMin);
}

export const getDeadline = (workspace: Workspace): dayjs.Dayjs =>
	dayjs(workspace.latest_build.deadline).utc();

/**
 * Get number of hours you can add or subtract to the current deadline before hitting the max or min deadline.
 * @param deadline
 * @param workspace
 * @returns number, in hours
 */
export const getMaxDeadlineChange = (
	deadline: dayjs.Dayjs,
	extremeDeadline: dayjs.Dayjs,
): number => Math.abs(deadline.diff(extremeDeadline, "hours"));

export const validTime = (time: string): boolean => {
	return /^[0-9][0-9]:[0-9][0-9]$/.test(time);
};

export const timeToCron = (time: string, tz?: string) => {
	if (!validTime(time)) {
		throw new Error(`Invalid time: ${time}`);
	}
	const [HH, mm] = time.split(":");
	let prefix = "";
	if (tz) {
		prefix = `CRON_TZ=${tz} `;
	}
	return `${prefix}${Number(mm)} ${Number(HH)} * * *`;
};

export const quietHoursDisplay = (
	browserLocale: string,
	time: string,
	tz: string,
	now: Date | undefined,
): string => {
	if (!validTime(time)) {
		return "Invalid time";
	}

	// The cron-parser package doesn't accept a timezone in the cron string, but
	// accepts it as an option.
	const cron = timeToCron(time);
	const parsed = cronParser.parseExpression(cron, {
		currentDate: now,
		iterator: false,
		utc: false,
		tz,
	});

	const today = dayjs(now).tz(tz);
	const day = dayjs(parsed.next().toDate()).tz(tz);

	const formattedTime = new Intl.DateTimeFormat(browserLocale, {
		hour: "numeric",
		minute: "numeric",
		timeZone: tz,
	}).format(day.toDate());

	let display = formattedTime;

	if (day.isSame(today, "day")) {
		display += " today";
	} else if (day.isSame(today.add(1, "day"), "day")) {
		display += " tomorrow";
	} else {
		// This case will rarely ever be hit, as we're dealing with only times and
		// not dates, but it can be hit due to mismatched browser timezone to cron
		// timezone or due to daylight savings changes.
		display += ` on ${day.format("dddd, MMMM D")}`;
	}

	display += ` (${day.from(today)}) in ${tz}`;

	return display;
};

export type TemplateAutostartRequirementDaysValue =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export type TemplateAutostopRequirementDaysValue =
	| "off"
	| "daily"
	| "saturday"
	| "sunday";

export const sortedDays = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as TemplateAutostartRequirementDaysValue[];

export const calculateAutostopRequirementDaysValue = (
	value: TemplateAutostopRequirementDaysValue,
): Template["autostop_requirement"]["days_of_week"] => {
	switch (value) {
		case "daily":
			return [
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
				"sunday",
			];
		case "saturday":
			return ["saturday"];
		case "sunday":
			return ["sunday"];
	}

	return [];
};
