import { lazy, Suspense } from "react";
import {
	createBrowserRouter,
	createRoutesFromChildren,
	Navigate,
	Outlet,
	Route,
	ScrollRestoration,
} from "react-router";
import { communityUIHiddenRoutes } from "./communityPolicy";
import { GlobalErrorBoundary } from "./components/ErrorBoundary/GlobalErrorBoundary";
import { Loader } from "./components/Loader/Loader";
import { RequireAuth } from "./contexts/auth/RequireAuth";
import { DashboardLayout } from "./modules/dashboard/DashboardLayout";
import { AISettingsIndexRedirect } from "./pages/AISettingsPage/AISettingsIndexRedirect";
import { ModelDefaultsRedirect } from "./pages/AISettingsPage/ModelsPage/ModelDefaultsRedirect";
import { HealthLayout } from "./pages/HealthPage/HealthLayout";
import LoginOAuthDevicePage from "./pages/LoginOAuthDevicePage/LoginOAuthDevicePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import { SetupPage } from "./pages/SetupPage/SetupPage";
import { TemplateLayout } from "./pages/TemplatePage/TemplateLayout";
import { TemplateRedirectController } from "./pages/TemplatePage/TemplateRedirectController";
import { TemplateSettingsLayout } from "./pages/TemplateSettingsPage/TemplateSettingsLayout";
import TemplatesPage from "./pages/TemplatesPage/TemplatesPage";
import UserSettingsLayout from "./pages/UserSettingsPage/Layout";
import UsersPage from "./pages/UsersPage/UsersPage";
import { WorkspaceSettingsLayout } from "./pages/WorkspaceSettingsPage/WorkspaceSettingsLayout";
import WorkspacesPage from "./pages/WorkspacesPage/WorkspacesPage";

