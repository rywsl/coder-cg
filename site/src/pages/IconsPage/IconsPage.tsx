import { SearchIcon, XIcon } from "lucide-react";
import { type FC, type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import uFuzzy from "ufuzzy";
import { Button } from "#/components/Button/Button";
import { CopyableValue } from "#/components/CopyableValue/CopyableValue";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { Input } from "#/components/Input/Input";
import { Link } from "#/components/Link/Link";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useAppearance } from "#/theme/appearance";
import { DEPRECATED_ICONS } from "#/theme/deprecatedIcons";
import {
	defaultParametersForBuiltinIcons,
	parseImageParameters,
} from "#/theme/externalImages";
import icons from "#/theme/icons.json";
import { pageTitle } from "#/utils/page";

const filteredIcons = icons.filter((icon) => !DEPRECATED_ICONS.includes(icon));
const iconsWithoutSuffix = filteredIcons.map((icon) => {
	const lastDotIndex = icon.lastIndexOf(".");
	return lastDotIndex === -1 ? icon : icon.substring(0, lastDotIndex);
});
const fuzzyFinder = new uFuzzy({
	intraMode: 1,
	intraIns: 1,
	intraSub: 1,
	intraTrn: 1,
	intraDel: 1,
});

const IconsPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	const { externalImages } = useAppearance();
	const [searchInputText, setSearchInputText] = useState("");
	const searchText = searchInputText.trim();

	const searchedIcons = useMemo(() => {
		if (!searchText) {
			return filteredIcons.map((icon) => ({
				url: `/icon/${icon}`,
				description: icon,
			}));
		}

		const [map, info, sorted] = fuzzyFinder.search(
			iconsWithoutSuffix,
			searchText,
		);

		// We hit an invalid state somehow
		if (!map || !info || !sorted) {
			return [];
		}

		return sorted.map((i) => {
			const iconName = filteredIcons[info.idx[i]];
			const ranges = info.ranges[i];

			const nodes: ReactNode[] = [];
			let cursor = 0;
			for (let j = 0; j < ranges.length; j += 2) {
				nodes.push(iconName.slice(cursor, ranges[j]));
				nodes.push(
					<mark key={j + 1}>{iconName.slice(ranges[j], ranges[j + 1])}</mark>,
				);
				cursor = ranges[j + 1];
			}
			nodes.push(iconName.slice(cursor));
			return { url: `/icon/${iconName}`, description: nodes };
		});
	}, [searchText]);

	return (
		<>
			<title>{pageTitle(tI18n("IconsPage.IconsPage.icons_eae96e02"))}</title>
			<Margins>
				<PageHeader
					actions={
						<Tooltip>
							<TooltipTrigger asChild>
								<Link href="https://github.com/coder/coder/tree/main/site/static/icon">
									{tI18n("IconsPage.IconsPage.suggest_an_icon_51b7ba8f")}
								</Link>
							</TooltipTrigger>
							<TooltipContent side="bottom" align="end" className="max-w-xs">
								{tI18n(
									"IconsPage.IconsPage.you_can_suggest_a_new_icon_by_submitting_a_pull__7f217a72",
								)}
							</TooltipContent>
						</Tooltip>
					}
				>
					<PageHeaderTitle>
						{tI18n("IconsPage.IconsPage.icons_eae96e02")}
					</PageHeaderTitle>
					<PageHeaderSubtitle>
						{tI18n(
							"IconsPage.IconsPage.all_of_the_icons_included_with_coder_c8e40dbe",
						)}
					</PageHeaderSubtitle>
				</PageHeader>
				<div className="relative max-w-xs">
					<SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-icon-xs text-content-secondary" />
					<Input
						aria-label={tI18n("IconsPage.IconsPage.filter_638e249f")}
						name="query"
						placeholder={tI18n("IconsPage.IconsPage.search_7336265a")}
						value={searchInputText}
						onChange={(event) => setSearchInputText(event.target.value)}
						className="pl-9 pr-10"
					/>
					{searchInputText && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="subtle"
									onClick={() => setSearchInputText("")}
									className="absolute right-1 top-1/2 -translate-y-1/2"
								>
									<XIcon className="size-icon-xs" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{tI18n("IconsPage.IconsPage.clear_filter_ba59e2d4")}
							</TooltipContent>
						</Tooltip>
					)}
				</div>

				<div className="flex flex-row gap-2 justify-center flex-wrap max-w-full mt-8">
					{searchedIcons.length === 0 && (
						<EmptyState
							message={tI18n(
								"IconsPage.IconsPage.no_results_matched_your_search_c229583b",
							)}
						/>
					)}
					{searchedIcons.map((icon) => (
						<CopyableValue key={icon.url} value={icon.url}>
							<div className="flex flex-col gap-4 items-center max-w-full p-3">
								<img
									alt={icon.url}
									src={icon.url}
									className="size-16 object-contain pointer-events-none p-3"
									style={parseImageParameters(
										externalImages,
										defaultParametersForBuiltinIcons.get(icon.url) ?? "",
									)}
								/>
								<figcaption className="w-[88px] h-12 text-xs font-normal text-ellipsis text-center overflow-hidden">
									{icon.description}
								</figcaption>
							</div>
						</CopyableValue>
					))}
				</div>
			</Margins>
		</>
	);
};

export default IconsPage;
