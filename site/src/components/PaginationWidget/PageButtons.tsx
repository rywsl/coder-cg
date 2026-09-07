import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";

type NumberedPageButtonProps = {
	pageNumber: number;
	totalPages: number;
	onClick?: () => void;
	highlighted?: boolean;
	disabled?: boolean;
};

export const NumberedPageButton: FC<NumberedPageButtonProps> = ({
	pageNumber,
	totalPages,
	onClick,
	highlighted = false,
	disabled = false,
}) => {
	const { t: tI18n } = useTranslation("components");

	let ariaLabel = tI18n("PaginationWidget.PageButtons.page_value0_3a8697b9", {
		value0: pageNumber,
	});
	if (highlighted) {
		ariaLabel = tI18n("PaginationWidget.PageButtons.current_page_5c15d4a7");
	} else if (pageNumber === 1) {
		ariaLabel = tI18n("PaginationWidget.PageButtons.first_page_c278e9ed");
	} else if (pageNumber === totalPages) {
		ariaLabel = tI18n("PaginationWidget.PageButtons.last_page_e6e00be5");
	}

	return (
		<BasePageButton
			name="Page button"
			aria-label={ariaLabel}
			onClick={onClick}
			highlighted={highlighted}
			disabled={disabled}
		>
			{pageNumber}
		</BasePageButton>
	);
};

type PlaceholderPageButtonProps = {
	pagesOmitted: number;
	children?: ReactNode;
};

export const PlaceholderPageButton: FC<PlaceholderPageButtonProps> = ({
	pagesOmitted,
	children = <>&hellip;</>,
}) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<BasePageButton
			disabled
			name="Omitted pages"
			aria-label={tI18n(
				"PaginationWidget.PageButtons.omitting_value0_pages_61e516fd",
				{
					value0: pagesOmitted,
				},
			)}
		>
			{children}
		</BasePageButton>
	);
};

type BasePageButtonProps = {
	children?: ReactNode;
	onClick?: () => void;
	name: string;
	"aria-label": string;
	highlighted?: boolean;
	disabled?: boolean;
};

const BasePageButton: FC<BasePageButtonProps> = ({
	children,
	onClick,
	name,
	"aria-label": ariaLabel,
	highlighted = false,
	disabled = false,
}) => {
	return (
		<Button
			variant={highlighted ? "default" : "outline"}
			size="icon"
			aria-label={ariaLabel}
			name={name}
			disabled={disabled}
			onClick={onClick}
			className="min-w-8 w-auto"
		>
			{children}
		</Button>
	);
};