// Lazy load pages
// - Pages that are secondary, not in the main navigation or not usually accessed
// - Pages that use heavy dependencies like charts or time libraries
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));
const DeploymentSettingsLayout = lazy(
	() => import("./modules/management/DeploymentSettingsLayout"),
);
const DeploymentConfigProvider = lazy(
	() => import("./modules/management/DeploymentConfigProvider"),
);
const OrganizationSidebarLayout = lazy(
	() => import("./modules/management/OrganizationSidebarLayout"),
);
const OrganizationSettingsLayout = lazy(
	() => import("./modules/management/OrganizationSettingsLayout"),
);
const CliAuthPage = lazy(() => import("./pages/CliAuthPage/CliAuthPage"));
const CliInstallPage = lazy(
	() => import("./pages/CliInstallPage/CliInstallPage"),
);
const AccountPage = lazy(
	() => import("./pages/UserSettingsPage/AccountPage/AccountPage"),
);
const AppearancePage = lazy(
	() => import("./pages/UserSettingsPage/AppearancePage/AppearancePage"),
);
const SchedulePage = lazy(
	() => import("./pages/UserSettingsPage/SchedulePage/SchedulePage"),
);
const SecurityPage = lazy(
	() => import("./pages/UserSettingsPage/SecurityPage/SecurityPage"),
);
const SSHKeysPage = lazy(
	() => import("./pages/UserSettingsPage/SSHKeysPage/SSHKeysPage"),
);
const TokensPage = lazy(
	() => import("./pages/UserSettingsPage/TokensPage/TokensPage"),
);
const SecretsPage = lazy(
	() => import("./pages/UserSettingsPage/SecretsPage/SecretsPage"),
);
const CreateUserPage = lazy(
	() => import("./pages/CreateUserPage/CreateUserPage"),
);
const EditUserPage = lazy(() => import("./pages/EditUserPage/EditUserPage"));
const WorkspaceBuildPage = lazy(
	() => import("./pages/WorkspaceBuildPage/WorkspaceBuildPage"),
);
const WorkspacePage = lazy(() => import("./pages/WorkspacePage/WorkspacePage"));
const LocalPreviewPage = lazy(
	() => import("./pages/LocalPreviewPage/LocalPreviewPage"),
);
const WorkspaceSchedulePage = lazy(
	() =>
		import(
			"./pages/WorkspaceSettingsPage/WorkspaceSchedulePage/WorkspaceSchedulePage"
		),
);
const WorkspaceParametersPage = lazy(
	() =>
		import(
			"./pages/WorkspaceSettingsPage/WorkspaceParametersPage/WorkspaceParametersPage"
		),
);
const WorkspaceSharingPage = lazy(
	() =>
		import(
			"./pages/WorkspaceSettingsPage/WorkspaceSharingPage/WorkspaceSharingPage"
		),
);
const TerminalPage = lazy(() => import("./pages/TerminalPage/TerminalPage"));
const TemplateResourcesPage = lazy(
	() =>
		import("./pages/TemplatePage/TemplateResourcesPage/TemplateResourcesPage"),
);
const CreateWorkspacePage = lazy(
	() => import("./pages/CreateWorkspacePage/CreateWorkspacePage"),
);
const OverviewPage = lazy(
	() => import("./pages/DeploymentSettingsPage/OverviewPage/OverviewPage"),
);
const SecuritySettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/SecuritySettingsPage/SecuritySettingsPage"
		),
);
const AppearanceSettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/AppearanceSettingsPage/AppearanceSettingsPage"
		),
);
const UserAuthSettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/UserAuthSettingsPage/UserAuthSettingsPage"
		),
);
const ExternalAuthSettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/ExternalAuthSettingsPage/ExternalAuthSettingsPage"
		),
);
const OAuth2AppsSettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/OAuth2AppsSettingsPage/OAuth2AppsSettingsPage"
		),
);
const EditOAuth2AppPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/OAuth2AppsSettingsPage/EditOAuth2AppPage"
		),
);
const CreateOAuth2AppPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/OAuth2AppsSettingsPage/CreateOAuth2AppPage"
		),
);
const NetworkSettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/NetworkSettingsPage/NetworkSettingsPage"
		),
);
const ObservabilitySettingsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/ObservabilitySettingsPage/ObservabilitySettingsPage"
		),
);
const ExternalAuthPage = lazy(
	() => import("./pages/ExternalAuthPage/ExternalAuthPage"),
);
const UserExternalAuthSettingsPage = lazy(
	() => import("./pages/UserSettingsPage/ExternalAuthPage/ExternalAuthPage"),
);
const UserOAuth2ProviderSettingsPage = lazy(
	() =>
		import("./pages/UserSettingsPage/OAuth2ProviderPage/OAuth2ProviderPage"),
);
const TemplateVersionPage = lazy(
	() => import("./pages/TemplateVersionPage/TemplateVersionPage"),
);
const TemplateVersionEditorPage = lazy(
	() => import("./pages/TemplateVersionEditorPage/TemplateVersionEditorPage"),
);
const CreateTemplateGalleryPage = lazy(
	() => import("./pages/CreateTemplateGalleryPage/CreateTemplateGalleryPage"),
);
const StarterTemplatePage = lazy(
	() => import("./pages/StarterTemplatePage/StarterTemplatePage"),
);
const CreateTemplatePage = lazy(
	() => import("./pages/CreateTemplatePage/CreateTemplatePage"),
);
const TemplateBuilderPage = lazy(
	() => import("./pages/TemplateBuilder/TemplateBuilderPage"),
);
const TemplateVariablesPage = lazy(
	() =>
		import(
			"./pages/TemplateSettingsPage/TemplateVariablesPage/TemplateVariablesPage"
		),
);
const WorkspaceSettingsPage = lazy(
	() => import("./pages/WorkspaceSettingsPage/WorkspaceSettingsPage"),
);
const CreateTokenPage = lazy(
	() => import("./pages/CreateTokenPage/CreateTokenPage"),
);
const TemplateDocsPage = lazy(
	() => import("./pages/TemplatePage/TemplateDocsPage/TemplateDocsPage"),
);
const TemplateFilesPage = lazy(
	() => import("./pages/TemplatePage/TemplateFilesPage/TemplateFilesPage"),
);
const TemplateVersionsPage = lazy(
	() =>
		import("./pages/TemplatePage/TemplateVersionsPage/TemplateVersionsPage"),
);
const TemplateSchedulePage = lazy(
	() =>
		import(
			"./pages/TemplateSettingsPage/TemplateSchedulePage/TemplateSchedulePage"
		),
);
const TemplateParametersPage = lazy(
	() =>
		import(
			"./pages/TemplateSettingsPage/TemplateParametersPage/TemplateParametersPage"
		),
);
const TemplateSettingsPage = lazy(
	() =>
		import(
			"./pages/TemplateSettingsPage/TemplateGeneralSettingsPage/TemplateSettingsPage"
		),
);
const OrganizationRedirect = lazy(
	() => import("./pages/OrganizationSettingsPage/OrganizationRedirect"),
);

