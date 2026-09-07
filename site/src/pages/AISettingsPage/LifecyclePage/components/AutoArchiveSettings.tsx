import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type * as TypesGen from "#/api/typesGenerated";
import { DefaultChatAutoArchiveDays } from "#/api/typesGenerated";
import { useTemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";
import { i18n } from "#/i18n";
import { DaysField, LifecycleSettingLayout } from "./LifecycleSettingLayout";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface AutoArchiveSettingsProps {
	autoArchiveDaysData: TypesGen.ChatAutoArchiveDaysResponse | undefined;
	isAutoArchiveDaysLoading: boolean;
	isAutoArchiveDaysLoadError: boolean;
	onSaveAutoArchiveDays: (
		req: TypesGen.UpdateChatAutoArchiveDaysRequest,
		options?: MutationCallbacks,
	) => void;
	isSavingAutoArchiveDays: boolean;
	isSaveAutoArchiveDaysError: boolean;
}

// Keep in sync with autoArchiveDaysMaximum in coderd/exp_chats.go.
const DAYS_MIN = 1;
const DAYS_MAX = 3650;
const ENABLE_DEFAULT_DAYS = 90;

const validationSchema = Yup.object({
	enabled: Yup.boolean().required(),
	auto_archive_days: Yup.number().when("enabled", {
		is: true,
		then: (schema) =>
			schema
				.integer(
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.AutoArchiveSettings.auto_archive_days_must_be_a_whole_number_9f2d68cf",
					),
				)
				.min(
					DAYS_MIN,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.AutoArchiveSettings.auto_archive_period_must_be_at_least_1_day_675161ec",
					),
				)
				.max(
					DAYS_MAX,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.AutoArchiveSettings.must_not_exceed_3650_days_10_years_24a2a467",
					),
				)
				.required(
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.AutoArchiveSettings.auto_archive_days_is_required_871e88bb",
					),
				),
	}),
});

export const AutoArchiveSettings: FC<AutoArchiveSettingsProps> = ({
	autoArchiveDaysData,
	isAutoArchiveDaysLoading,
	isAutoArchiveDaysLoadError,
	onSaveAutoArchiveDays,
	isSavingAutoArchiveDays,
	isSaveAutoArchiveDaysError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSavedVisible, showSavedState } = useTemporarySavedState();
	const serverAutoArchiveDays =
		autoArchiveDaysData?.auto_archive_days ?? DefaultChatAutoArchiveDays;

	const form = useFormik({
		initialValues: {
			enabled: serverAutoArchiveDays > 0,
			auto_archive_days:
				serverAutoArchiveDays > 0 ? serverAutoArchiveDays : ENABLE_DEFAULT_DAYS,
		},
		enableReinitialize: true,
		validationSchema,
		onSubmit: (values, helpers) => {
			onSaveAutoArchiveDays(
				{ auto_archive_days: values.enabled ? values.auto_archive_days : 0 },
				{
					onSuccess: () => {
						showSavedState();
						helpers.resetForm({ values });
					},
				},
			);
		},
	});

	const fieldError = form.errors.auto_archive_days;
	const hasError =
		(Boolean(fieldError) && Boolean(form.touched.auto_archive_days)) ||
		isSaveAutoArchiveDaysError ||
		isAutoArchiveDaysLoadError;

	return (
		<LifecycleSettingLayout
			title={tI18n(
				"AISettingsPage.LifecyclePage.components.AutoArchiveSettings.auto_archive_inactive_conversations_16a7724a",
			)}
			description={tI18n(
				"AISettingsPage.LifecyclePage.components.AutoArchiveSettings.inactive_conversations_are_automatically_archive_e4c83cf1",
			)}
			checked={form.values.enabled}
			onCheckedChange={(checked) => void form.setFieldValue("enabled", checked)}
			switchLabel={tI18n(
				"AISettingsPage.LifecyclePage.components.AutoArchiveSettings.enable_auto_archive_564827d8",
			)}
			disabled={isSavingAutoArchiveDays || isAutoArchiveDaysLoading}
			showSave={form.dirty}
			isSaving={isSavingAutoArchiveDays}
			isSavedVisible={isSavedVisible}
			saveDisabled={
				isSavingAutoArchiveDays || !form.dirty || Boolean(fieldError)
			}
			onSubmit={form.handleSubmit}
			error={
				hasError ? (
					<>
						{fieldError && form.touched.auto_archive_days && (
							<p className="m-0">{fieldError}</p>
						)}
						{isSaveAutoArchiveDaysError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.AutoArchiveSettings.failed_to_save_auto_archive_setting_43ad188b",
								)}
							</p>
						)}
						{isAutoArchiveDaysLoadError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.AutoArchiveSettings.failed_to_load_auto_archive_setting_a2c6ea44",
								)}
							</p>
						)}
					</>
				) : undefined
			}
		>
			<DaysField
				name="auto_archive_days"
				value={form.values.auto_archive_days}
				onChange={form.handleChange}
				onBlur={form.handleBlur}
				label={tI18n(
					"AISettingsPage.LifecyclePage.components.AutoArchiveSettings.auto_archive_period_in_days_5140bc90",
				)}
				disabled={
					!form.values.enabled ||
					isSavingAutoArchiveDays ||
					isAutoArchiveDaysLoading
				}
				error={Boolean(fieldError)}
				min={DAYS_MIN}
				max={DAYS_MAX}
			/>
		</LifecycleSettingLayout>
	);
};
