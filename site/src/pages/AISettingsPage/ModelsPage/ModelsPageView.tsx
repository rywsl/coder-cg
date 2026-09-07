import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import { type FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import type { ChatModel } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/InputGroup/InputGroup";
import { OrganizationField } from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import { PaginationWidgetBase } from "#/components/PaginationWidget/PaginationWidgetBase";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";
import {
	canManageProviderModels,
	type ProviderState,
} from "#/modules/aiModels/providerStates";
import { ProviderIcon } from "#/pages/AISettingsPage/ProvidersPage/components/ProviderIcon";
import { paginateItems } from "#/utils/paginateItems";
import { ModelRow } from "./components/ModelRow";
import {
	organizationAddModelPath,
	organizationModelPath,
	selectModelOrganizationPath,
	useOrganizationModels,
} from "./organizationModels";

const MODELS_PAGE_SIZE = 10;
const ALL_PROVIDERS_VALUE = "all";

const AddModelDropdown: FC<{
	providerStates: readonly ProviderState[];
	align?: "start" | "end";
}> = ({ providerStates, align = "end" }) => {
	const { t: tI18n } = useTranslation("agents");

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { organization } = useOrganizationModels();
	const manageableProviderStates = providerStates.filter(
		canManageProviderModels,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					<PlusIcon />
					<span>
						{tI18n(
							"AISettingsPage.ModelsPage.ModelsPageView.add_model_b2609f7d",
						)}
					</span>
					<ChevronDownIcon className="ml-1 size-icon-xs" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align} className="min-w-56">
				<div className="px-2 py-1.5 text-xs font-medium text-content-secondary">
					{tI18n(
						"AISettingsPage.ModelsPage.ModelsPageView.select_a_provider_71e2ca7b",
					)}
				</div>
				{manageableProviderStates.length === 0 ? (
					<DropdownMenuItem disabled>
						{tI18n(
							"AISettingsPage.ModelsPage.ModelsPageView.no_providers_available_53c1773b",
						)}
					</DropdownMenuItem>
				) : (
					manageableProviderStates.map((providerState) => (
						<DropdownMenuItem
							key={providerState.key}
							onSelect={() => {
								const next = new URLSearchParams(searchParams);
								next.set("provider", providerState.key);
								void navigate(organizationAddModelPath(organization, next));
							}}
						>
							<ProviderIcon provider={providerState.provider} />
							<span>{providerState.label}</span>
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface ModelsPageViewProps {
	isLoading: boolean;
	loadError: unknown;
	refetchError: unknown;
	models: readonly ChatModel[];
	providerStates: readonly ProviderState[];
	providerTypeByID: ReadonlyMap<string, string>;
	canCreateModel: boolean;
}

const ModelsPageView: FC<ModelsPageViewProps> = ({
	isLoading,
	loadError,
	refetchError,
	models,
	providerStates,
	providerTypeByID,
	canCreateModel,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { organization, accessibleOrganizations } = useOrganizationModels();
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [providerFilter, setProviderFilter] =
		useState<string>(ALL_PROVIDERS_VALUE);

	const providerKeyByModelId = useMemo(() => {
		const map = new Map<string, string>();
		for (const providerState of providerStates) {
			for (const providerModel of providerState.models) {
				map.set(providerModel.id, providerState.key);
			}
		}
		return map;
	}, [providerStates]);

	const providerLabelByModelId = useMemo(() => {
		const map = new Map<string, string>();
		for (const providerState of providerStates) {
			for (const providerModel of providerState.models) {
				map.set(providerModel.id, providerState.label);
			}
		}
		return map;
	}, [providerStates]);

	const hasProviderByModelId = useMemo(() => {
		const map = new Map<string, boolean>();
		for (const providerState of providerStates) {
			for (const providerModel of providerState.models) {
				map.set(providerModel.id, true);
			}
		}
		return map;
	}, [providerStates]);

	const providerEnabledByModelId = useMemo(() => {
		const map = new Map<string, boolean>();
		for (const providerState of providerStates) {
			for (const providerModel of providerState.models) {
				map.set(providerModel.id, providerState.providerDescriptor.enabled);
			}
		}
		return map;
	}, [providerStates]);

	const filteredModels = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		return models.filter((model) => {
			if (
				providerFilter !== ALL_PROVIDERS_VALUE &&
				providerKeyByModelId.get(model.id) !== providerFilter
			) {
				return false;
			}
			if (normalizedQuery.length === 0) {
				return true;
			}
			const haystack = [
				model.display_name,
				model.model,
				providerLabelByModelId.get(model.id) ?? "",
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [
		models,
		providerFilter,
		providerKeyByModelId,
		providerLabelByModelId,
		searchQuery,
	]);

	const { pagedItems, clampedPage, hasPreviousPage, hasNextPage } =
		paginateItems(filteredModels, MODELS_PAGE_SIZE, page);

	const hasModels = models.length > 0;
	const hasFilters =
		searchQuery.trim().length > 0 || providerFilter !== ALL_PROVIDERS_VALUE;

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setPage(1);
	};

	const handleProviderChange = (value: string) => {
		setProviderFilter(value);
		setPage(1);
	};

	return (
		<div>
			<SettingsHeader
				actions={
					canCreateModel ? (
						<AddModelDropdown providerStates={providerStates} />
					) : undefined
				}
			>
				<SettingsHeaderTitle>
					{tI18n("AISettingsPage.ModelsPage.ModelsPageView.models_d17d2d78")}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.ModelsPage.ModelsPageView.choose_which_models_from_your_configured_provide_caebc21b",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			{(loadError ?? refetchError) != null && (
				<div className="mb-4">
					<ErrorAlert error={loadError ?? refetchError} />
				</div>
			)}
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="flex-1">
					<InputGroup>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
						<InputGroupInput
							type="search"
							placeholder={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.search_models_37b90680",
							)}
							aria-label={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.search_models_10421935",
							)}
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
						/>
					</InputGroup>
				</div>
				{accessibleOrganizations.length > 1 && (
					<OrganizationField
						id="models-organization"
						organization={organization}
						organizations={accessibleOrganizations}
						showLabel={false}
						className="w-full sm:w-60"
						triggerClassName="w-full sm:w-60"
						optionsTabbable
						onChange={(nextOrganization) => {
							void navigate(
								selectModelOrganizationPath(
									"/ai/settings/models",
									nextOrganization,
									searchParams,
								),
							);
						}}
					/>
				)}
				<Select value={providerFilter} onValueChange={handleProviderChange}>
					<SelectTrigger
						className="w-full shadow-none sm:w-60"
						aria-label={tI18n(
							"AISettingsPage.ModelsPage.ModelsPageView.filter_by_provider_82e78a60",
						)}
					>
						<SelectValue
							placeholder={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.all_providers_20e56db7",
							)}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_PROVIDERS_VALUE}>
							{tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.all_providers_20e56db7",
							)}
						</SelectItem>
						{providerStates.map((providerState) => (
							<SelectItem key={providerState.key} value={providerState.key}>
								<span className="flex items-center gap-2">
									<ProviderIcon provider={providerState.provider} />
									{providerState.label}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Table
				className="table-fixed"
				aria-label={tI18n(
					"AISettingsPage.ModelsPage.ModelsPageView.models_d17d2d78",
				)}
			>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/3">
							{tI18n("AISettingsPage.ModelsPage.ModelsPageView.name_dcd1d522")}
						</TableHead>
						<TableHead className="w-1/4">
							{tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.provider_472590ae",
							)}
						</TableHead>
						<TableHead className="w-1/4">
							{tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.context_limit_284d7b18",
							)}
						</TableHead>
						<TableHead className="w-12">
							<span className="sr-only">
								{tI18n(
									"AISettingsPage.ModelsPage.ModelsPageView.open_model_a24a11a9",
								)}
							</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody size="lg">
					{isLoading ? (
						<TableLoader />
					) : loadError != null ? null : !hasModels ? (
						<TableEmpty
							message={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.no_models_configured_fb2770bd",
							)}
							description={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.configured_models_will_appear_here_62b0874b",
							)}
							cta={
								canCreateModel ? (
									<AddModelDropdown
										providerStates={providerStates}
										align="start"
									/>
								) : undefined
							}
						/>
					) : filteredModels.length === 0 ? (
						<TableEmpty
							message={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.no_models_match_your_filters_f586615d",
							)}
							description={tI18n(
								"AISettingsPage.ModelsPage.ModelsPageView.try_a_different_search_term_or_provider_6bf6cbb8",
							)}
						/>
					) : (
						pagedItems.map((model) => (
							<ModelRow
								key={model.id}
								model={model}
								providerLabel={providerLabelByModelId.get(model.id) ?? ""}
								providerTypeByID={providerTypeByID}
								hasProvider={hasProviderByModelId.get(model.id) ?? false}
								providerEnabled={
									providerEnabledByModelId.get(model.id) ?? false
								}
								onClick={() =>
									void navigate(
										organizationModelPath(organization, model.id, searchParams),
									)
								}
							/>
						))
					)}
				</TableBody>
			</Table>
			{filteredModels.length > 0 && (
				<div className="flex items-center justify-between pt-4">
					<div className="flex-1">
						<PaginationWidgetBase
							currentPage={clampedPage}
							pageSize={MODELS_PAGE_SIZE}
							totalRecords={filteredModels.length}
							onPageChange={setPage}
							hasPreviousPage={hasPreviousPage}
							hasNextPage={hasNextPage}
						/>
					</div>
					<span className="text-xs text-content-secondary">
						{tI18n("AISettingsPage.ModelsPage.ModelsPageView.showing_7282e1fb")}
						<strong className="font-medium">{pagedItems.length}</strong>{" "}
						{tI18n("AISettingsPage.ModelsPage.ModelsPageView.of_4acb731c")}
						<strong className="font-medium">{filteredModels.length}</strong>{" "}
						{tI18n("AISettingsPage.ModelsPage.ModelsPageView.models_8edcc26c")}
						{hasFilters && (
							<>
								{" "}
								{tI18n(
									"AISettingsPage.ModelsPage.ModelsPageView.filtered_from_50f95c59",
								)}{" "}
								<strong className="font-medium">{models.length}</strong>)
							</>
						)}
					</span>
				</div>
			)}
		</div>
	);
};

export default ModelsPageView;
