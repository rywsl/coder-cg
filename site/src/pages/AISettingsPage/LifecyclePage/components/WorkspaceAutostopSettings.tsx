import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type * as TypesGen from "#/api/typesGenerated";
import { useTemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";
import { i18n } from "#/i18n";
import { DurationField } from "./DurationField/DurationField";
import { LifecycleSettingLayout } from "./LifecycleSettingLayout";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface WorkspaceAutostopSettingsProps {
	workspaceTTLData: TypesGen.ChatWorkspaceTTLResponse | undefined;
	isWorkspaceTTLLoading: boolean;
	isWorkspaceTTLLoadError: boolean;
	onSaveWorkspaceTTL: (
		req: TypesGen.UpdateChatWorkspaceTTLRequest,
		options?: MutationCallbacks,
	) => void;
	isSavingWorkspaceTTL: boolean;
	isSaveWorkspaceTTLError: boolean;
}

const DEFAULT_WORKSPACE_TTL_MS = 3_600_000;
const maxTTLMs = 30 * 24 * 60 * 60_000;

const validationSchema = Yup.object({
	enabled: Yup.boolean().required(),
	workspace_ttl_ms: Yup.number().when("enabled", {
		is: true,
		then: (schema) =>
			schema
				.required()
				.moreThan(
					0,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.duration_must_be_greater_than_zero_c8381695",
					),
				)
				.max(
					maxTTLMs,
					i18n.t(
						"agents:AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.must_not_exceed_30_days_720_hours_46a4a49c",
					),
				),
	}),
});

export const WorkspaceAutostopSettings: FC<WorkspaceAutostopSettingsProps> = ({
	workspaceTTLData,
	isWorkspaceTTLLoading,
	isWorkspaceTTLLoadError,
	onSaveWorkspaceTTL,
	isSavingWorkspaceTTL,
	isSaveWorkspaceTTLError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSavedVisible, showSavedState } = useTemporarySavedState();
	const serverTTLMs = workspaceTTLData?.workspace_ttl_ms ?? 0;

	const form = useFormik({
		initialValues: {
			enabled: serverTTLMs > 0,
			workspace_ttl_ms:
				serverTTLMs > 0 ? serverTTLMs : DEFAULT_WORKSPACE_TTL_MS,
		},
		enableReinitialize: true,
		validationSchema,
		onSubmit: (values, helpers) => {
			onSaveWorkspaceTTL(
				{ workspace_ttl_ms: values.enabled ? values.workspace_ttl_ms : 0 },
				{
					onSuccess: () => {
						showSavedState();
						helpers.resetForm({ values });
					},
				},
			);
		},
	});

	const handleToggleAutostop = (checked: boolean) => {
		void form.setFieldValue("enabled", checked);
		if (checked && form.values.workspace_ttl_ms <= 0) {
			void form.setFieldValue("workspace_ttl_ms", DEFAULT_WORKSPACE_TTL_MS);
		}
	};

	const handleTTLChange = (value: number) => {
		void form.setFieldValue("workspace_ttl_ms", value);
	};

	const fieldError = form.errors.workspace_ttl_ms;
	const hasError =
		Boolean(fieldError) || isSaveWorkspaceTTLError || isWorkspaceTTLLoadError;

	return (
		<LifecycleSettingLayout
			title={tI18n(
				"AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.workspace_autostop_fallback_be8a2dc2",
			)}
			description={tI18n(
				"AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.set_a_default_autostop_for_agent_created_workspa_84af8ca8",
			)}
			checked={form.values.enabled}
			onCheckedChange={handleToggleAutostop}
			switchLabel={tI18n(
				"AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.enable_default_autostop_0bc9a804",
			)}
			disabled={isSavingWorkspaceTTL || isWorkspaceTTLLoading}
			showSave={form.dirty}
			isSaving={isSavingWorkspaceTTL}
			isSavedVisible={isSavedVisible}
			saveDisabled={isSavingWorkspaceTTL || !form.dirty || Boolean(fieldError)}
			onSubmit={form.handleSubmit}
			error={
				hasError ? (
					<>
						{/* DurationField manages its own text state and never calls
						   Formik's onBlur, so form.touched is never set for this
						   field. We display the error directly when present. */}
						{fieldError && <p className="m-0">{fieldError}</p>}
						{isSaveWorkspaceTTLError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.failed_to_save_autostop_setting_bff2b28d",
								)}
							</p>
						)}
						{isWorkspaceTTLLoadError && (
							<p className="m-0">
								{tI18n(
									"AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.failed_to_load_autostop_setting_7f5671e4",
								)}
							</p>
						)}
					</>
				) : undefined
			}
		>
			<DurationField
				valueMs={form.values.workspace_ttl_ms}
				onChange={handleTTLChange}
				label={tI18n(
					"AISettingsPage.LifecyclePage.components.WorkspaceAutostopSettings.autostop_fallback_1521d2af",
				)}
				disabled={
					!form.values.enabled || isSavingWorkspaceTTL || isWorkspaceTTLLoading
				}
				error={Boolean(fieldError)}
				className="w-fit"
			/>
		</LifecycleSettingLayout>
	);
};
