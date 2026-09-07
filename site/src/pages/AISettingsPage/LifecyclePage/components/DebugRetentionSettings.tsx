import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type * as TypesGen from "#/api/typesGenerated";
import { DefaultChatDebugRetentionDays } from "#/api/typesGenerated";
import { useTemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";
import { i18n } from "#/i18n";
import { DaysField, LifecycleSettingLayout } from "./LifecycleSettingLayout";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface DebugRetentionSettingsProps {
	debugRetentionDaysData: TypesGen.ChatDebugRetentionDaysResponse | undefined;
	isDebugRetentionDaysLoading: boolean;
	isDebugRetentionDaysLoadError: boolean;
	onSaveDebugRetentionDays: (
		req: TypesGen.UpdateChatDebugRetentionDaysRequest,
		options?: MutationCallbacks,
	) => void;
	isSavingDebugRetentionDays: boolean;
	isSaveDebugRetentionDaysError: boolean;
}

// Keep in sync with chatDebugRetentionDaysMaximum in coderd/exp_chats.go.
const DAYS_MIN = 1;
const DAYS_MAX = 3650;

const validationSchema = Yup.object({
	enabled: Yup.boolean().required(),
	debug_retention_days: Yup.number().when("enabled", {
		is: true,
		then: (schema) =>
			schema
				.integer(
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.DebugRetentionSettings.debug_retention_days_must_be_a_whole_number_12a7f64e",
					),
				)
				.min(
					DAYS_MIN,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.DebugRetentionSettings.debug_retention_period_must_be_at_least_1_day_db98b46a",
					),
				)
				.max(
					DAYS_MAX,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.DebugRetentionSettings.must_not_exceed_3650_days_10_years_24a2a467",
					),
				)
				.required(
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.DebugRetentionSettings.debug_retention_days_is_required_b13f4bec",
					),
				),
	}),
});

export const DebugRetentionSettings: FC<DebugRetentionSettingsProps> = ({
	debugRetentionDaysData,
	isDebugRetentionDaysLoading,
	isDebugRetentionDaysLoadError,
	onSaveDebugRetentionDays,
	isSavingDebugRetentionDays,
	isSaveDebugRetentionDaysError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSavedVisible, showSavedState } = useTemporarySavedState();
	const serverDebugRetentionDays =
		debugRetentionDaysData?.debug_retention_days ??
		DefaultChatDebugRetentionDays;

	const form = useFormik({
		initialValues: {
			enabled: serverDebugRetentionDays > 0,
			debug_retention_days:
				serverDebugRetentionDays > 0
					? serverDebugRetentionDays
					: DefaultChatDebugRetentionDays,
		},
		enableReinitialize: true,
		validationSchema,
		onSubmit: (values, helpers) => {
			onSaveDebugRetentionDays(
				{
					debug_retention_days: values.enabled
						? values.debug_retention_days
						: 0,
				},
				{
					onSuccess: () => {
						showSavedState();
						helpers.resetForm({ values });
					},
				},
			);
		},
	});

	const fieldError = form.errors.debug_retention_days;
	const hasError =
		(Boolean(fieldError) && Boolean(form.touched.debug_retention_days)) ||
		isSaveDebugRetentionDaysError ||
		isDebugRetentionDaysLoadError;

	return (
		<LifecycleSettingLayout
			title={tI18n(
				"AISettingsPage.LifecyclePage.components.DebugRetentionSettings.chat_debug_data_retention_ac2dd81f",
			)}
			description={tI18n(
				"AISettingsPage.LifecyclePage.components.DebugRetentionSettings.chat_debug_runs_and_debug_steps_older_than_this__26b395c6",
			)}
			checked={form.values.enabled}
			onCheckedChange={(checked) => void form.setFieldValue("enabled", checked)}
			switchLabel={tI18n(
				"AISettingsPage.LifecyclePage.components.DebugRetentionSettings.enable_chat_debug_data_retention_0d931458",
			)}
			disabled={isSavingDebugRetentionDays || isDebugRetentionDaysLoading}
			showSave={form.dirty}
			isSaving={isSavingDebugRetentionDays}
			isSavedVisible={isSavedVisible}
			saveDisabled={
				isSavingDebugRetentionDays || !form.dirty || Boolean(fieldError)
			}
			onSubmit={form.handleSubmit}
			error={
				hasError ? (
					<>
						{fieldError && form.touched.debug_retention_days && (
							<p className="m-0">{fieldError}</p>
						)}
						{isSaveDebugRetentionDaysError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.DebugRetentionSettings.failed_to_save_chat_debug_retention_setting_614a1f12",
								)}
							</p>
						)}
						{isDebugRetentionDaysLoadError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.DebugRetentionSettings.failed_to_load_chat_debug_retention_setting_0d80c48e",
								)}
							</p>
						)}
					</>
				) : undefined
			}
		>
			<DaysField
				name="debug_retention_days"
				value={form.values.debug_retention_days}
				onChange={form.handleChange}
				onBlur={form.handleBlur}
				label={tI18n(
					"AISettingsPage.LifecyclePage.components.DebugRetentionSettings.chat_debug_data_retention_period_in_days_3fd121cc",
				)}
				disabled={
					!form.values.enabled ||
					isSavingDebugRetentionDays ||
					isDebugRetentionDaysLoading
				}
				error={Boolean(fieldError)}
				min={DAYS_MIN}
				max={DAYS_MAX}
			/>
		</LifecycleSettingLayout>
	);
};
