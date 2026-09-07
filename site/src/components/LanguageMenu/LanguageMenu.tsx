import { LanguagesIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { changeLocale } from "#/i18n";
import { isSupportedLocale } from "#/i18n/locale";

export const LanguageMenu: FC = () => {
	const { i18n, t } = useTranslation("common");
	const locale = isSupportedLocale(i18n.language) ? i18n.language : "en";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="subtle"
					size="icon"
					aria-label={t("language.menuLabel")}
				>
					<LanguagesIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={locale}
					onValueChange={(value) => {
						if (isSupportedLocale(value)) {
							void changeLocale(value);
						}
					}}
				>
					<DropdownMenuRadioItem value="zh-CN">
						{t("language.simplifiedChinese")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="en">
						{t("language.english")}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
