import { cn } from "cn";
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react";
import type {
	ChangeEventHandler,
	FC,
	KeyboardEventHandler,
	RefObject,
} from "react";
import { useTranslation } from "react-i18next";

export type SearchFilter = {
	readonly key: string;
	readonly value: string | null;
};

type ChatSearchInputProps = {
	readonly activeResultId: string | undefined;
	readonly hasResults: boolean;
	readonly inputRef: RefObject<HTMLInputElement | null>;
	readonly listboxId: string;
	readonly filters: readonly SearchFilter[];
	readonly value: string;
	readonly onChange: ChangeEventHandler<HTMLInputElement>;
	readonly onKeyDown: KeyboardEventHandler<HTMLInputElement>;
	readonly onRemoveFilter: (key: string) => void;
	readonly isDropdownOpen: boolean;
	readonly onToggleDropdown: () => void;
};

export const ChatSearchInput: FC<ChatSearchInputProps> = ({
	activeResultId,
	hasResults,
	inputRef,
	listboxId,
	filters,
	value,
	onChange,
	onKeyDown,
	onRemoveFilter,
	isDropdownOpen,
	onToggleDropdown,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const completedFilters = filters.filter((f) => f.value !== null);
	const incompleteFilter = filters.find((f) => f.value === null);

	return (
		<div
			className={cn(
				"flex min-h-10 w-full min-w-0 items-start gap-1.5 rounded-md border border-solid border-border-default bg-surface-primary px-3 py-2",
				"focus-within:ring-2 focus-within:ring-content-link",
			)}
		>
			<div className="flex h-7 shrink-0 items-center">
				<SearchIcon className="size-4 text-content-secondary" />
			</div>
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
				{completedFilters.map((f) => (
					<span
						key={f.key}
						className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-solid border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
					>
						<span
							className="block min-w-0 truncate"
							title={tI18n(
								"AgentsPage.components.ChatsSidebar.dialogs.ChatSearchInput.value0_value1_737f6be4",
								{
									value0: f.key,
									value1: f.value,
								},
							)}
						>
							{f.key}:{f.value}
						</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onRemoveFilter(f.key);
							}}
							className="inline-flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0 text-content-secondary hover:text-content-primary"
							aria-label={tI18n(
								"AgentsPage.components.ChatsSidebar.dialogs.ChatSearchInput.remove_value0_filter_a79a6ff5",
								{
									value0: f.key,
								},
							)}
						>
							<XIcon className="size-3" />
						</button>
					</span>
				))}
				{incompleteFilter && (
					<span className="inline-flex shrink-0 items-center rounded-md border border-dashed border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary">
						{incompleteFilter.key}:
					</span>
				)}
				<input
					ref={inputRef}
					value={value}
					onChange={onChange}
					onKeyDown={onKeyDown}
					placeholder={
						filters.length > 0
							? ""
							: tI18n(
									"AgentsPage.components.ChatsSidebar.dialogs.ChatSearchInput.search_chats_c4712865",
								)
					}
					className="min-w-[60px] flex-1 basis-[60px] border-none bg-transparent py-0.5 text-sm text-content-primary outline-hidden placeholder:text-content-disabled"
					aria-label={tI18n(
						"AgentsPage.components.ChatsSidebar.dialogs.ChatSearchInput.search_chats_02a39c4a",
					)}
					role="combobox"
					aria-controls={hasResults ? listboxId : undefined}
					aria-expanded={hasResults}
					aria-haspopup="listbox"
					aria-activedescendant={activeResultId}
				/>
			</div>
			<button
				type="button"
				onClick={onToggleDropdown}
				className={cn(
					"inline-flex h-7 shrink-0 cursor-pointer items-center border-none bg-transparent p-0 text-content-secondary hover:text-content-primary",
					isDropdownOpen && "text-content-primary",
				)}
				aria-label={tI18n(
					"AgentsPage.components.ChatsSidebar.dialogs.ChatSearchInput.toggle_filters_fa866516",
				)}
				aria-expanded={isDropdownOpen}
			>
				<ListFilterIcon className="size-4" />
			</button>
		</div>
	);
};
