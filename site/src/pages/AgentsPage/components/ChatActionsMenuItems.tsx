import {
	ArchiveIcon,
	ArchiveRestoreIcon,
	BotIcon,
	PinIcon,
	PinOffIcon,
	SquarePenIcon,
	Trash2Icon,
} from "lucide-react";
import { type FC, useId } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import type {
	ContextMenuItem,
	ContextMenuSeparator,
} from "#/components/ContextMenu/ContextMenu";
import type {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "#/components/DropdownMenu/DropdownMenu";

// Backend chatstate permits archive only from W, E0, and E1. Unknown status
// stays fail-open so the server conflict response remains the backstop.
const chatStatusAllowsArchive = (
	status: TypesGen.ChatStatus | null | undefined,
): boolean =>
	status === undefined ||
	status === null ||
	status === "waiting" ||
	status === "error";

// Archive cascades atomically over the whole family, so the backend
// rejects it when any child is still active, not just the root. Children
// are embedded on chat records (depth capped at 1); a missing children
// array stays fail-open like an unknown status.
export const chatFamilyAllowsArchive = (
	status: TypesGen.ChatStatus | null | undefined,
	children: readonly TypesGen.Chat[] | null | undefined,
): boolean =>
	chatStatusAllowsArchive(status) &&
	(children ?? []).every((child) => chatStatusAllowsArchive(child.status));

type ItemComponent = typeof DropdownMenuItem | typeof ContextMenuItem;
type SeparatorComponent =
	| typeof DropdownMenuSeparator
	| typeof ContextMenuSeparator;

/**
 * Archive state is root-only on the backend and cascades to children, so
 * child chats expose no archive or unarchive actions. An archived child chat
 * therefore has no menu actions at all; call sites use this to hide the menu
 * trigger instead of rendering an empty menu.
 */
export const chatHasMenuActions = ({
	isArchived,
	isChildChat,
}: {
	isArchived: boolean;
	isChildChat: boolean;
}): boolean => !(isArchived && isChildChat);

interface ChatActionsMenuItemsProps {
	readonly isArchived: boolean;
	readonly isPinned: boolean;
	readonly isChildChat: boolean;
	readonly hasWorkspace: boolean;
	readonly isArchiving?: boolean;
	readonly isArchiveBlocked?: boolean;
	readonly subagentCount?: number;
	readonly isSubagentsExpanded?: boolean;
	readonly onToggleSubagents?: () => void;
	readonly onPinAgent?: () => void;
	readonly onUnpinAgent?: () => void;
	readonly onArchiveAgent: () => void;
	readonly onUnarchiveAgent: () => void;
	readonly onArchiveAndDeleteWorkspace: () => void;
	/** When omitted, the "Rename chat" item is hidden. */
	readonly onOpenRenameDialog?: () => void;
	readonly Item: ItemComponent;
	readonly Separator: SeparatorComponent;
}

export const ChatActionsMenuItems: FC<ChatActionsMenuItemsProps> = ({
	isArchived,
	isPinned,
	isChildChat,
	hasWorkspace,
	isArchiving = false,
	isArchiveBlocked = false,
	subagentCount = 0,
	isSubagentsExpanded = false,
	onToggleSubagents,
	onPinAgent,
	onUnpinAgent,
	onArchiveAgent,
	onUnarchiveAgent,
	onArchiveAndDeleteWorkspace,
	onOpenRenameDialog,
	Item,
	Separator,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const showSubagentsToggle = Boolean(onToggleSubagents) && subagentCount > 0;
	const showPinAction =
		!isArchived && !isChildChat && Boolean(onPinAgent && onUnpinAgent);
	const showArchiveActions = !isArchived && !isChildChat;
	const archiveBlockedHintId = useId();
	const archiveBlockedDescribedBy = isArchiveBlocked
		? archiveBlockedHintId
		: undefined;

	const subagentToggle = showSubagentsToggle ? (
		<Item onSelect={onToggleSubagents}>
			<BotIcon className="size-3.5" />
			{isSubagentsExpanded
				? tI18n(
						"AgentsPage.components.ChatActionsMenuItems.hide_subagents_cd4a549a",
					)
				: tI18n(
						"AgentsPage.components.ChatActionsMenuItems.show_subagents_value0_f851202b",
						{
							value0: subagentCount,
						},
					)}
		</Item>
	) : null;

	return (
		<>
			{showPinAction && (
				<Item onSelect={isPinned ? onUnpinAgent : onPinAgent}>
					{isPinned ? (
						<>
							<PinOffIcon className="size-3.5" />
							{tI18n(
								"AgentsPage.components.ChatActionsMenuItems.unpin_agent_69571f4d",
							)}
						</>
					) : (
						<>
							<PinIcon className="size-3.5" />
							{tI18n(
								"AgentsPage.components.ChatActionsMenuItems.pin_agent_1cc8db8b",
							)}
						</>
					)}
				</Item>
			)}
			{isArchived ? (
				!isChildChat && (
					<>
						<Item disabled={isArchiving} onSelect={onUnarchiveAgent}>
							<ArchiveRestoreIcon className="size-3.5" />
							{tI18n(
								"AgentsPage.components.ChatActionsMenuItems.unarchive_agent_b652e167",
							)}
						</Item>
						{subagentToggle}
					</>
				)
			) : (
				<>
					{onOpenRenameDialog && (
						<Item onSelect={onOpenRenameDialog}>
							<SquarePenIcon className="size-3.5" />
							{tI18n(
								"AgentsPage.components.ChatActionsMenuItems.rename_chat_26076241",
							)}
						</Item>
					)}
					{subagentToggle}
					{showArchiveActions && (
						<>
							{(onOpenRenameDialog || showPinAction || showSubagentsToggle) && (
								<Separator />
							)}
							<Item
								className="text-content-destructive focus:text-content-destructive"
								aria-describedby={archiveBlockedDescribedBy}
								disabled={isArchiving || isArchiveBlocked}
								onSelect={onArchiveAgent}
							>
								<ArchiveIcon className="size-3.5" />
								{tI18n(
									"AgentsPage.components.ChatActionsMenuItems.archive_agent_0246898e",
								)}
							</Item>
							{hasWorkspace && (
								<Item
									className="text-content-destructive focus:text-content-destructive"
									aria-describedby={archiveBlockedDescribedBy}
									disabled={isArchiving || isArchiveBlocked}
									onSelect={onArchiveAndDeleteWorkspace}
								>
									<Trash2Icon className="size-3.5" />
									{tI18n(
										"AgentsPage.components.ChatActionsMenuItems.archive_delete_workspace_20504a2a",
									)}
								</Item>
							)}
							{isArchiveBlocked && (
								<div
									id={archiveBlockedHintId}
									className="max-w-56 px-2 py-1.5 text-xs text-content-secondary"
								>
									{tI18n(
										"AgentsPage.components.ChatActionsMenuItems.interrupt_or_wait_for_the_agent_to_finish_first_b529b3df",
									)}
								</div>
							)}
						</>
					)}
				</>
			)}
		</>
	);
};
