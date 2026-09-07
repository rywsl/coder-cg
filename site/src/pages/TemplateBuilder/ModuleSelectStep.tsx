import { PackageIcon, SearchIcon } from "lucide-react";
import { type FC, type PropsWithChildren, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { templateBuilderModules } from "#/api/queries/templateBuilder";
import type {
	TemplateBuilderComposeModule,
	TemplateBuilderModule,
} from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { SearchField } from "#/components/SearchField/SearchField";
import { Tabs, TabsList, TabsTrigger } from "#/components/Tabs/Tabs";
import { useKebabMenu } from "#/components/Tabs/utils/useKebabMenu";
import { useFuzzySearch } from "#/pages/TemplateBuilder/hooks/useFuzzySearch";
import {
	TemplateBuilderSubtitle,
	TemplateBuilderTitle,
} from "#/pages/TemplateBuilder/TemplateBuilderHeader";
import { ModuleCard } from "./ModuleCard";
import { sortByPriority } from "./sortByPriority";
import {
	moduleHasConfigurableVars,
	type SelectedModuleMeta,
} from "./wizardState";

interface ModuleSelectStepProps {
	baseId: string;
	selectedModuleIds: string[];
	onChangeModules: (
		modules: TemplateBuilderComposeModule[],
		meta: SelectedModuleMeta[],
	) => void;
}

function toMeta(m: TemplateBuilderModule): SelectedModuleMeta {
	return {
		id: m.id,
		name: m.display_name,
		iconUrl: m.icon,
		hasConfigurableVars: moduleHasConfigurableVars(m),
	};
}

// TODO add this to the API response so we don't have to construct it manually here.
function moduleDetailsUrl(moduleId: string): string {
	return `https://registry.coder.com/modules/${moduleId}`;
}

interface ModuleConflict {
	moduleA: TemplateBuilderModule;
	moduleB: TemplateBuilderModule;
}

const ModuleName: FC<PropsWithChildren> = ({ children }) => {
	return (
		<code className="text-content-secondary bg-surface-tertiary mx-1 first:ml-0 px-1.5 py-1 rounded-sm">
			{children}
		</code>
	);
};

const ConflictWarning: FC<ModuleConflict> = ({ moduleA, moduleB }) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<div>
			<ModuleName>{moduleA.display_name}</ModuleName>
			{tI18n("TemplateBuilder.ModuleSelectStep.and_2e5f7696")}{" "}
			<ModuleName>{moduleB.display_name}</ModuleName>
			{tI18n(
				"TemplateBuilder.ModuleSelectStep.are_conflicting_modules_you_can_still_continue_b_a0ca95ae",
			)}
		</div>
	);
};

// Preferred display order for modules. Modules in this list appear first,
// in this order. Unlisted modules appear after, in their original order.
const MODULE_PRIORITY: readonly string[] = [
	"claude-code",
	"codex",
	"cursor",
	"vscode-desktop",
	"code-server",
	"jetbrains",
	"vscode-web",
	"zed",
	"antigravity",
	"windsurf",
	"git-clone",
	"dotfiles",
	"git-config",
	"personalize",
	"filebrowser",
	"kasmvnc",
];

