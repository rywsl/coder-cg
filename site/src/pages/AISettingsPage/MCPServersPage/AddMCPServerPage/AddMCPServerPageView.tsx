import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { pageTitle } from "#/utils/page";
import { MCPServerForm } from "../components/MCPServerForm";
import { OrganizationPicker } from "../components/OrganizationPicker";
import { mcpServersPath } from "../organizationParam";

interface AddMCPServerPageViewProps {
	isSaving: boolean;
	canCreate: boolean;
	canViewServerList: boolean;
	canSelectUserOIDC: boolean;
	organizations: readonly TypesGen.Organization[];
	organization: TypesGen.Organization;
	onSelectOrganization: (organization: TypesGen.Organization) => void;
	onCreateServer: (
		req: TypesGen.CreateMCPServerConfigRequest,
	) => Promise<unknown>;
	onCancel: () => void;
}

const AddMCPServerPageView: FC<AddMCPServerPageViewProps> = ({
	isSaving,
	canCreate,
	canViewServerList,
	canSelectUserOIDC,
	organizations,
	organization,
	onSelectOrganization,
	onCreateServer,
	onCancel,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"AISettingsPage.MCPServersPage.AddMCPServerPage.AddMCPServerPageView.add_server_1099b2a9",
					),
					tI18n(
						"AISettingsPage.MCPServersPage.AddMCPServerPage.AddMCPServerPageView.ai_settings_a8e5e2c6",
					),
				)}
			</title>
			{canCreate ? (
				<MCPServerForm
					listPath={
						canViewServerList ? mcpServersPath(organization) : undefined
					}
					isSaving={isSaving}
					canSelectUserOIDC={canSelectUserOIDC}
					organizationPicker={
						<OrganizationPicker
							id="mcp-add-organization"
							className="w-full"
							organizations={organizations}
							organization={organization}
							onChange={onSelectOrganization}
							disabled={isSaving}
							showSingleOrganization
						/>
					}
					onCreateServer={onCreateServer}
					onCancel={canViewServerList ? onCancel : undefined}
				/>
			) : (
				<>
					<OrganizationPicker
						id="mcp-add-organization"
						className="mb-6"
						organizations={organizations}
						organization={organization}
						onChange={onSelectOrganization}
						disabled={isSaving}
						showSingleOrganization
					/>
					<Alert severity="error" prominent>
						<AlertTitle>
							{tI18n(
								"AISettingsPage.MCPServersPage.AddMCPServerPage.AddMCPServerPageView.you_cannot_add_servers_to_this_organization_f96a481c",
							)}
						</AlertTitle>
						<AlertDescription>
							{tI18n(
								"AISettingsPage.MCPServersPage.AddMCPServerPage.AddMCPServerPageView.choose_an_organization_where_you_have_permission_f1af9e8f",
							)}
						</AlertDescription>
					</Alert>
				</>
			)}
		</>
	);
};

export default AddMCPServerPageView;
