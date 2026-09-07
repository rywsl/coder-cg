import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { UseMutateFunction } from "react-query";
import type * as TypesGen from "#/api/typesGenerated";
import { Switch } from "#/components/Switch/Switch";

interface UserChatDebugLoggingSettingsProps {
	userSettings: TypesGen.UserChatDebugLoggingSettings | undefined;
	onSaveUserSetting: UseMutateFunction<
		void,
		Error,
		TypesGen.UpdateUserChatDebugLoggingRequest,
		unknown
	>;
	isSavingUserSetting: boolean;
	isSaveUserSettingError: boolean;
}

export const UserChatDebugLoggingSettings: FC<
	UserChatDebugLoggingSettingsProps
> = ({
	userSettings,
	onSaveUserSetting,
	isSavingUserSetting,
	isSaveUserSettingError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	if (!userSettings?.user_toggle_allowed) {
		return null;
	}

	const forcedByDeployment = userSettings.forced_by_deployment;
	const userDebugLoggingEnabled = userSettings.debug_logging_enabled;

	return (
		<div className="space-y-2">
			<h3 className="m-0 text-sm font-semibold text-content-primary">
				{tI18n(
					"AgentsPage.components.UserChatDebugLoggingSettings.record_debug_logs_for_my_chats_b12e5649",
				)}
			</h3>
			<div className="flex items-center justify-between gap-4">
				<div className="mt-0.5! m-0 flex-1 text-xs text-content-secondary">
					{forcedByDeployment ? (
						<p className="m-0">
							{tI18n(
								"AgentsPage.components.UserChatDebugLoggingSettings.an_administrator_has_enabled_debug_logging_for_e_dc2dff9e",
							)}
						</p>
					) : (
						<p className="m-0">
							{tI18n(
								"AgentsPage.components.UserChatDebugLoggingSettings.save_a_detailed_trace_of_your_chats_each_turn_pl_dc11101c",
							)}
						</p>
					)}
				</div>
				<Switch
					checked={forcedByDeployment || userDebugLoggingEnabled}
					onCheckedChange={(checked) =>
						onSaveUserSetting({ debug_logging_enabled: checked })
					}
					aria-label={tI18n(
						"AgentsPage.components.UserChatDebugLoggingSettings.enable_personal_chat_debug_logging_93c7c103",
					)}
					disabled={forcedByDeployment || isSavingUserSetting}
				/>
			</div>
			{isSaveUserSettingError && (
				<p className="m-0 text-xs text-content-destructive">
					{tI18n(
						"AgentsPage.components.UserChatDebugLoggingSettings.failed_to_save_your_chat_debug_logging_preferenc_1e57b285",
					)}
				</p>
			)}
		</div>
	);
};
