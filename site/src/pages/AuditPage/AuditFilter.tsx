import capitalize from "lodash/capitalize";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { AuditActions, ResourceTypes } from "#/api/typesGenerated";
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
import {
	DEFAULT_USER_FILTER_WIDTH,
	type UserFilterMenu,
	UserMenu,
} from "#/components/Filter/UserFilter";
import {
	type OrganizationsFilterMenu,
	OrganizationsMenu,
} from "#/modules/tableFiltering/options";
import { docs } from "#/utils/docs";

const PRESET_FILTERS = [
	{
		query: "resource_type:workspace action:create",
		name: "Created workspaces",
	},
	{ query: "resource_type:template action:create", name: "Added templates" },
	{ query: "resource_type:user action:delete", name: "Deleted users" },
	{
		query: "resource_type:workspace_build action:start build_reason:initiator",
		name: "Builds started by a user",
	},
	{
		query: "resource_type:api_key action:login",
		name: "User logins",
	},
];

interface AuditFilterProps {
	filter: ReturnType<typeof useFilter>;
	error?: unknown;
	menus: {
		user: UserFilterMenu;
		action: ActionFilterMenu;
		resourceType: ResourceTypeFilterMenu;
		// The organization menu is only provided in a multi-org setup.
		organization?: OrganizationsFilterMenu;
	};
}

export const AuditFilter: FC<AuditFilterProps> = ({ filter, error, menus }) => {
	const width = menus.organization ? DEFAULT_USER_FILTER_WIDTH : undefined;
	return (
		<Filter
			learnMoreLink={docs(
				"/admin/security/audit-logs#how-to-filter-audit-logs",
			)}
			presets={PRESET_FILTERS}
			isLoading={menus.user.isInitializing}
			filter={filter}
			error={error}
			options={
				<>
					<ResourceTypeMenu width={width} menu={menus.resourceType} />
					<ActionMenu width={width} menu={menus.action} />
					<UserMenu width={width} menu={menus.user} />
					{menus.organization && (
						<OrganizationsMenu width={width} menu={menus.organization} />
					)}
				</>
			}
			optionsSkeleton={
				<>
					<MenuSkeleton />
					<MenuSkeleton />
					<MenuSkeleton />
					{menus.organization && <MenuSkeleton />}
				</>
			}
		/>
	);
};

export const useActionFilterMenu = ({
	value,
	onChange,
}: Pick<UseFilterMenuOptions, "value" | "onChange">) => {
	const actionOptions: SelectFilterOption[] = AuditActions
		// TODO(ethanndickson): Logs with these action types are no longer produced.
		// Until we remove them from the database and API, we shouldn't suggest them
		// in the filter dropdown.
		.filter(
			(action) => !["connect", "disconnect", "open", "close"].includes(action),
		)
		.map((action) => ({
			value: action,
			label: capitalize(action),
		}));
	return useFilterMenu({
		onChange,
		value,
		id: "status",
		getSelectedOption: async () =>
			actionOptions.find((option) => option.value === value) ?? null,
		getOptions: async () => actionOptions,
	});
};

type ActionFilterMenu = ReturnType<typeof useActionFilterMenu>;

interface ActionMenuProps {
	menu: ActionFilterMenu;
	width?: number;
}

const ActionMenu: FC<ActionMenuProps> = ({ menu, width }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<SelectFilter
			label={tI18n("AuditPage.AuditFilter.select_an_action_537bfe79")}
			placeholder={tI18n("AuditPage.AuditFilter.all_actions_83140cf1")}
			options={menu.searchOptions}
			onSelect={menu.selectOption}
			selectedOption={menu.selectedOption ?? undefined}
			width={width}
		/>
	);
};

export const useResourceTypeFilterMenu = ({
	value,
	onChange,
}: Pick<UseFilterMenuOptions, "value" | "onChange">) => {
	const { t: tI18n } = useTranslation("administration");

	const actionOptions: SelectFilterOption[] = ResourceTypes.map((type) => {
		let label: string = capitalize(type);

		if (type === "api_key") {
			label = tI18n("AuditPage.AuditFilter.api_key_23189d55");
		}

		if (type === "git_ssh_key") {
			label = tI18n("AuditPage.AuditFilter.git_ssh_key_e23a9943");
		}

		if (type === "template_version") {
			label = tI18n("AuditPage.AuditFilter.template_version_1e335c28");
		}

		if (type === "workspace_build") {
			label = tI18n("AuditPage.AuditFilter.workspace_build_65dbaa41");
		}

		if (type === "chat_instruction_settings") {
			label = tI18n("AuditPage.AuditFilter.chat_instruction_settings_06aa1db9");
		}

		if (type === "chat_operational_settings") {
			label = tI18n("AuditPage.AuditFilter.chat_operational_settings_bb40b86e");
		}

		return {
			value: type,
			label,
		};
	});
	return useFilterMenu({
		onChange,
		value,
		id: "resourceType",
		getSelectedOption: async () =>
			actionOptions.find((option) => option.value === value) ?? null,
		getOptions: async () => actionOptions,
	});
};

type ResourceTypeFilterMenu = ReturnType<typeof useResourceTypeFilterMenu>;

interface ResourceTypeMenuProps {
	menu: ResourceTypeFilterMenu;
	width?: number;
}

const ResourceTypeMenu: FC<ResourceTypeMenuProps> = ({ menu, width }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<SelectFilter
			label={tI18n("AuditPage.AuditFilter.select_a_resource_type_ae11a03f")}
			placeholder={tI18n("AuditPage.AuditFilter.all_resource_types_6e3a449e")}
			options={menu.searchOptions}
			onSelect={menu.selectOption}
			selectedOption={menu.selectedOption ?? undefined}
			width={width}
		/>
	);
};
