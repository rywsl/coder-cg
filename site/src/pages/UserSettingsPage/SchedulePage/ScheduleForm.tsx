import { type FormikContextType, useFormik } from "formik";
import { type FC, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type {
	UpdateUserQuietHoursScheduleRequest,
	UserQuietHoursScheduleResponse,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { Form, FormFields } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { Label } from "#/components/Label/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { currentIntlLocale } from "#/i18n/locale";
import { getFormHelpers } from "#/utils/formUtils";
import { quietHoursDisplay, timeToCron, validTime } from "#/utils/schedule";
import { getPreferredTimezone, timeZones } from "#/utils/timeZones";

interface ScheduleFormValues {
	time: string;
	timezone: string;
}

const validationSchema = Yup.object({
	time: Yup.string()
		.ensure()
		.test(
			"is-time-string",
			i18n.t(
				"users:UserSettingsPage.SchedulePage.ScheduleForm.time_must_be_in_hh_mm_format_b252adb4",
			),
			(value) => {
				if (!validTime(value)) {
					return false;
				}
				const parts = value.split(":");
				const HH = Number(parts[0]);
				const mm = Number(parts[1]);
				return HH >= 0 && HH <= 23 && mm >= 0 && mm <= 59;
			},
		),
	timezone: Yup.string().required(),
});

interface ScheduleFormProps {
	isLoading: boolean;
	initialValues: UserQuietHoursScheduleResponse;
	submitError: unknown;
	onSubmit: (data: UpdateUserQuietHoursScheduleRequest) => void;
	// now can be set to force the time used for "Next occurrence" in tests.
	now?: Date;
}

export const ScheduleForm: FC<ScheduleFormProps> = ({
	isLoading,
	initialValues,
	submitError,
	onSubmit,
	now,
}) => {
	const { t: tI18n } = useTranslation("users");

	// Update every 15 seconds to update the "Next occurrence" field.
	const [, setTime] = useState<number>(Date.now());
	useEffect(() => {
		const interval = setInterval(() => setTime(Date.now()), 15000);
		return () => {
			clearInterval(interval);
		};
	}, []);

	// If the user has a custom schedule, use that as the initial values.
	// Otherwise, use the default time, with their local timezone.
	const formInitialValues = { ...initialValues };
	if (!initialValues.user_set) {
		formInitialValues.timezone = getPreferredTimezone();
	}

	const form: FormikContextType<ScheduleFormValues> =
		useFormik<ScheduleFormValues>({
			initialValues: formInitialValues,
			validationSchema,
			onSubmit: (values) => {
				onSubmit({
					schedule: timeToCron(values.time, values.timezone),
				});
			},
		});
	const getFieldHelpers = getFormHelpers<ScheduleFormValues>(form, submitError);
	const browserLocale = currentIntlLocale();
	const timezoneId = useId();
	const timezoneField = getFieldHelpers("timezone");
	const fieldsDisabled = isLoading || !initialValues.user_can_set;

	return (
		<Form onSubmit={form.handleSubmit}>
			<FormFields>
				{Boolean(submitError) && <ErrorAlert error={submitError} />}

				{!initialValues.user_set && (
					<Alert severity="info">
						{tI18n(
							"UserSettingsPage.SchedulePage.ScheduleForm.you_are_currently_using_the_default_quiet_hours__7d57eaf8",
						)}
						<code>{initialValues.time}</code>
						{tI18n("UserSettingsPage.SchedulePage.ScheduleForm.in_8f6b9ac6")}{" "}
						<code>{initialValues.timezone}</code>.
					</Alert>
				)}

				{!initialValues.user_can_set && (
					<Alert severity="error">
						{tI18n(
							"UserSettingsPage.SchedulePage.ScheduleForm.your_administrator_has_disabled_the_ability_to_s_008a0665",
						)}
					</Alert>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
					<FormField
						field={getFieldHelpers("time")}
						label={tI18n(
							"UserSettingsPage.SchedulePage.ScheduleForm.start_time_babe9dda",
						)}
						type="time"
						disabled={fieldsDisabled}
						className="relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
					/>
					<div className="flex flex-col gap-2 min-w-0">
						<Label htmlFor={timezoneId}>
							{tI18n(
								"UserSettingsPage.SchedulePage.ScheduleForm.timezone_4ceca1d5",
							)}
						</Label>
						<Select
							value={form.values.timezone}
							onValueChange={(value) => {
								void form.setFieldValue("timezone", value);
							}}
							disabled={fieldsDisabled}
						>
							<SelectTrigger id={timezoneId}>
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
					<div className="sm:col-span-2">
						<FormField
							field={{
								name: "nextOccurrence",
								id: "nextOccurrence",
								value: quietHoursDisplay(
									browserLocale,
									form.values.time,
									form.values.timezone,
									now,
								),
								onChange: () => {},
								onBlur: () => {},
								error: false,
							}}
							label={tI18n(
								"UserSettingsPage.SchedulePage.ScheduleForm.next_occurrence_21781551",
							)}
							disabled
						/>
					</div>
				</div>

				<div className="flex justify-end">
					<Button disabled={fieldsDisabled} type="submit">
						<Spinner loading={isLoading} />
						{tI18n(
							"UserSettingsPage.SchedulePage.ScheduleForm.update_schedule_0c968349",
						)}
					</Button>
				</div>
			</FormFields>
		</Form>
	);
};
