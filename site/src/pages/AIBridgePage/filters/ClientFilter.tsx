import { useTranslation } from "react-i18next";
import { API } from "#/api/api";
import { ComboboxInput } from "#/components/Combobox/Combobox";
import {
	type UseFilterMenuOptions,
	useFilterMenu,
} from "#/components/Filter/menu";
import { SelectFilter } from "#/components/Filter/SelectFilter";
import { AIBridgeClientIcon } from "../icons/AIBridgeClientIcon";

export const useClientFilterMenu = ({
	value,
	onChange,
	enabled,
}: Pick<UseFilterMenuOptions, "value" | "onChange" | "enabled">) => {
	return useFilterMenu({
		id: "client",
		getSelectedOption: async () => {
			const clientsRes = await API.getAIBridgeClients({
				q: value,
				limit: 1,
			});
			const firstClient = clientsRes.at(0);

			if (firstClient) {
				return {
					startIcon: (
						<AIBridgeClientIcon client={firstClient} className="size-icon-sm" />
					),
					label: firstClient,
					value: firstClient,
				};
			}

			return null;
		},
		getOptions: async (query) => {
			const clientsRes = await API.getAIBridgeClients({
				q: query,
				limit: 25,
			});
			return clientsRes.map((client) => ({
				startIcon: (
					<AIBridgeClientIcon client={client} className="size-icon-sm" />
				),
				label: client,
				value: client,
			}));
		},
		value,
		onChange,
		enabled,
	});
};

export type ClientFilterMenu = ReturnType<typeof useClientFilterMenu>;

interface ClientFilterProps {
	menu: ClientFilterMenu;
	width?: number;
}

export const ClientFilter: React.FC<ClientFilterProps> = ({ menu, width }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<SelectFilter
			label={tI18n("AIBridgePage.filters.ClientFilter.select_client_cb6d1f73")}
			placeholder={tI18n(
				"AIBridgePage.filters.ClientFilter.all_clients_b695c090",
			)}
			emptyText={tI18n(
				"AIBridgePage.filters.ClientFilter.no_clients_found_808a93f5",
			)}
			options={menu.searchOptions}
			onSelect={(option) => menu.selectOption(option)}
			selectedOption={menu.selectedOption ?? undefined}
			width={width}
			selectFilterSearch={
				<ComboboxInput
					placeholder={tI18n(
						"AIBridgePage.filters.ClientFilter.search_client_2594284f",
					)}
					value={menu.query}
					onValueChange={menu.setQuery}
				/>
			}
		/>
	);
};
