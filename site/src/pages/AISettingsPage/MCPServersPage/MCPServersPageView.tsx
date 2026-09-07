import { PlusIcon, SearchIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/InputGroup/InputGroup";
import { getOrganizationLabel } from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
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
import { MCPServerRow } from "./components/MCPServerRow";
import { OrganizationPicker } from "./components/OrganizationPicker";
import { addMCPServerPath, updateMCPServerPath } from "./organizationParam";

interface MCPServersPageViewProps {
	isLoading: boolean;
	error: unknown;
	servers: readonly TypesGen.MCPServerConfig[];
	organizations: readonly TypesGen.Organization[];
	organization: TypesGen.Organization;
	addOrganization?: TypesGen.Organization;
	addOrganizations: readonly TypesGen.Organization[];
	canOpenServer: boolean;
	onSelectOrganization: (organization: TypesGen.Organization) => void;
}

const MCPServersPageView: FC<MCPServersPageViewProps> = ({
	isLoading,
	error,
	servers,
	organizations,
	organization,
	addOrganization,
	addOrganizations,
	canOpenServer,
	onSelectOrganization,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const filteredServers =
		normalizedQuery.length === 0
			? servers
			: servers.filter((server) =>
					[server.display_name, server.slug, server.url]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery),
				);
	// Disambiguate against every organization sharing the page context:
	// other creation targets and the currently selected organization.
	const addButtonLabel =
		addOrganization && addOrganization.id !== organization.id
			? tI18n(
					"AISettingsPage.MCPServersPage.MCPServersPageView.add_server_to_value0_8aae4cf2",
					{
						value0: getOrganizationLabel(addOrganization, [
							...addOrganizations,
							organization,
						]),
					},
				)
			: undefined;
	const goToAddServer = () => {
		if (addOrganization) {
			void navigate(addMCPServerPath(addOrganization));
		}
	};

	return (
		<div>
			<SettingsHeader
				actions={
					addOrganization && (
						<Button
							variant="outline"
							onClick={goToAddServer}
							aria-label={addButtonLabel}
							title={addButtonLabel}
						>
							<PlusIcon />
							<span>
								{tI18n(
									"AISettingsPage.MCPServersPage.MCPServersPageView.add_server_1099b2a9",
								)}
							</span>
						</Button>
					)
				}
			>
				<SettingsHeaderTitle>
					{tI18n(
						"AISettingsPage.MCPServersPage.MCPServersPageView.mcp_servers_22a7559f",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.MCPServersPage.MCPServersPageView.configure_external_mcp_servers_that_provide_addi_e28c14ac",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="flex-1">
					<InputGroup>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
						<InputGroupInput
							type="search"
							placeholder={tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.search_servers_10ae62d6",
							)}
							aria-label={tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.search_servers_3d7d709f",
							)}
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
						/>
					</InputGroup>
				</div>
				<OrganizationPicker
					id="mcp-servers-organization"
					className="w-full sm:w-60"
					organizations={organizations}
					organization={organization}
					onChange={onSelectOrganization}
					showLabel={false}
				/>
			</div>
			{Boolean(error) && (
				<div className="mb-4">
					<ErrorAlert error={error} />
				</div>
			)}
			<Table
				className="table-fixed min-w-[640px]"
				aria-label={tI18n(
					"AISettingsPage.MCPServersPage.MCPServersPageView.mcp_servers_22a7559f",
				)}
			>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/2">
							{tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.name_dcd1d522",
							)}
						</TableHead>
						<TableHead className="w-1/5">
							{tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.auth_method_b765e993",
							)}
						</TableHead>
						<TableHead className="w-1/5">
							{tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.availability_12f67f85",
							)}
						</TableHead>
						<TableHead className="w-12">
							<span className="sr-only">
								{tI18n(
									"AISettingsPage.MCPServersPage.MCPServersPageView.open_server_52017467",
								)}
							</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody size="lg">
					{isLoading ? (
						<TableLoader />
					) : !error && servers.length === 0 ? (
						<TableEmpty
							message={tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.no_mcp_servers_configured_013e6b9d",
							)}
							description={tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.add_a_server_to_give_agents_access_to_external_t_98da1e5c",
							)}
							cta={
								addOrganization ? (
									<Button
										variant="outline"
										onClick={goToAddServer}
										aria-label={addButtonLabel}
										title={addButtonLabel}
									>
										<PlusIcon />
										<span>
											{tI18n(
												"AISettingsPage.MCPServersPage.MCPServersPageView.add_server_1099b2a9",
											)}
										</span>
									</Button>
								) : undefined
							}
						/>
					) : servers.length > 0 && filteredServers.length === 0 ? (
						<TableEmpty
							message={tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.no_servers_match_your_search_c7e9efb1",
							)}
							description={tI18n(
								"AISettingsPage.MCPServersPage.MCPServersPageView.try_a_different_search_term_36b89662",
							)}
						/>
					) : (
						filteredServers.map((server) => (
							<MCPServerRow
								key={server.id}
								server={server}
								onClick={
									canOpenServer
										? () =>
												void navigate(
													updateMCPServerPath(server.id, organization),
												)
										: undefined
								}
							/>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default MCPServersPageView;