export const ModuleSelectStep: FC<ModuleSelectStepProps> = ({
	baseId,
	selectedModuleIds,
	onChangeModules,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const { data, error, isLoading } = useQuery(templateBuilderModules(baseId));
	const [moduleSearchText, setModuleSearchText] = useState("");
	const modules = data?.modules ?? [];
	const doesBaseTemplateHaveModules = modules.length > 0;
	const sortedModules = sortByPriority(modules, MODULE_PRIORITY);
	const categories = [
		...new Set(sortedModules.map((module) => module.category)),
	].sort((a, b) => a.localeCompare(b));

	const [selectedFilterTab, setSelectedFilterTab] = useState("All");

	const searchedModules = useFuzzySearch({
		allItems: sortedModules,
		searchText: moduleSearchText,
		searchProperties: ["display_name", "description"],
	});

	const searchedCategoryCounts = new Map<string, number>();
	for (const module of searchedModules) {
		searchedCategoryCounts.set(
			module.category,
			(searchedCategoryCounts.get(module.category) ?? 0) + 1,
		);
	}
	const filterTabs = [
		{ value: "All", count: searchedModules.length },
		...categories.map((value) => ({
			value,
			count: searchedCategoryCounts.get(value) ?? 0,
		})),
	];
	const { containerRef, visibleTabs: visibleFilterTabs } = useKebabMenu({
		tabs: filterTabs,
		enabled: true,
		isActive: true,
	});

	const visibleModules =
		selectedFilterTab === "All"
			? searchedModules
			: searchedModules.filter(
					(module) => module.category === selectedFilterTab,
				);

	const selectedSet = useMemo(
		() => new Set(selectedModuleIds),
		[selectedModuleIds],
	);

	const conflicts = useMemo<ModuleConflict[]>(() => {
		const warnings: string[] = [];
		// Loop through the selected modules and check for conflicts. We sort the
		// pair of conflicting module IDs alphabetically and join them with a "+"
		// to create a unique identifier for the pair.
		for (const id of selectedSet) {
			const m = modules.find((mod) => mod.id === id);
			if (!m) continue;
			for (const conflictId of m.conflicts_with) {
				if (selectedSet.has(conflictId)) {
					const pair = [id, conflictId].sort().join("+");
					if (!warnings.includes(pair)) {
						warnings.push(pair);
					}
				}
			}
		}
		// take the computed warnings and return the actual modules that have
		// conflicts so we can display their names in the UI.
		return warnings.map((pair) => {
			const [a, b] = pair.split("+");
			const moduleA = modules.find((m) => m.id === a)!;
			const moduleB = modules.find((m) => m.id === b)!;
			return { moduleA, moduleB };
		});
	}, [selectedSet, modules]);

	if (isLoading) {
		return <Loader />;
	}

	if (error) {
		return <ErrorAlert error={error} />;
	}

	const handleToggle = (target: TemplateBuilderModule) => {
		const isSelected = selectedSet.has(target.id);
		let nextIds: string[];
		if (isSelected) {
			nextIds = selectedModuleIds.filter((id) => id !== target.id);
		} else {
			nextIds = [...selectedModuleIds, target.id];
		}

		const modulesById = new Map(modules.map((m) => [m.id, m]));
		const nextModules: TemplateBuilderComposeModule[] = nextIds.map((id) => ({
			id,
		}));
		const nextMeta: SelectedModuleMeta[] = nextIds
			.map((id) => modulesById.get(id))
			.filter((m): m is TemplateBuilderModule => m != null)
			.map(toMeta);

		onChangeModules(nextModules, nextMeta);
	};

	return (
		<div>
			<TemplateBuilderTitle>
				{tI18n("TemplateBuilder.ModuleSelectStep.select_modules_7aaaaa6c")}
			</TemplateBuilderTitle>
			<TemplateBuilderSubtitle>
				{tI18n(
					"TemplateBuilder.ModuleSelectStep.add_pre_built_tools_and_integrations_module_vers_5b765e12",
				)}
			</TemplateBuilderSubtitle>
			<SearchField
				value={moduleSearchText}
				onChange={setModuleSearchText}
				placeholder={tI18n(
					"TemplateBuilder.ModuleSelectStep.search_modules_6919d5ac",
				)}
				className="my-4"
			/>
			<Tabs
				value={selectedFilterTab}
				onValueChange={setSelectedFilterTab}
				className="my-4"
			>
				<TabsList ref={containerRef}>
					{visibleFilterTabs.map((tab) => (
						<TabsTrigger key={tab.value} value={tab.value}>
							<PackageIcon className="size-icon-sm" />
							{tab.value} ({tab.count})
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{visibleModules.length ? (
					visibleModules.map((m) => (
						<ModuleCard
							key={m.id}
							name={m.display_name}
							description={m.description}
							iconUrl={m.icon}
							detailsUrl={moduleDetailsUrl(m.id)}
							selected={selectedSet.has(m.id)}
							onSelect={() => handleToggle(m)}
						/>
					))
				) : (
					<div className="col-span-full my-12 flex flex-col items-center gap-1 text-content-secondary">
						<SearchIcon />
						<p className="m-0 text-xs font-normal">
							{doesBaseTemplateHaveModules
								? tI18n(
										"TemplateBuilder.ModuleSelectStep.no_module_matched_your_search_be27e8af",
									)
								: tI18n(
										"TemplateBuilder.ModuleSelectStep.no_modules_available_for_this_base_template_67f50d26",
									)}
						</p>
					</div>
				)}
			</div>
			{conflicts.length > 0 && (
				<Alert severity="warning" prominent className="mt-6">
					<AlertTitle>
						{tI18n(
							"TemplateBuilder.ModuleSelectStep.conflicting_modules_selected_d0375d1d",
						)}
					</AlertTitle>
					<AlertDescription>
						{conflicts.map(({ moduleA, moduleB }) => (
							<ConflictWarning
								key={`${moduleA.id}+${moduleB.id}`}
								moduleA={moduleA}
								moduleB={moduleB}
							/>
						))}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
};
