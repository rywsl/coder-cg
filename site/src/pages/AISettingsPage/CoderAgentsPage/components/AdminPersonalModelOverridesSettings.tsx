import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { Switch } from "#/components/Switch/Switch";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

export type SavePersonalModelOverridesAdminSetting = (
	req: TypesGen.UpdateChatPersonalModelOverridesAdminSettingsRequest,
	options?: MutationCallbacks,
) => void;

interface AdminPersonalModelOverridesSettingsProps {
	adminSettings: TypesGen.ChatPersonalModelOverridesAdminSettings | undefined;
	adminSettingsError?: unknown;
	onRetryAdminSettings?: () => void;
	isRetryingAdminSettings?: boolean;
	onSaveAdminSetting: SavePersonalModelOverridesAdminSetting;
	isSavingAdminSetting: boolean;
	isSaveAdminSettingError: boolean;
}

export const AdminPersonalModelOverridesSettings: FC<
	AdminPersonalModelOverridesSettingsProps
> = ({
	adminSettings,
	adminSettingsError,
	onRetryAdminSettings,
	isRetryingAdminSettings = false,
	onSaveAdminSetting,
	isSavingAdminSetting,
	isSaveAdminSettingError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const hasLoadedAdminSettings = adminSettings !== undefined;
	const hasAdminSettingsError = adminSettingsError != null;
	const isDisabled = isSavingAdminSetting || !hasLoadedAdminSettings;
	const allowsUsers = adminSettings?.allow_users ?? false;

	return (
		<div
			role="group"
			aria-label={tI18n(
				"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.allow_personal_model_overrides_6deaadae",
			)}
			className="flex flex-col"
		>
			<div className="flex min-h-8 items-start gap-2 font-sans text-sm font-normal leading-6 text-content-primary">
				<Switch
					checked={allowsUsers}
					onCheckedChange={(checked) => {
						onSaveAdminSetting({ allow_users: checked });
					}}
					aria-label={tI18n(
						"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.allow_personal_model_overrides_6deaadae",
					)}
					type="button"
					disabled={isDisabled}
					className="mt-0.5"
				/>
				<div className="flex min-w-0 flex-col">
					<span>
						{tI18n(
							"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.allow_personal_model_overrides_6deaadae",
						)}
					</span>
					<span className="text-content-secondary">
						{tI18n(
							"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.saved_user_preferences_are_preserved_but_ignored_513d58ec",
						)}
					</span>
				</div>
			</div>
			{hasAdminSettingsError && (
				<div className="mt-4 flex flex-col gap-2 text-xs text-content-primary">
					<ErrorAlert error={adminSettingsError} />
					{onRetryAdminSettings && (
						<Button
							disabled={isRetryingAdminSettings}
							onClick={onRetryAdminSettings}
							size="sm"
							type="button"
							variant="outline"
							className="w-fit"
						>
							{tI18n(
								"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.retry_942087cc",
							)}
						</Button>
					)}
				</div>
			)}
			{!hasAdminSettingsError && !hasLoadedAdminSettings && (
				<p className="m-0 mt-4 text-xs text-content-secondary">
					{tI18n(
						"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.loading_personal_model_override_settings_d31eeed6",
					)}
				</p>
			)}
			{isSaveAdminSettingError && (
				<p className="m-0 mt-4 text-xs text-content-destructive">
					{tI18n(
						"AISettingsPage.CoderAgentsPage.components.AdminPersonalModelOverridesSettings.failed_to_save_personal_model_override_settings_e4e7d94e",
					)}
				</p>
			)}
		</div>
	);
};
