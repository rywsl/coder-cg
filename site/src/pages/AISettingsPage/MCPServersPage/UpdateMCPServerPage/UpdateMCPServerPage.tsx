import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	Navigate,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { getErrorMessage, isApiError } from "#/api/errors";
import {
	deleteMCPServerConfig,
	mcpServerConfig,
	updateMCPServerConfig,
} from "#/api/queries/chats";
import { organizationsPermissions } from "#/api/queries/organizations";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import {
	mcpServersPath,
	orgSearchParam,
	selectOrganization,
} from "../organizationParam";
import UpdateMCPServerPageView from "./UpdateMCPServerPageView";

const UpdateMCPServerPage: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { permissions } = useAuthenticated();
	const { organizations } = useDashboard();
	const { serverId } = useParams<{ serverId: string }>();
	const [searchParams] = useSearchParams();
	const organizationPermissionsQuery = useQuery({
		...organizationsPermissions(
			organizations.map((organization) => organization.id),
		),
		enabled: !permissions.editDeploymentConfig,
	});
	const manageableOrganizations = permissions.editDeploymentConfig
		? organizations
		: organizations.filter((organization) => {
				const organizationPermissions =
					organizationPermissionsQuery.data?.[organization.id];
				return Boolean(
					organizationPermissions?.updateMCPServerConfig ||
						organizationPermissions?.deleteMCPServerConfig ||
						organizationPermissions?.shareMCPServerConfig,
				);
			});
	const requestedOrganizationName = searchParams.get(orgSearchParam);
	const organization =
		requestedOrganizationName === null
			? manageableOrganizations.length > 0
				? selectOrganization(manageableOrganizations, null)
				: undefined
			: manageableOrganizations.find(
					(organization) => organization.name === requestedOrganizationName,
				);
	const organizationPermissions = organization
		? organizationPermissionsQuery.data?.[organization.id]
		: undefined;
	const canUpdate =
		permissions.editDeploymentConfig ||
		Boolean(organizationPermissions?.updateMCPServerConfig);
	const canDelete =
		permissions.editDeploymentConfig ||
		Boolean(organizationPermissions?.deleteMCPServerConfig);
	const canShare =
		permissions.editDeploymentConfig ||
		Boolean(organizationPermissions?.shareMCPServerConfig);
	const canManage = canUpdate || canDelete || canShare;
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const serverQuery = useQuery({
		...mcpServerConfig(organization?.id ?? "", serverId ?? ""),
		enabled: Boolean(serverId) && canManage,
	});
	const server = serverQuery.data;
	// The backend rejects any update touching a user_oidc server without
	// deployment permission, so org-level update grants cannot manage them.
	const canUpdateServer =
		permissions.editDeploymentConfig ||
		(canUpdate && server?.auth_type !== "user_oidc");
	const updateMutation = useMutation(
		updateMCPServerConfig(queryClient, organization?.id ?? ""),
	);
	const deleteMutation = useMutation(
		deleteMCPServerConfig(queryClient, organization?.id ?? ""),
	);
	// A 404 must win over cached data: a refetch failure keeps stale data,
	// which would otherwise render a form for a deleted or concealed server.
	const notFound =
		serverQuery.isError &&
		isApiError(serverQuery.error) &&
		serverQuery.error.response.status === 404;
	const listPath = organization
		? mcpServersPath(organization)
		: "/ai/settings/mcp-servers";

	return (
		<RequirePermission
			isFeatureVisible={
				permissions.editDeploymentConfig ||
				permissions.updateAnyMCPServerConfig ||
				permissions.deleteAnyMCPServerConfig ||
				organizationPermissionsQuery.data === undefined ||
				manageableOrganizations.length > 0
			}
		>
			{organizationPermissionsQuery.isLoadingError ? (
				<ErrorAlert error={organizationPermissionsQuery.error} />
			) : !permissions.editDeploymentConfig &&
				!organizationPermissionsQuery.data ? (
				<Loader />
			) : (
				<RequirePermission
					isFeatureVisible={canManage && Boolean(organization)}
				>
					{organizationPermissionsQuery.isRefetchError && (
						<div className="mb-4">
							<ErrorAlert error={organizationPermissionsQuery.error} />
						</div>
					)}
					{!serverId ? (
						<Navigate to={listPath} replace />
					) : serverQuery.isLoading ? (
						<>
							<title>
								{pageTitle(
									tI18n(
										"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.loading_47d2a515",
									),
									tI18n(
										"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.ai_settings_a8e5e2c6",
									),
								)}
							</title>
							<Loader fullscreen />
						</>
					) : serverQuery.isLoadingError && !notFound ? (
						<>
							<title>
								{pageTitle(
									tI18n(
										"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.mcp_servers_22a7559f",
									),
									tI18n(
										"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.ai_settings_a8e5e2c6",
									),
								)}
							</title>
							<div className="mb-4">
								<ErrorAlert error={serverQuery.error} />
							</div>
						</>
					) : notFound || !server || !organization ? (
						<Navigate to={listPath} replace />
					) : (
						<>
							{serverQuery.isRefetchError && (
								<div className="mb-4">
									<ErrorAlert error={serverQuery.error} />
								</div>
							)}
							<UpdateMCPServerPageView
								server={server}
								organizations={manageableOrganizations}
								organization={organization}
								listPath={listPath}
								isSaving={updateMutation.isPending}
								isDeleting={deleteMutation.isPending}
								canSelectUserOIDC={permissions.editDeploymentConfig}
								canShareServer={canShare}
								onCancel={() => void navigate(listPath)}
								onUpdateServer={
									canUpdateServer
										? async (id, req) => {
												try {
													const updated = await updateMutation.mutateAsync({
														id,
														req,
													});
													toast.success(
														tI18n(
															"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.mcp_server_value0_updated_194ea8ce",
															{
																value0: updated.display_name,
															},
														),
													);
													await navigate(listPath);
												} catch (error) {
													toast.error(
														getErrorMessage(
															error,
															tI18n(
																"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.failed_to_update_mcp_server_f5f3d958",
															),
														),
													);
												}
											}
										: undefined
								}
								onDeleteServer={
									canDelete
										? async (id) => {
												try {
													await deleteMutation.mutateAsync(id);
													toast.success(
														tI18n(
															"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.mcp_server_value0_deleted_8e8b3c10",
															{
																value0: server.display_name,
															},
														),
													);
													await navigate(listPath, { replace: true });
												} catch (error) {
													toast.error(
														getErrorMessage(
															error,
															tI18n(
																"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.failed_to_delete_mcp_server_5a77a092",
															),
														),
													);
												}
											}
										: undefined
								}
								onToggleEnabled={
									canUpdateServer
										? (enabled) => {
												updateMutation.mutate(
													{ id: server.id, req: { enabled } },
													{
														onSuccess: () => {
															toast.success(
																tI18n(
																	"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.mcp_server_value0_value1_d62ccb64",
																	{
																		value0: server.display_name,
																		value1: enabled ? "enabled" : "disabled",
																	},
																),
															);
														},
														onError: (error) => {
															toast.error(
																getErrorMessage(
																	error,
																	tI18n(
																		"AISettingsPage.MCPServersPage.UpdateMCPServerPage.UpdateMCPServerPage.failed_to_value0_mcp_server_3f978f99",
																		{
																			value0: enabled ? "enable" : "disable",
																		},
																	),
																),
															);
														},
													},
												);
											}
										: undefined
								}
							/>
						</>
					)}
				</RequirePermission>
			)}
		</RequirePermission>
	);
};

export default UpdateMCPServerPage;
