import { useTranslation } from "react-i18next";
import { humanDuration } from "#/utils/time";

const hours = (h: number) => (h === 1 ? "hour" : "hours");

export const DefaultTTLHelperText = (props: { ttl?: number }) => {
	const { t: tI18n } = useTranslation("templates");

	const { ttl = 0 } = props;

	// Error will show once field is considered touched
	if (ttl < 0) {
		return null;
	}

	if (ttl === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.workspaces_will_run_until_stopped_manually_8ed199e7",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.workspaces_will_default_to_stopping_after_3fe57255",
			)}
			{ttl} {hours(ttl)}
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.after_being_started_d7458552",
			)}
		</span>
	);
};

export const ActivityBumpHelperText = (props: {
	bump?: number;
	defaultTTL?: number;
	allowUserAutostop?: boolean;
}) => {
	const { t: tI18n } = useTranslation("templates");

	const { bump = 0, defaultTTL = 0, allowUserAutostop = false } = props;

	// Activity bump extends a workspace's scheduled stop time. If there is no
	// default TTL AND users cannot set their own autostop, there is no stop
	// time to bump, so the field has no effect.
	if (!defaultTTL && !allowUserAutostop) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.activity_bump_only_applies_when_default_autostop_dafa661c",
				)}
			</span>
		);
	}

	// Error will show once field is considered touched
	if (bump < 0) {
		return null;
	}

	if (bump === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.workspaces_will_not_have_their_stop_time_automat_6825f13d",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.workspaces_will_be_automatically_bumped_by_e5be9c3a",
			)}
			{bump} {hours(bump)}
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.when_user_activity_is_detected_43e68aee",
			)}
		</span>
	);
};

export const AutostopReminderHelperText = (props: {
	lead?: number;
	defaultTTL?: number;
	autostopRequirementDaysOfWeek?: string;
	allowUserAutostop?: boolean;
}) => {
	const { t: tI18n } = useTranslation("templates");

	const {
		lead = 0,
		defaultTTL = 0,
		autostopRequirementDaysOfWeek,
		allowUserAutostop = false,
	} = props;

	const hasAutostopRequirement =
		Boolean(autostopRequirementDaysOfWeek) &&
		autostopRequirementDaysOfWeek !== "off";

	// Autostop reminders fire relative to a workspace's scheduled stop, so
	// this hint only makes sense when none of the sources of a stop deadline
	// (default TTL, autostop requirement, or user-configured autostop) are
	// available.
	if (!defaultTTL && !hasAutostopRequirement && !allowUserAutostop) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.autostop_reminders_only_apply_when_an_autostop_d_8c2129a8",
				)}
			</span>
		);
	}

	// Error will show once field is considered touched
	if (lead < 0) {
		return null;
	}

	if (lead === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.workspace_owners_will_not_be_reminded_before_the_4fae1101",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.workspace_owners_will_be_reminded_a8f79f43",
			)}
			{lead} {hours(lead)}
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.before_their_workspace_is_automatically_stopped_c298f2e2",
			)}
		</span>
	);
};

export const FailureTTLHelperText = (props: { ttl?: number }) => {
	const { t: tI18n } = useTranslation("templates");

	const { ttl = 0 } = props;

	// Error will show once field is considered touched
	if (ttl < 0) {
		return null;
	}

	if (ttl === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.coder_will_not_automatically_stop_failed_workspa_6c55a743",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.coder_will_attempt_to_stop_failed_workspaces_aft_4b9493bd",
			)}
			{humanDuration(ttl)}.
		</span>
	);
};

export const DormancyTTLHelperText = (props: { ttl?: number }) => {
	const { t: tI18n } = useTranslation("templates");

	const { ttl = 0 } = props;

	// Error will show once field is considered touched
	if (ttl < 0) {
		return null;
	}

	if (ttl === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.coder_will_not_mark_workspaces_as_dormant_9d4fc780",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.coder_will_mark_workspaces_as_dormant_after_9b630b5f",
			)}
			{humanDuration(ttl)}
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.without_user_connections_cb7aa85e",
			)}
		</span>
	);
};

export const DormancyAutoDeletionTTLHelperText = (props: { ttl?: number }) => {
	const { t: tI18n } = useTranslation("templates");

	const { ttl = 0 } = props;

	// Error will show once field is considered touched
	if (ttl < 0) {
		return null;
	}

	if (ttl === 0) {
		return (
			<span>
				{tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.coder_will_not_automatically_delete_dormant_work_bebbb6a5",
				)}
			</span>
		);
	}

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateSchedulePage.TTLHelperText.coder_will_automatically_delete_dormant_workspac_63f9e066",
			)}{" "}
			{humanDuration(ttl)}.
		</span>
	);
};
