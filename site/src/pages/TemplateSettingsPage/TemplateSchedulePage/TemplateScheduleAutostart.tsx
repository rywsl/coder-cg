import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import {
	sortedDays,
	type TemplateAutostartRequirementDaysValue,
} from "#/utils/schedule";

interface TemplateScheduleAutostartProps {
	enabled: boolean;
	value: TemplateAutostartRequirementDaysValue[];
	isSubmitting: boolean;
	onChange: (value: TemplateAutostartRequirementDaysValue[]) => void;
}

export const TemplateScheduleAutostart: FC<TemplateScheduleAutostartProps> = ({
	value,
	isSubmitting,
	enabled,
	onChange,
}) => {
	return (
		<div className="flex flex-col gap-2 items-start">
			<div className="flex flex-row items-baseline justify-center w-full gap-0.5">
				{(
					[
						{ value: "monday", key: "Mon" },
						{ value: "tuesday", key: "Tue" },
						{ value: "wednesday", key: "Wed" },
						{ value: "thursday", key: "Thu" },
						{ value: "friday", key: "Fri" },
						{ value: "saturday", key: "Sat" },
						{ value: "sunday", key: "Sun" },
					] as {
						value: TemplateAutostartRequirementDaysValue;
						key: string;
					}[]
				).map((day) => (
					<Button
						variant="outline"
						// TODO: Adding a background color would also help
						className={`flex-1 rounded-none ${value.includes(day.value) ? "text-content-primary bg-surface-tertiary" : "text-content-secondary"}`}
						key={day.key}
						disabled={isSubmitting || !enabled}
						onClick={() => {
							if (!value.includes(day.value)) {
								onChange(value.concat(day.value));
							} else {
								onChange(value.filter((obj) => obj !== day.value));
							}
						}}
					>
						{day.key}
					</Button>
				))}
			</div>
			<div className="text-xs text-content-secondary">
				<AutostartHelperText allowed={enabled} days={value} />
			</div>
		</div>
	);
};

interface AutostartHelperTextProps {
	allowed?: boolean;
	days: TemplateAutostartRequirementDaysValue[];
}

const AutostartHelperText: FC<AutostartHelperTextProps> = ({
	allowed,
	days: unsortedDays,
}) => {
	const { t: tI18n } = useTranslation("templates");

	if (!allowed) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TemplateScheduleAutostart.workspaces_are_not_allowed_to_auto_start_9470dad4",
				)}
			</span>
		);
	}

	const days = new Set(unsortedDays);

	if (days.size === 7) {
		// If every day is allowed, no more explaining is needed.
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TemplateScheduleAutostart.workspaces_are_allowed_to_auto_start_on_any_day_f7455434",
				)}
			</span>
		);
	}
	if (days.size === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TemplateScheduleAutostart.workspaces_will_never_auto_start_this_is_effecti_46145a80",
				)}
			</span>
		);
	}

	let daymsg = "Workspaces will never auto start on the weekends.";
	if (days.size !== 5 || days.has("saturday") || days.has("sunday")) {
		daymsg = `Workspaces can autostart on ${sortedDays
			.filter((day) => days.has(day))
			.join(", ")}.`;
	}

	return (
		<span>
			{daymsg}
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TemplateScheduleAutostart.these_days_are_relative_to_the_user_s_timezone_749c43a4",
			)}
		</span>
	);
};
