import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { type FormikTouched, useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type { Template } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import {
	FormFields,
	FormFooter,
	FormSection,
	HorizontalForm,
} from "#/components/Form/Form";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import { Switch } from "#/components/Switch/Switch";
import { i18n } from "#/i18n";
import {
	defaultSchedule,
	emptySchedule,
} from "#/pages/WorkspaceSettingsPage/WorkspaceSchedulePage/schedule";
import { getFormHelpers } from "#/utils/formUtils";
import { humanDuration } from "#/utils/time";
import { timeZones } from "#/utils/timeZones";

// Need dayjs.tz functions for timezone validation
dayjs.extend(timezone);

export interface WorkspaceScheduleFormProps {
	template: Template;
	error?: unknown;
	initialValues: WorkspaceScheduleFormValues;
	isLoading: boolean;
	onCancel: () => void;
	onSubmit: (values: WorkspaceScheduleFormValues) => void;
	// for storybook
	initialTouched?: FormikTouched<WorkspaceScheduleFormValues>;
	defaultTTL: number;
}

export interface WorkspaceScheduleFormValues {
	autostartEnabled: boolean;
	sunday: boolean;
	monday: boolean;
	tuesday: boolean;
	wednesday: boolean;
	thursday: boolean;
	friday: boolean;
	saturday: boolean;
	startTime: string;
	timezone: string;
	autostopEnabled: boolean;
	ttl: number;
}

export const validationSchema = Yup.object({
	sunday: Yup.boolean(),
	monday: Yup.boolean().test(
		"at-least-one-day",
		i18n.t(
			"workspaces:WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.must_set_at_least_one_day_of_week_if_autostart_i_3e48952d",
		),
		function (value) {
			const parent = this.parent as WorkspaceScheduleFormValues;

			if (!parent.autostartEnabled) {
				return true;
			}

			// Ensure at least one day is enabled
			return [
				parent.sunday,
				value,
				parent.tuesday,
				parent.wednesday,
				parent.thursday,
				parent.friday,
				parent.saturday,
			].some((day) => day);
		},
	),
	tuesday: Yup.boolean(),
	wednesday: Yup.boolean(),
	thursday: Yup.boolean(),
	friday: Yup.boolean(),
	saturday: Yup.boolean(),

	startTime: Yup.string()
		.ensure()
		.test(
			"required-if-autostart",
			i18n.t(
				"workspaces:WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.start_time_is_required_when_autostart_is_enabled_b49388bf",
			),
			function (value) {
				const parent = this.parent as WorkspaceScheduleFormValues;
				if (parent.autostartEnabled) {
					return value !== "";
				}
				return true;
			},
		)
		.test(
			"is-time-string",
			i18n.t(
				"workspaces:WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.time_must_be_in_hh_mm_format_b252adb4",
			),
			(value) => {
				if (value === "") {
					return true;
				}
				if (!/^[0-9][0-9]:[0-9][0-9]$/.test(value)) {
					return false;
				}
				const parts = value.split(":");
				const HH = Number(parts[0]);
				const mm = Number(parts[1]);
				return HH >= 0 && HH <= 23 && mm >= 0 && mm <= 59;
			},
		),
	timezone: Yup.string()
		.ensure()
		.test(
			"is-timezone",
			i18n.t(
				"workspaces:WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.invalid_timezone_453e495c",
			),
			function (value) {
				const parent = this.parent as WorkspaceScheduleFormValues;

				if (!parent.startTime) {
					return true;
				}
				// Unfortunately, there's not a good API on dayjs at this time for
				// evaluating a timezone. Attempt to parse today in the supplied timezone
				// and return as valid if the function doesn't throw.
				// Need to use dayjs.tz directly here as our utility functions don't expose validation
				try {
					dayjs.tz(dayjs(), value);
					return true;
				} catch {
					return false;
				}
			},
		),
	ttl: Yup.number()
		.min(0)
		.max(
			24 * 30,
			i18n.t(
				"workspaces:WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.please_enter_a_limit_that_is_less_than_or_equal__6f7e6ac3",
			),
		)
		.test(
			"positive-if-autostop",
			i18n.t(
				"workspaces:WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.time_until_shutdown_must_be_greater_than_zero_wh_01be5f8a",
			),
			function (value) {
				const parent = this.parent as WorkspaceScheduleFormValues;
				if (parent.autostopEnabled) {
					return Boolean(value);
				}
				return true;
			},
		),
});

export const WorkspaceScheduleForm: FC<WorkspaceScheduleFormProps> = ({
	error,
	initialValues,
	isLoading,
	onCancel,
	onSubmit,
	initialTouched,
	defaultTTL,
	template,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const form = useFormik<WorkspaceScheduleFormValues>({
		initialValues,
		onSubmit,
		validationSchema,
		initialTouched,
		enableReinitialize: true,
	});
	const formHelpers = getFormHelpers<WorkspaceScheduleFormValues>(form, error);

	const checkboxes: Array<{ value: boolean; name: string; label: string }> = [
		{
			value: form.values.monday,
			name: "monday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.mon_f40d7f51",
			),
		},
		{
			value: form.values.tuesday,
			name: "tuesday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.tue_d1eb39b0",
			),
		},
		{
			value: form.values.wednesday,
			name: "wednesday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.wed_58339f45",
			),
		},
		{
			value: form.values.thursday,
			name: "thursday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.thu_7da11212",
			),
		},
		{
			value: form.values.friday,
			name: "friday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.fri_66dab40c",
			),
		},
		{
			value: form.values.saturday,
			name: "saturday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.sat_fdeb71b5",
			),
		},
		{
			value: form.values.sunday,
			name: "sunday",
			label: tI18n(
				"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.sun_db18f17f",
			),
		},
	];

	const startTimeField = formHelpers("startTime");
	const timezoneField = formHelpers("timezone");
	const ttlField = formHelpers("ttl", {
		helperText: ttlShutdownAt(form.values.ttl),
		backendFieldName: "ttl_ms",
	});

	const autostartDisabled =
		isLoading ||
		!template.allow_user_autostart ||
		!form.values.autostartEnabled;

	const autostopDisabled =
		isLoading || !template.allow_user_autostop || !form.values.autostopEnabled;

	return (
		<HorizontalForm onSubmit={form.handleSubmit}>
			<FormSection
				title={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.autostart_5a6ab379",
				)}
				description={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.select_the_time_and_days_of_week_on_which_you_wa_1c2129b9",
				)}
			>
				<FormFields>
					<div className="flex items-center gap-3">
						<Switch
							id="autostartEnabled"
							disabled={!template.allow_user_autostart}
							checked={form.values.autostartEnabled}
							onCheckedChange={(checked) => {
								void form.setValues({
									...form.values,
									autostartEnabled: checked,
									...(checked ? defaultSchedule() : emptySchedule),
								});
							}}
						/>
						<div className="flex flex-col">
							<Label
								htmlFor="autostartEnabled"
								className="font-medium cursor-pointer"
							>
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.enable_autostart_881396f0",
								)}
							</Label>
							{!template.allow_user_autostart && (
								<span className="text-xs text-content-secondary mt-0.5">
									{tI18n(
										"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.the_template_for_this_workspace_does_not_allow_m_df83b5c7",
									)}
								</span>
							)}
						</div>
					</div>

					<div className="flex gap-4">
						<div className="flex flex-col gap-2 flex-1">
							<Label htmlFor="startTime">
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.start_time_babe9dda",
								)}
							</Label>
							<Input
								id="startTime"
								name="startTime"
								type="time"
								disabled={autostartDisabled}
								value={startTimeField.value ?? ""}
								onChange={startTimeField.onChange}
								onBlur={startTimeField.onBlur}
								aria-invalid={startTimeField.error}
							/>
							{startTimeField.error && (
								<span className="text-xs text-content-destructive">
									{startTimeField.helperText}
								</span>
							)}
						</div>
						<div className="flex flex-col gap-2 flex-1">
							<Label htmlFor="timezone">
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.timezone_4ceca1d5",
								)}
							</Label>
							<Select
								value={form.values.timezone}
								onValueChange={(value) => {
									void form.setFieldValue("timezone", value);
								}}
								disabled={autostartDisabled}
							>
								<SelectTrigger id="timezone">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{timeZones.map((zone) => (
										<SelectItem key={zone} value={zone}>
											{zone}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{timezoneField.error && (
								<span className="text-xs text-content-destructive">
									{timezoneField.helperText}
								</span>
							)}
						</div>
					</div>

					<fieldset className="border-0 p-0 m-0">
						<legend className="text-xs text-content-secondary font-medium mb-1">
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.days_of_week_94a1985c",
							)}
						</legend>

						<div className="flex flex-row flex-wrap gap-x-4 gap-y-2 pt-1">
							{checkboxes.map((checkbox) => (
								<div key={checkbox.name} className="flex items-center gap-2">
									<Checkbox
										id={checkbox.name}
										checked={checkbox.value}
										disabled={
											isLoading ||
											!template.allow_user_autostart ||
											!template.autostart_requirement.days_of_week.includes(
												checkbox.name,
											) ||
											!form.values.autostartEnabled
										}
										onCheckedChange={(checked) => {
											void form.setFieldValue(checkbox.name, Boolean(checked));
										}}
									/>
									<Label htmlFor={checkbox.name} className="cursor-pointer">
										{checkbox.label}
									</Label>
								</div>
							))}
						</div>

						{form.errors.monday && (
							<span className="text-xs text-content-destructive mt-1 block">
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.must_set_at_least_one_day_of_week_if_autostart_i_3e48952d",
								)}
							</span>
						)}
					</fieldset>
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.autostop_f7816a97",
				)}
				description={
					<>
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.set_how_many_hours_should_elapse_after_the_works_0917b4b4",
						)}{" "}
						{humanDuration(template.activity_bump_ms)}
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.after_last_activity_in_the_workspace_was_detecte_c6b73c06",
						)}
					</>
				}
			>
				<FormFields>
					<div className="flex items-center gap-3">
						<Switch
							id="autostopEnabled"
							checked={form.values.autostopEnabled}
							onCheckedChange={(checked) => {
								void form.setValues({
									...form.values,
									autostopEnabled: checked,
									ttl: checked ? defaultTTL : 0,
								});
							}}
							disabled={!template.allow_user_autostop}
						/>
						<div className="flex flex-col">
							<Label
								htmlFor="autostopEnabled"
								className="font-medium cursor-pointer"
							>
								{tI18n(
									"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.enable_autostop_251ac4fd",
								)}
							</Label>
							{!template.allow_user_autostop && (
								<span className="text-xs text-content-secondary mt-0.5">
									{tI18n(
										"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.the_template_for_this_workspace_does_not_allow_m_8e0a5c14",
									)}
								</span>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="ttl">
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.time_until_shutdown_hours_0f1e4fb1",
							)}
						</Label>
						<Input
							id="ttl"
							name="ttl"
							type="number"
							disabled={autostopDisabled}
							min={0}
							step="any"
							value={ttlField.value ?? ""}
							onChange={ttlField.onChange}
							onBlur={ttlField.onBlur}
							aria-invalid={ttlField.error}
						/>
						{ttlField.helperText && (
							<span
								className={
									ttlField.error
										? "text-xs text-content-destructive"
										: "text-xs text-content-secondary"
								}
							>
								{ttlField.helperText}
							</span>
						)}
					</div>
				</FormFields>
			</FormSection>
			<FormFooter>
				<Button onClick={onCancel} variant="outline">
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.cancel_19766ed6",
					)}
				</Button>

				<Button
					type="submit"
					disabled={
						isLoading ||
						(!template.allow_user_autostart && !template.allow_user_autostop)
					}
				>
					<Spinner loading={isLoading} />
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceScheduleForm.save_1509f561",
					)}
				</Button>
			</FormFooter>
		</HorizontalForm>
	);
};

export const ttlShutdownAt = (formTTL: number): string => {
	if (formTTL === 0) {
		// Passing an empty value for TTL in the form results in a number that is not zero but less than 1.
		return "Your workspace will not automatically shut down.";
	}

	try {
		return `Your workspace will shut down ${humanDuration(formTTL * 60 * 60 * 1000)} after its next start.`;
	} catch (e) {
		if (e instanceof RangeError) {
			return "Please enter a limit that is less than or equal to 30 days (720 hours).";
		}
		throw e;
	}
};