const OrganizationSettingsPage = lazy(
	() => import("./pages/OrganizationSettingsPage/OrganizationSettingsPage"),
);
const OrganizationMembersPage = lazy(
	() => import("./pages/OrganizationSettingsPage/OrganizationMembersPage"),
);
const ProvisionersPage = lazy(
	() =>
		import(
			"./pages/OrganizationSettingsPage/OrganizationProvisionersPage/OrganizationProvisionersPage"
		),
);
const TemplateEmbedPage = lazy(
	() => import("./pages/TemplatePage/TemplateEmbedPage/TemplateEmbedPage"),
);
const TemplateInsightsPage = lazy(
	() =>
		import("./pages/TemplatePage/TemplateInsightsPage/TemplateInsightsPage"),
);
const IconsPage = lazy(() => import("./pages/IconsPage/IconsPage"));
const AccessURLPage = lazy(() => import("./pages/HealthPage/AccessURLPage"));
const DatabasePage = lazy(() => import("./pages/HealthPage/DatabasePage"));
const DERPPage = lazy(() => import("./pages/HealthPage/DERPPage"));
const DERPRegionPage = lazy(() => import("./pages/HealthPage/DERPRegionPage"));
const WebsocketPage = lazy(() => import("./pages/HealthPage/WebsocketPage"));
const ProvisionerDaemonsHealthPage = lazy(
	() => import("./pages/HealthPage/ProvisionerDaemonsPage"),
);
const UserNotificationsPage = lazy(
	() => import("./pages/UserSettingsPage/NotificationsPage/NotificationsPage"),
);
const DeploymentNotificationsPage = lazy(
	() =>
		import(
			"./pages/DeploymentSettingsPage/NotificationsPage/NotificationsPage"
		),
);
const RequestOTPPage = lazy(
	() => import("./pages/ResetPasswordPage/RequestOTPPage"),
);
const ChangePasswordPage = lazy(
	() => import("./pages/ResetPasswordPage/ChangePasswordPage"),
);
const ProvisionerJobsPage = lazy(
	() =>
		import(
			"./pages/OrganizationSettingsPage/OrganizationProvisionerJobsPage/OrganizationProvisionerJobsPage"
		),
);
const AgentsPageLayout = lazy(
	() => import("./pages/AgentsPage/AgentsPageLayout"),
);
const AgentChatPage = lazy(() => import("./pages/AgentsPage/AgentChatPage"));
const AgentEmbedPage = lazy(() => import("./pages/AgentsPage/AgentEmbedPage"));
const DesktopPopoutPage = lazy(
	() => import("./pages/AgentsPage/DesktopPopoutPage"),
);
const AgentCreatePage = lazy(
	() => import("./pages/AgentsPage/AgentCreatePage"),
);
const AgentSettingsLayout = lazy(
	() => import("./pages/AgentsPage/AgentSettingsLayout"),
);
const AgentSettingsGeneralPage = lazy(
	() => import("./pages/AgentsPage/AgentSettingsGeneralPage"),
);
const AgentSettingsCompactionPage = lazy(
	() => import("./pages/AgentsPage/AgentSettingsCompactionPage"),
);

