import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type * as TypesGen from "#/api/typesGenerated";
import { useTemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";
import { i18n } from "#/i18n";
import { DaysField, LifecycleSettingLayout } from "./LifecycleSettingLayout";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface RetentionPeriodSettingsProps {
	retentionDaysData: TypesGen.ChatRetentionDaysResponse | undefined;
	isRetentionDaysLoading: boolean;
	isRetentionDaysLoadError: boolean;
	onSaveRetentionDays: (
		req: TypesGen.UpdateChatRetentionDaysRequest,
		options?: MutationCallbacks,
	) => void;
	isSavingRetentionDays: boolean;
	isSaveRetentionDaysError: boolean;
}

// Keep in sync with retentionDaysMaximum in coderd/exp_chats.go.
const DAYS_MIN = 1;
const DAYS_MAX = 3650;
// Matches SQL COALESCE default in GetChatRetentionDays.
const DEFAULT_RETENTION_DAYS = 30;

const validationSchema = Yup.object({
	enabled: Yup.boolean().required(),
	retention_days: Yup.number().when("enabled", {
		is: true,
		then: (schema) =>
			schema
				.integer(
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.retention_days_must_be_a_whole_number_e4c7dda5",
					),
				)
				.min(
					DAYS_MIN,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.retention_period_must_be_at_least_1_day_3c742f9f",
					),
				)
				.max(
					DAYS_MAX,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.must_not_exceed_3650_days_10_years_24a2a467",
					),
				)
				.required(
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.retention_days_is_required_54e4b62f",
					),
				),
	}),
});

export const RetentionPeriodSettings: FC<RetentionPeriodSettingsProps> = ({
	retentionDaysData,
	isRetentionDaysLoading,
	isRetentionDaysLoadError,
	onSaveRetentionDays,
	isSavingRetentionDays,
	isSaveRetentionDaysError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSavedVisible, showSavedState } = useTemporarySavedState();
	const serverRetentionDays =
		retentionDaysData?.retention_days ?? DEFAULT_RETENTION_DAYS;

	const form = useFormik({
		initialValues: {
			enabled: serverRetentionDays > 0,
			retention_days:
				serverRetentionDays > 0 ? serverRetentionDays : DEFAULT_RETENTION_DAYS,
		},
		enableReinitialize: true,
		validationSchema,
		onSubmit: (values, helpers) => {
			onSaveRetentionDays(
				{ retention_days: values.enabled ? values.retention_days : 0 },
				{
					onSuccess: () => {
						showSavedState();
						helpers.resetForm({ values });
					},
				},
			);
		},
	});

	const fieldError = form.errors.retention_days;
	const hasError =
		(Boolean(fieldError) && Boolean(form.touched.retention_days)) ||
		isSaveRetentionDaysError ||
		isRetentionDaysLoadError;

	return (
		<LifecycleSettingLayout
			title={tI18n(
				"AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.conversation_retention_period_f5a5632b",
			)}
			description={tI18n(
				"AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.archived_conversations_and_orphaned_files_older__75aa6cd5",
			)}
			checked={form.values.enabled}
			onCheckedChange={(checked) => void form.setFieldValue("enabled", checked)}
			switchLabel={tI18n(
				"AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.enable_conversation_retention_62a8a6e9",
			)}
			disabled={isSavingRetentionDays || isRetentionDaysLoading}
			showSave={form.dirty}
			isSaving={isSavingRetentionDays}
			isSavedVisible={isSavedVisible}
			saveDisabled={isSavingRetentionDays || !form.dirty || Boolean(fieldError)}
			onSubmit={form.handleSubmit}
			error={
				hasError ? (
					<>
						{fieldError && form.touched.retention_days && (
							<p className="m-0">{fieldError}</p>
						)}
						{isSaveRetentionDaysError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.failed_to_save_conversation_retention_setting_d8ae5eab",
								)}
							</p>
						)}
						{isRetentionDaysLoadError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.failed_to_load_conversation_retention_setting_4a2b8aa8",
								)}
							</p>
						)}
					</>
				) : undefined
			}
		>
			<DaysField
				name="retention_days"
				value={form.values.retention_days}
				onChange={form.handleChange}
				onBlur={form.handleBlur}
				label={tI18n(
					"AISettingsPage.LifecyclePage.components.RetentionPeriodSettings.conversation_retention_period_in_days_e8fc415f",
				)}
				disabled={
					!form.values.enabled ||
					isSavingRetentionDays ||
					isRetentionDaysLoading
				}
				error={Boolean(fieldError)}
				min={DAYS_MIN}
				max={DAYS_MAX}
			/>
		</LifecycleSettingLayout>
	);
};
