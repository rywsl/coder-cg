import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

export const PINNED_SECTION_KEY = "Pinned";

export const getSectionToggleTestId = (sectionKey: string) =>
	`agents-section-toggle-${sectionKey.replaceAll(" ", "-")}`;

interface ChatSectionHeaderProps {
	readonly label: string;
	readonly count: number;
	readonly expanded: boolean;
	readonly onToggle: () => void;
	readonly testId: string;
}

export const ChatSectionHeader: FC<ChatSectionHeaderProps> = ({
	label,
	count,
	expanded,
	onToggle,
	testId,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const actionLabel = expanded
		? tI18n(
				"AgentsPage.components.ChatsSidebar.chats.ChatSectionHeader.collapse_be6eb1fc",
			)
		: tI18n(
				"AgentsPage.components.ChatsSidebar.chats.ChatSectionHeader.expand_07548c2c",
			);
	return (
		<div className="group/header mb-1 ml-2.5 mr-2 flex h-7 items-center text-xs font-medium text-content-secondary">
			<button
				type="button"
				className="flex h-7 min-w-0 flex-1 cursor-pointer appearance-none items-center rounded-md border-0 bg-transparent p-0 text-left font-sans text-xs font-medium text-current focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-content-link [@media(hover:hover)]:group-hover/header:text-content-primary"
				aria-expanded={expanded}
				aria-label={tI18n(
					"AgentsPage.components.ChatsSidebar.chats.ChatSectionHeader.value0_value1_section_4581656a",
					{
						value0: actionLabel,
						value1: label,
					},
				)}
				data-testid={testId}
				onClick={onToggle}
			>
				<span className="min-w-0 flex-1 truncate">
					{label} ({count})
				</span>
				<span className="flex h-6 w-7 shrink-0 items-center justify-end">
					<ChevronDownIcon
						aria-hidden="true"
						className={cn(
							"size-3.5 text-current transition-transform",
							expanded && "rotate-180",
						)}
					/>
				</span>
			</button>
		</div>
	);
};
