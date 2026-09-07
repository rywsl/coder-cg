import { RotateCcwIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { Button } from "#/components/Button/Button";
import { ChatTopBar } from "./components/ChatTopBar";

interface AgentChatPageErrorViewProps {
	titleElement: ReactNode;
	isSidebarCollapsed: boolean;
	onToggleSidebarCollapsed: () => void;
	error: unknown;
	onRetry: () => void;
}

export const AgentChatPageErrorView: FC<AgentChatPageErrorViewProps> = ({
	titleElement,
	isSidebarCollapsed,
	onToggleSidebarCollapsed,
	error,
	onRetry,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const detail = getErrorDetail(error);

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
			{titleElement}
			<ChatTopBar
				panel={{
					showSidebarPanel: false,
					onToggleSidebar: () => {},
				}}
				onArchiveAgent={() => {}}
				onUnarchiveAgent={() => {}}
				onArchiveAndDeleteWorkspace={() => {}}
				hasWorkspace={false}
				isSidebarCollapsed={isSidebarCollapsed}
				onToggleSidebarCollapsed={onToggleSidebarCollapsed}
			/>
			<div className="flex flex-1 items-center justify-center px-6 text-center">
				<div className="flex flex-col items-center">
					<h3 className="m-0 font-medium text-base text-content-primary">
						{tI18n(
							"AgentsPage.AgentChatPageErrorView.failed_to_load_chat_d8b99a0a",
						)}
					</h3>
					<p className="m-0 mt-1 max-w-md text-sm text-content-secondary">
						{getErrorMessage(
							error,
							tI18n(
								"AgentsPage.AgentChatPageErrorView.the_chat_could_not_be_loaded_7a2ff5bb",
							),
						)}
					</p>
					{detail && (
						<p className="m-0 mt-1 max-w-md text-sm text-content-secondary">
							{detail}
						</p>
					)}
					<Button size="sm" onClick={onRetry} className="mt-4">
						<RotateCcwIcon />
						{tI18n("AgentsPage.AgentChatPageErrorView.try_again_d8b8392e")}
					</Button>
				</div>
			</div>
		</div>
	);
};
