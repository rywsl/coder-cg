import type { LucideIcon } from "lucide-react";
import {
	AlertTriangleIcon,
	CheckIcon,
	GitMergeIcon,
	GitPullRequestArrowIcon,
	GitPullRequestClosedIcon,
	GitPullRequestDraftIcon,
	Loader2Icon,
	PauseIcon,
} from "lucide-react";
import type { Chat, ChatDiffStatus, ChatStatus } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

type ChatIconConfig = {
	icon: LucideIcon;
	className: string;
	label: string;
};

const statusConfig = {
	waiting: {
		icon: CheckIcon,
		className: "text-content-secondary",
		label: i18n.t(
			"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.idle_ab0171ca",
		),
	},
	running: {
		icon: Loader2Icon,
		className: "text-content-link animate-spin",
		label: i18n.t(
			"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.working_a92f0449",
		),
	},
	interrupting: {
		icon: PauseIcon,
		className: "text-content-warning",
		label: i18n.t(
			"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.interrupting_1fd2c31e",
		),
	},
	requires_action: {
		icon: PauseIcon,
		className: "text-content-warning",
		label: i18n.t(
			"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.requires_action_40f93de0",
		),
	},
	error: {
		icon: AlertTriangleIcon,
		className: "text-content-destructive",
		label: i18n.t(
			"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.error_54a0e8c1",
		),
	},
} as const satisfies Record<ChatStatus, ChatIconConfig>;

const getStatusConfig = (status: ChatStatus): ChatIconConfig => {
	return statusConfig[status] ?? statusConfig.waiting;
};

const getPRIconConfig = (
	diffStatus: ChatDiffStatus | undefined,
): ChatIconConfig | undefined => {
	const state = diffStatus?.pull_request_state;
	if (!state) {
		return undefined;
	}
	if (state === "merged") {
		return {
			icon: GitMergeIcon,
			className: "text-git-merged-bright",
			label: i18n.t(
				"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.pull_request_merged_5f0f1f6d",
			),
		};
	}
	if (state === "closed") {
		return {
			icon: GitPullRequestClosedIcon,
			className: "text-git-deleted-bright",
			label: i18n.t(
				"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.pull_request_closed_2babc563",
			),
		};
	}
	if (diffStatus?.pull_request_draft) {
		return {
			icon: GitPullRequestDraftIcon,
			className: "text-content-secondary",
			label: i18n.t(
				"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.draft_pull_request_e201d835",
			),
		};
	}
	return {
		icon: GitPullRequestArrowIcon,
		className: "text-git-added-bright",
		label: i18n.t(
			"agents:AgentsPage.components.ChatsSidebar.tree.statusConfig.pull_request_open_c576c567",
		),
	};
};

const getChatDiffStatus = (chat: Chat): ChatDiffStatus | undefined => {
	return chat.diff_status;
};

/**
 * Returns the icons and styling that represent a chat's current state.
 *
 * The status icon always reflects the chat status.
 */
export const getChatDisplayConfig = (
	chat: Chat,
): {
	icon: LucideIcon;
	className: string;
	label: string;
	prIcon: ChatIconConfig | undefined;
	diffStatus: ChatDiffStatus | undefined;
} => {
	const diffStatus = getChatDiffStatus(chat);
	const config = getStatusConfig(chat.status);
	return {
		icon: config.icon,
		className: config.className,
		label: config.label,
		prIcon: getPRIconConfig(diffStatus),
		diffStatus,
	};
};
