import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Template } from "#/api/typesGenerated";
import { i18n } from "#/i18n";
import type { TemplateAutostopRequirementDaysValue } from "#/utils/schedule";

const autostopRequirementDescriptions = {
	off: i18n.t(
		"templates:TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.workspaces_are_not_required_to_stop_periodically_7982b248",
	),
	daily: i18n.t(
		"templates:TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.workspaces_are_required_to_be_automatically_stop_716bcd99",
	),
	saturday: i18n.t(
		"templates:TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.workspaces_are_required_to_be_automatically_stop_ced12b70",
	),
	sunday: i18n.t(
		"templates:TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.workspaces_are_required_to_be_automatically_stop_556ff9b0",
	),
};

export const convertAutostopRequirementDaysValue = (
	days: Template["autostop_requirement"]["days_of_week"],
): TemplateAutostopRequirementDaysValue => {
	if (days.length === 7) {
		return "daily";
	}

	if (days.length === 1 && days[0] === "saturday") {
		return "saturday";
	}

	if (days.length === 1 && days[0] === "sunday") {
		return "sunday";
	}

	// On unsupported values we default to "off".
	return "off";
};

interface AutostopRequirementDaysHelperTextProps {
	days: TemplateAutostopRequirementDaysValue;
}

export const AutostopRequirementDaysHelperText: FC<
	AutostopRequirementDaysHelperTextProps
> = ({ days = "off" }) => {
	return <span>{autostopRequirementDescriptions[days]}</span>;
};

interface AutostopRequirementWeeksHelperTextProps {
	days: TemplateAutostopRequirementDaysValue;
	weeks: number;
}

export const AutostopRequirementWeeksHelperText: FC<
	AutostopRequirementWeeksHelperTextProps
> = ({ days, weeks }) => {
	const { t: tI18n } = useTranslation("templates");

	// Disabled
	if (days !== "saturday" && days !== "sunday") {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.weeks_between_required_stops_cannot_be_set_unles_ae2ca2f8",
				)}
			</span>
		);
	}

	if (weeks <= 1) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.workspaces_are_required_to_be_automatically_stop_29bbb6d6",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.workspaces_are_required_to_be_automatically_stop_4b78f718",
			)}
			{weeks}
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.AutostopRequirementHelperText.weeks_on_the_specified_day_in_the_user_s_quiet_h_e35d73a1",
			)}
		</span>
	);
};
