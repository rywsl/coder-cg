import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Switch } from "#/components/Switch/Switch";

interface AdminChatDebugLoggingSettingsProps {
	adminSettings: TypesGen.ChatDebugLoggingAdminSettings | undefined;
	isLoadingAdminSetting: boolean;
	onSaveAdminSetting: (
		req: TypesGen.UpdateChatDebugLoggingAllowUsersRequest,
	) => void;
	isSavingAdminSetting: boolean;
	isSaveAdminSettingError: boolean;
}

export const AdminChatDebugLoggingSettings: FC<
	AdminChatDebugLoggingSettingsProps
> = ({
	adminSettings,
	isLoadingAdminSetting,
	onSaveAdminSetting,
	isSavingAdminSetting,
	isSaveAdminSettingError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const forcedByDeployment = adminSettings?.forced_by_deployment ?? false;
	const adminAllowsUsers = adminSettings?.allow_users ?? false;

	const description = forcedByDeployment
		? tI18n(
				"AgentsPage.components.AdminChatDebugLoggingSettings.debug_logging_is_already_enabled_deployment_wide_353e4d40",
			)
		: tI18n(
				"AgentsPage.components.AdminChatDebugLoggingSettings.lets_users_turn_on_debug_logging_for_their_own_c_c1cf66df",
			);

	return (
		<div className="flex items-start gap-3">
			<Switch
				checked={adminAllowsUsers}
				onCheckedChange={(checked) =>
					onSaveAdminSetting({ allow_users: checked })
				}
				aria-label={tI18n(
					"AgentsPage.components.AdminChatDebugLoggingSettings.allow_users_to_enable_chat_debug_logging_885baec9",
				)}
				disabled={
					forcedByDeployment || isSavingAdminSetting || isLoadingAdminSetting
				}
				className={cn("mt-0.5")}
			/>
			<div className="flex max-w-[980px] flex-1 flex-col">
				<h3 className="m-0 text-sm font-normal leading-6 text-content-primary">
					{tI18n(
						"AgentsPage.components.AdminChatDebugLoggingSettings.let_users_record_chat_debug_logs_39d8b511",
					)}
				</h3>
				<p className="mt-1 mb-0 text-sm font-normal leading-6 text-content-secondary">
					{description}
				</p>
				{isSaveAdminSettingError && (
					<p className="m-0 mt-2 text-xs text-content-destructive">
						{tI18n(
							"AgentsPage.components.AdminChatDebugLoggingSettings.failed_to_save_the_admin_debug_logging_setting_02c03d5c",
						)}
					</p>
				)}
			</div>
		</div>
	);
};
