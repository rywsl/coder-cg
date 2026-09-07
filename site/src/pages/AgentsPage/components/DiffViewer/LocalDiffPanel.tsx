import type { FC, RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceAgentRepoChanges } from "#/api/typesGenerated";
import type { ChatMessageInputRef } from "../AgentChatInput";
import { CommentableDiffViewer } from "../DiffViewer/CommentableDiffViewer";
import type { DiffStyle } from "../DiffViewer/DiffViewer";
import { parseDiffString } from "../DiffViewer/parseDiff";

interface LocalDiffPanelProps {
	repo: WorkspaceAgentRepoChanges;
	isExpanded?: boolean;
	diffStyle: DiffStyle;
	chatInputRef?: RefObject<ChatMessageInputRef | null>;
}

export const LocalDiffPanel: FC<LocalDiffPanelProps> = ({
	repo,
	isExpanded,
	diffStyle,
	chatInputRef,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const parsedFiles = parseDiffString(repo.unified_diff);

	return (
		<CommentableDiffViewer
			parsedFiles={parsedFiles}
			isExpanded={isExpanded}
			emptyMessage={tI18n(
				"AgentsPage.components.DiffViewer.LocalDiffPanel.no_file_changes_214229fe",
			)}
			diffStyle={diffStyle}
			chatInputRef={chatInputRef}
		/>
	);
};
