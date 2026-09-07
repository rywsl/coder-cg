import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { AIProvider } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Link } from "#/components/Link/Link";
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
import { addableProviders } from "#/pages/AISettingsPage/ProvidersPage/components/addableProviderTypes";
import { ProviderIcon } from "#/pages/AISettingsPage/ProvidersPage/components/ProviderIcon";
import { ProviderRow } from "#/pages/AISettingsPage/ProvidersPage/components/ProviderRow";
import { docs } from "#/utils/docs";

interface ProvidersPageViewProps {
	isLoading: boolean;
	isFetching: boolean;
	error: unknown;
	providers: AIProvider[];
}

const AddProviderDropdown: React.FC<{ align?: "start" | "end" }> = ({
	align = "end",
}) => {
	const { t: tI18n } = useTranslation("agents");

	const navigate = useNavigate();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					<PlusIcon />
					<span>
						{tI18n(
							"AISettingsPage.ProvidersPage.ProvidersPageView.add_provider_8cd1856b",
						)}
					</span>
					<ChevronDownIcon className="ml-1 size-icon-xs" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align} className="min-w-56">
				<div className="px-2 py-1.5 text-xs font-medium text-content-secondary">
					{tI18n(
						"AISettingsPage.ProvidersPage.ProvidersPageView.select_a_provider_71e2ca7b",
					)}
				</div>
				{addableProviders.map((entry) => (
					<DropdownMenuItem
						key={entry.value}
						onSelect={() =>
							void navigate(
								`/ai/settings/providers/add?type=${encodeURIComponent(entry.value)}`,
							)
						}
					>
						<ProviderIcon provider={entry.value} />
						<span>{entry.label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const ProvidersPageView: React.FC<ProvidersPageViewProps> = ({
	isLoading,
	isFetching,
	error,
	providers,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const navigate = useNavigate();

	return (
		<div>
			<SettingsHeader actions={<AddProviderDropdown />}>
				<SettingsHeaderTitle>
					{tI18n(
						"AISettingsPage.ProvidersPage.ProvidersPageView.providers_996c32b3",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.ProvidersPage.ProvidersPageView.connect_third_party_services_like_openai_anthrop_1b4dcab5",
					)}{" "}
					<Link href={docs("/ai-coder/ai-gateway/setup#configure-providers")}>
						{tI18n(
							"AISettingsPage.ProvidersPage.ProvidersPageView.view_docs_61479fda",
						)}
					</Link>
				</SettingsHeaderDescription>
			</SettingsHeader>
			{Boolean(error) && (
				<div className="mb-4">
					<ErrorAlert error={error} />
				</div>
			)}
			<Table
				aria-label={tI18n(
					"AISettingsPage.ProvidersPage.ProvidersPageView.ai_providers_2c4aed90",
				)}
			>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/3">
							{tI18n(
								"AISettingsPage.ProvidersPage.ProvidersPageView.name_dcd1d522",
							)}
						</TableHead>
						<TableHead className="w-1/3">
							{tI18n(
								"AISettingsPage.ProvidersPage.ProvidersPageView.base_url_70589413",
							)}
						</TableHead>
						<TableHead>
							<span className="sr-only">
								{tI18n(
									"AISettingsPage.ProvidersPage.ProvidersPageView.status_920e413c",
								)}
							</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody size="lg">
					{isLoading || isFetching ? (
						<TableLoader />
					) : providers.length === 0 ? (
						<TableEmpty
							message={tI18n(
								"AISettingsPage.ProvidersPage.ProvidersPageView.no_providers_configured_450fbb4b",
							)}
							cta={<AddProviderDropdown align="start" />}
						/>
					) : (
						providers.map((provider) => (
							<ProviderRow
								key={provider.name}
								provider={provider}
								onClick={() =>
									navigate(`/ai/settings/providers/${provider.name}`)
								}
							/>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default ProvidersPageView;
