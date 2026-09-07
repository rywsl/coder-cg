import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { API } from "#/api/api";
import type { AIProvider } from "#/api/typesGenerated";
import {
	type UseFilterMenuOptions,
	useFilterMenu,
} from "#/components/Filter/menu";
import {
	SelectFilter,
	type SelectFilterOption,
} from "#/components/Filter/SelectFilter";
import { AIBridgeProviderIcon } from "../icons/AIBridgeProviderIcon";

const toFilterOption = (provider: AIProvider): SelectFilterOption => ({
	value: provider.name,
	label: provider.display_name || provider.name,
	startIcon: (
		<AIBridgeProviderIcon provider={provider.type} className="size-icon-sm" />
	),
});

export const useProviderFilterMenu = ({
	value,
	onChange,
	enabled,
}: Pick<UseFilterMenuOptions, "value" | "onChange" | "enabled">) => {
	return useFilterMenu({
		id: "provider_name",
		getSelectedOption: async () => {
			if (!value) {
				return null;
			}
			const providers = await API.experimental.listAIProviders();
			const match = providers.find((p) => p.name === value);
			return match ? toFilterOption(match) : null;
		},
		getOptions: async () => {
			const providers = await API.experimental.listAIProviders();
			return providers.map(toFilterOption);
		},
		value,
		onChange,
		enabled,
	});
};

export type ProviderFilterMenu = ReturnType<typeof useProviderFilterMenu>;

interface ProviderFilterProps {
	menu: ProviderFilterMenu;
	width?: number;
}

export const ProviderFilter: FC<ProviderFilterProps> = ({ menu, width }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<SelectFilter
			label={tI18n(
				"AIBridgePage.filters.ProviderFilter.select_provider_644c6aae",
			)}
			placeholder={tI18n(
				"AIBridgePage.filters.ProviderFilter.all_providers_20e56db7",
			)}
			emptyText={tI18n(
				"AIBridgePage.filters.ProviderFilter.no_providers_found_0bc42eac",
			)}
			options={menu.searchOptions}
			onSelect={(option) => menu.selectOption(option)}
			selectedOption={menu.selectedOption ?? undefined}
			width={width}
		/>
	);
};