const AISettingsLifecyclePage = lazy(
	() => import("./pages/AISettingsPage/LifecyclePage/LifecyclePage"),
);
const CoderAgentsPage = lazy(
	() => import("./pages/AISettingsPage/CoderAgentsPage/CoderAgentsPage"),
);
const AgentSettingsUserAgentsPage = lazy(
	() => import("./pages/AgentsPage/AgentSettingsUserAgentsPage"),
);
const AgentSettingsPersonalSkillsPage = lazy(
	() => import("./pages/AgentsPage/AgentSettingsPersonalSkillsPage"),
);
const AgentSettingsAPIKeysPage = lazy(
	() => import("./pages/AgentsPage/AgentSettingsAPIKeysPage"),
);

import {
	AgentChatPageSkeleton,
	AgentsPageLayoutSkeleton,
} from "./pages/AgentsPage/components/AgentsSkeletons";

const CoderCupPage = lazy(() => import("./pages/CoderCupPage/CoderCupPage"));

const AISettingsLayout = lazy(
	() => import("./pages/AISettingsPage/AISettingsLayout"),
);
const AISettingsProvidersPage = lazy(
	() => import("./pages/AISettingsPage/ProvidersPage/ProvidersPage"),
);
const AISettingsUpdateProviderPage = lazy(
	() =>
		import(
			"./pages/AISettingsPage/ProvidersPage/UpdateProviderPage/UpdateProviderPage"
		),
);
const AISettingsAddProviderPage = lazy(
	() =>
		import(
			"./pages/AISettingsPage/ProvidersPage/AddProviderPage/AddProviderPage"
		),
);
const AISettingsModelsPage = lazy(
	() => import("./pages/AISettingsPage/ModelsPage/ModelsPage"),
);
const AISettingsOrganizationModelsLayout = lazy(
	() => import("./pages/AISettingsPage/ModelsPage/OrganizationModelsLayout"),
);
const AISettingsInstructionsPage = lazy(
	() => import("./pages/AISettingsPage/InstructionsPage/InstructionsPage"),
);
const AISettingsTemplatesPage = lazy(
	() => import("./pages/AISettingsPage/TemplatesPage/TemplatesPage"),
);
const AISettingsAddModelPage = lazy(
	() => import("./pages/AISettingsPage/ModelsPage/AddModelPage/AddModelPage"),
);
const AISettingsUpdateModelPage = lazy(
	() =>
		import("./pages/AISettingsPage/ModelsPage/UpdateModelPage/UpdateModelPage"),
);
const AISettingsMCPServersPage = lazy(
	() => import("./pages/AISettingsPage/MCPServersPage/MCPServersPage"),
);
const AISettingsAddMCPServerPage = lazy(
	() =>
		import(
			"./pages/AISettingsPage/MCPServersPage/AddMCPServerPage/AddMCPServerPage"
		),
);
const AISettingsUpdateMCPServerPage = lazy(
	() =>
		import(
			"./pages/AISettingsPage/MCPServersPage/UpdateMCPServerPage/UpdateMCPServerPage"
		),
);

const GlobalLayout = () => {
	return (
		<Suspense fallback={<Loader fullscreen />}>
			<Outlet />
			<ScrollRestoration />
		</Suspense>
	);
};

