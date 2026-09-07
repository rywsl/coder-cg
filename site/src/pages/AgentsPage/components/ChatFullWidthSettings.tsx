import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "#/components/Switch/Switch";
import { useChatFullWidth } from "../hooks/useChatFullWidth";

export const ChatFullWidthSettings: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const [enabled, setEnabled] = useChatFullWidth();

	return (
		<div className="flex flex-col gap-2">
			<h3 className="m-0 text-sm font-semibold text-content-primary">
				{tI18n(
					"AgentsPage.components.ChatFullWidthSettings.chat_layout_f6cee7c8",
				)}
			</h3>
			<div className="flex items-center justify-between gap-4">
				<p className="m-0 flex-1 text-xs text-content-secondary">
					{tI18n(
						"AgentsPage.components.ChatFullWidthSettings.use_full_width_layout_for_agent_chat_messages_re_333840fc",
					)}
				</p>
				<Switch
					checked={enabled}
					onCheckedChange={(checked) => setEnabled(Boolean(checked))}
					aria-label={tI18n(
						"AgentsPage.components.ChatFullWidthSettings.full_width_chat_b98c169f",
					)}
				/>
			</div>
		</div>
	);
};
