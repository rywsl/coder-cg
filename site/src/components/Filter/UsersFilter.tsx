import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	Filter,
	MenuSkeleton,
	type useFilter,
} from "#/components/Filter/Filter";
import {
	type UseFilterMenuOptions,
	useFilterMenu,
} from "#/components/Filter/menu";
import {
	SelectFilter,
	type SelectFilterOption,
} from "#/components/Filter/SelectFilter";
import { StatusIndicatorDot } from "#/components/StatusIndicator/StatusIndicator";
import { docs } from "#/utils/docs";

const userFilterQuery = {
	active: "status:active",
	serviceAccount: "service_account:true",
	all: "",
};

export const useStatusFilterMenu = ({
	value,
	onChange,
}: Pick<UseFilterMenuOptions, "value" | "onChange">) => {
	const { t: tI18n } = useTranslation("components");

	const statusOptions: SelectFilterOption[] = [
		{
			value: "active",
			label: tI18n("Filter.UsersFilter.active_92340695"),
			startIcon: <StatusIndicatorDot variant="success" />,
		},
		{
			value: "dormant",
			label: tI18n("Filter.UsersFilter.dormant_027d0e4c"),
			startIcon: <StatusIndicatorDot variant="warning" />,
		},
		{
			value: "suspended",
			label: tI18n("Filter.UsersFilter.suspended_e392a389"),
			startIcon: <StatusIndicatorDot variant="inactive" />,
		},
	];
	return useFilterMenu({
		onChange,
		value,
		id: "status",
		getSelectedOption: async () =>
			statusOptions.find((option) => option.value === value) ?? null,
		getOptions: async () => statusOptions,
	});
};

type StatusFilterMenu = ReturnType<typeof useStatusFilterMenu>;

const PRESET_FILTERS = [
	{ query: userFilterQuery.active, name: "Active users" },
	{ query: userFilterQuery.serviceAccount, name: "Service accounts" },
	{ query: userFilterQuery.all, name: "All users" },
];

interface UsersFilterProps {
	filter: ReturnType<typeof useFilter>;
	error?: unknown;
	menus?: {
		status?: StatusFilterMenu;
	};
}

export const UsersFilter: FC<UsersFilterProps> = ({ filter, error, menus }) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Filter
			presets={PRESET_FILTERS}
			learnMoreLink={docs("/admin/users#user-filtering")}
			learnMoreLabel2={tI18n("Filter.UsersFilter.user_status_6e07a34f")}
			learnMoreLink2={docs("/admin/users#user-status")}
			isLoading={menus?.status?.isInitializing ?? false}
			filter={filter}
			error={error}
			options={menus?.status && <StatusMenu {...menus.status} />}
			optionsSkeleton={menus?.status && <MenuSkeleton />}
		/>
	);
};

const StatusMenu = (menu: StatusFilterMenu) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<SelectFilter
			label={tI18n("Filter.UsersFilter.select_a_status_e3b579ea")}
			placeholder={tI18n("Filter.UsersFilter.all_statuses_8ee57323")}
			options={menu.searchOptions}
			onSelect={menu.selectOption}
			selectedOption={menu.selectedOption ?? undefined}
		/>
	);
};