const templateRouter = () => {
	return (
		<Route path=":template">
			<Route element={<TemplateRedirectController />}>
				<Route element={<TemplateLayout />}>
					<Route index element={<Navigate to="docs" replace />} />
					<Route path="docs" element={<TemplateDocsPage />} />
					<Route path="files" element={<TemplateFilesPage />} />
					<Route path="resources" element={<TemplateResourcesPage />} />
					<Route path="versions" element={<TemplateVersionsPage />} />
					<Route path="embed" element={<TemplateEmbedPage />} />
					<Route path="insights" element={<TemplateInsightsPage />} />
				</Route>

				<Route path="workspace" element={<CreateWorkspacePage />} />

				<Route path="settings" element={<TemplateSettingsLayout />}>
					<Route index element={<TemplateSettingsPage />} />
					<Route path="variables" element={<TemplateVariablesPage />} />
					<Route path="parameters" element={<TemplateParametersPage />} />
					<Route path="schedule" element={<TemplateSchedulePage />} />
				</Route>

				<Route path="versions">
					<Route path=":version">
						<Route index element={<TemplateVersionPage />} />
					</Route>
				</Route>
			</Route>
		</Route>
	);
};

export const router = createBrowserRouter(
	createRoutesFromChildren(
		<Route element={<GlobalLayout />} errorElement={<GlobalErrorBoundary />}>
			<Route path="login" element={<LoginPage />} />
			<Route path="login/device" element={<LoginOAuthDevicePage />} />
			<Route path="setup" element={<SetupPage />} />
			<Route path="reset-password">
				<Route index element={<RequestOTPPage />} />
				<Route path="change" element={<ChangePasswordPage />} />
			</Route>

			{/* Dashboard routes */}
			<Route element={<RequireAuth />}>
				<Route element={<DashboardLayout />}>
					<Route index element={<Navigate to="/workspaces" replace />} />
					{communityUIHiddenRoutes.map((path) => (
						<Route key={path} path={path} element={<NotFoundPage />} />
					))}

					<Route
						path="/external-auth/:provider"
						element={<ExternalAuthPage />}
					/>

					<Route path="/workspaces" element={<WorkspacesPage />} />

					<Route path="/starter-templates">
						<Route index element={<CreateTemplateGalleryPage />} />
						<Route path=":exampleId" element={<StarterTemplatePage />} />
					</Route>

					<Route path="/templates">
						<Route index element={<TemplatesPage />} />
						<Route path="new">
							<Route index element={<CreateTemplatePage />} />
							<Route path="builder" element={<TemplateBuilderPage />} />
						</Route>
						<Route path=":organization">{templateRouter()}</Route>
						{templateRouter()}
					</Route>

					<Route
						path="/users/*"
						element={<Navigate to="/deployment/users" replace />}
					/>

					<Route path="/organizations" element={<OrganizationSettingsLayout />}>
						{/* General settings for the default org can omit the organization name */}
						<Route index element={<OrganizationRedirect />} />

						<Route path=":organization" element={<OrganizationSidebarLayout />}>
							<Route index element={<OrganizationMembersPage />} />
							<Route path="provisioners" element={<ProvisionersPage />} />
							<Route
								path="provisioner-jobs"
								element={<ProvisionerJobsPage />}
							/>
							<Route path="settings" element={<OrganizationSettingsPage />} />
						</Route>
					</Route>

					<Route path="/deployment" element={<DeploymentSettingsLayout />}>
						<Route element={<DeploymentConfigProvider />}>
							<Route path="overview" element={<OverviewPage />} />
							<Route path="security" element={<SecuritySettingsPage />} />
							<Route
								path="observability"
								element={<ObservabilitySettingsPage />}
							/>

							<Route path="network" element={<NetworkSettingsPage />} />
							<Route path="userauth" element={<UserAuthSettingsPage />} />
							<Route
								path="external-auth"
								element={<ExternalAuthSettingsPage />}
							/>

							<Route
								path="notifications"
								element={<DeploymentNotificationsPage />}
							/>
						</Route>

						<Route path="appearance" element={<AppearanceSettingsPage />} />
						<Route path="oauth2-provider">
							<Route index element={<NotFoundPage />} />
							<Route path="apps">
								<Route index element={<OAuth2AppsSettingsPage />} />
								<Route path="add" element={<CreateOAuth2AppPage />} />
								<Route path=":appId" element={<EditOAuth2AppPage />} />
							</Route>
						</Route>

						<Route path="users">
							<Route index element={<UsersPage />} />
							<Route path="create" element={<CreateUserPage />} />
							<Route path=":user" element={<EditUserPage />} />
						</Route>
					</Route>

					<Route path="/settings" element={<UserSettingsLayout />}>
						<Route path="account" element={<AccountPage />} />
						<Route path="appearance" element={<AppearancePage />} />
						<Route path="schedule" element={<SchedulePage />} />
						<Route path="security" element={<SecurityPage />} />
						<Route path="ssh-keys" element={<SSHKeysPage />} />
						<Route
							path="external-auth"
							element={<UserExternalAuthSettingsPage />}
						/>
						<Route
							path="oauth2-provider"
							element={<UserOAuth2ProviderSettingsPage />}
						/>
						<Route path="tokens">
							<Route index element={<TokensPage />} />
							<Route path="new" element={<CreateTokenPage />} />
						</Route>
						<Route path="secrets" element={<SecretsPage />} />
						<Route path="notifications" element={<UserNotificationsPage />} />
					</Route>

					{/* In order for the 404 page to work properly the routes that start with
              top level parameter must be fully qualified. */}
					<Route path="/:username/:workspace">
						<Route
							path="local-preview/:agent/:port"
							element={<LocalPreviewPage />}
						/>
						<Route index element={<WorkspacePage />} />
						<Route
							path="builds/:buildNumber"
							element={<WorkspaceBuildPage />}
						/>
						<Route path="settings" element={<WorkspaceSettingsLayout />}>
							<Route index element={<WorkspaceSettingsPage />} />
							<Route path="parameters" element={<WorkspaceParametersPage />} />
							<Route path="schedule" element={<WorkspaceSchedulePage />} />
							<Route path="sharing" element={<WorkspaceSharingPage />} />
						</Route>
					</Route>

					<Route path="/ai/settings" element={<AISettingsLayout />}>
						<Route index element={<AISettingsIndexRedirect />} />
						<Route path="models/defaults" element={<ModelDefaultsRedirect />} />
						<Route
							path="models"
							element={<AISettingsOrganizationModelsLayout />}
						>
							<Route index element={<AISettingsModelsPage />} />
							<Route path="add" element={<AISettingsAddModelPage />} />
							<Route path=":modelId" element={<AISettingsUpdateModelPage />} />
						</Route>
						<Route
							path="instructions"
							element={<AISettingsInstructionsPage />}
						/>
						<Route path="lifecycle" element={<AISettingsLifecyclePage />} />
						<Route path="coder-agents" element={<CoderAgentsPage />} />
						<Route path="templates" element={<AISettingsTemplatesPage />} />
						<Route path="mcp-servers" element={<AISettingsMCPServersPage />} />
						<Route
							path="mcp-servers/add"
							element={<AISettingsAddMCPServerPage />}
						/>
						<Route
							path="mcp-servers/:serverId"
							element={<AISettingsUpdateMCPServerPage />}
						/>
						<Route path="providers" element={<AISettingsProvidersPage />} />
						<Route
							path="providers/add"
							element={<AISettingsAddProviderPage />}
						/>
						<Route
							path="providers/:providerId"
							element={<AISettingsUpdateProviderPage />}
						/>
					</Route>

					<Route path="/health" element={<HealthLayout />}>
						<Route index element={<Navigate to="access-url" replace />} />
						<Route path="access-url" element={<AccessURLPage />} />
						<Route path="database" element={<DatabasePage />} />
						<Route path="derp" element={<DERPPage />} />
						<Route path="derp/regions/:regionId" element={<DERPRegionPage />} />
						<Route path="websocket" element={<WebsocketPage />} />
						<Route
							path="provisioner-daemons"
							element={<ProvisionerDaemonsHealthPage />}
						/>
					</Route>

					<Route path="/install" element={<CliInstallPage />} />

					{/* Using path="*"" means "match anything", so this route
              acts like a catch-all for URLs that we don't have explicit
              routes for. */}
					<Route path="*" element={<NotFoundPage />} />
				</Route>

				{/* Pages that don't have the dashboard layout */}
				<Route
					path="/templates/:template/versions/:version/edit"
					element={<TemplateVersionEditorPage />}
				/>
				<Route
					path="/templates/:organization/:template/versions/:version/edit"
					element={<TemplateVersionEditorPage />}
				/>
				<Route
					path="/:username/:workspace/terminal"
					element={<TerminalPage />}
				/>
				<Route path="/cli-auth" element={<CliAuthPage />} />
				<Route path="/coder-cup" element={<CoderCupPage />} />
				<Route path="/icons" element={<IconsPage />} />
				<Route
					path="/agents"
					element={
						<Suspense fallback={<AgentsPageLayoutSkeleton />}>
							<AgentsPageLayout />
						</Suspense>
					}
				>
					<Route index element={<AgentCreatePage />} />
					<Route path="settings" element={<AgentSettingsLayout />}>
						<Route index element={<AgentSettingsGeneralPage />} />
						<Route path="general" element={<AgentSettingsGeneralPage />} />
						<Route
							path="compaction"
							element={<AgentSettingsCompactionPage />}
						/>
						<Route
							path="instructions"
							element={<Navigate to="/ai/settings/instructions" replace />}
						/>
						<Route
							path="lifecycle"
							element={<Navigate to="/ai/settings/lifecycle" replace />}
						/>
						<Route
							path="user-agents"
							element={<AgentSettingsUserAgentsPage />}
						/>
						<Route
							path="personal-skills"
							element={<AgentSettingsPersonalSkillsPage />}
						/>
						<Route
							path="admin"
							element={<Navigate to="/ai/settings/coder-agents" replace />}
						/>
						<Route
							path="agents"
							element={<Navigate to="/ai/settings/coder-agents" replace />}
						/>
						<Route
							path="coder-agents"
							element={<Navigate to="/ai/settings/coder-agents" replace />}
						/>
						<Route
							path="experiments"
							element={<Navigate to="/ai/settings/coder-agents" replace />}
						/>
						<Route path="api-keys" element={<AgentSettingsAPIKeysPage />} />
						<Route
							path="providers"
							element={<Navigate to="/ai/settings/providers" replace />}
						/>
						<Route
							path="models"
							element={<Navigate to="/ai/settings/models" replace />}
						/>
						<Route
							path="mcp-servers"
							element={<Navigate to="/ai/settings/mcp-servers" replace />}
						/>
						<Route
							path="templates"
							element={<Navigate to="/ai/settings/templates" replace />}
						/>
					</Route>
					<Route
						path=":agentId"
						element={
							<Suspense fallback={<AgentChatPageSkeleton />}>
								<AgentChatPage />
							</Suspense>
						}
					/>
				</Route>
				<Route
					path="/agents/:agentId/desktop"
					element={
						<Suspense
							fallback={
								<div className="flex h-screen w-screen items-center justify-center" />
							}
						>
							<DesktopPopoutPage />
						</Suspense>
					}
				/>
			</Route>

			<Route
				path="/agents/:agentId/embed"
				element={
					<Suspense fallback={<AgentChatPageSkeleton />}>
						<AgentEmbedPage />
					</Suspense>
				}
			>
				<Route
					index
					element={
						<Suspense fallback={<AgentChatPageSkeleton />}>
							<AgentChatPage />
						</Suspense>
					}
				/>
			</Route>
		</Route>,
	),
);
