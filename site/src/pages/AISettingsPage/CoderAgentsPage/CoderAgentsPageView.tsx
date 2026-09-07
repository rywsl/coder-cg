import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { UseMutateFunction } from "react-query";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import {
	getOrganizationLabel,
	OrganizationAutocomplete,
} from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { AdvisorSettings } from "#/pages/AgentsPage/components/AdvisorSettings";
import { VirtualDesktopSettings } from "#/pages/AgentsPage/components/VirtualDesktopSettings";
import {
	AdminPersonalModelOverridesSettings,
	type SavePersonalModelOverridesAdminSetting,
} from "./components/AdminPersonalModelOverridesSettings";
import type { MutationCallbacks } from "./components/SubagentModelOverrideSettings";

export interface CoderAgentsPageViewProps {
	organization?: TypesGen.Organization;
	organizations: readonly TypesGen.Organization[];
	onSelectOrganization: (organization: TypesGen.Organization) => void;
	organizationAccessError?: unknown;
	organizationPermissionsError?: unknown;
	requestedOrganizationDenied: boolean;
	isOrganizationAccessLoading: boolean;
	organizationSettings?: ReactNode;
	canEditDeploymentConfig: boolean;
	adminOverridesData?: TypesGen.ChatPersonalModelOverridesAdminSettings;
	adminOverridesError?: unknown;
	onRetryAdminOverrides?: () => void;
	isRetryingAdminOverrides?: boolean;
	onSaveAdminOverrides: SavePersonalModelOverridesAdminSetting;
	isSavingAdminOverrides: boolean;
	isSaveAdminOverridesError: boolean;
	showAdvisorSettings: boolean;
	advisorConfigData: TypesGen.AdvisorConfig | undefined;
	isAdvisorConfigLoading: boolean;
	isAdvisorConfigFetching: boolean;
	isAdvisorConfigLoadError: boolean;
	onSaveAdvisorConfig: (
		req: TypesGen.UpdateAdvisorConfigRequest,
		options?: MutationCallbacks,
	) => void;
	isSavingAdvisorConfig: boolean;
	isSaveAdvisorConfigError: boolean;
	saveAdvisorConfigError: unknown;
	showVirtualDesktopSettings: boolean;
	computerUseProviderData: TypesGen.ChatComputerUseProviderResponse | undefined;
	isLoadingComputerUseProvider: boolean;
	onSaveComputerUseProvider: UseMutateFunction<
		void,
		Error,
		TypesGen.UpdateChatComputerUseProviderRequest,
		unknown
	>;
	isSavingComputerUseProvider: boolean;
	computerUseProviderSaveError: Error | null;
}

export const CoderAgentsPageView: FC<CoderAgentsPageViewProps> = ({
	organization,
	organizations,
	onSelectOrganization,
	organizationAccessError,
	organizationPermissionsError,
	requestedOrganizationDenied,
	isOrganizationAccessLoading,
	organizationSettings,
	canEditDeploymentConfig,
	adminOverridesData,
	adminOverridesError,
	onRetryAdminOverrides,
	isRetryingAdminOverrides,
	onSaveAdminOverrides,
	isSavingAdminOverrides,
	isSaveAdminOverridesError,
	showAdvisorSettings,
	advisorConfigData,
	isAdvisorConfigLoading,
	isAdvisorConfigFetching,
	isAdvisorConfigLoadError,
	onSaveAdvisorConfig,
	isSavingAdvisorConfig,
	isSaveAdvisorConfigError,
	saveAdvisorConfigError,
	showVirtualDesktopSettings,
	computerUseProviderData,
	isLoadingComputerUseProvider,
	onSaveComputerUseProvider,
	isSavingComputerUseProvider,
	computerUseProviderSaveError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="flex max-w-4xl flex-col gap-10">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.coder_agents_19b8e154",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.configure_organization_model_choices_and_deploym_eca69869",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			{isOrganizationAccessLoading ? (
				<Loader
					label={tI18n(
						"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.loading_organization_settings_f5be3dcc",
					)}
				/>
			) : organization ? (
				<section
					aria-labelledby="organization-agent-settings"
					className="flex flex-col gap-6"
				>
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
						<div>
							<h2
								id="organization-agent-settings"
								className="m-0 text-xl font-semibold"
							>
								{tI18n(
									"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.organization_settings_4fd62541",
								)}
							</h2>
							<p className="mt-1 mb-0 text-sm text-content-secondary">
								{tI18n(
									"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.choose_model_and_reasoning_defaults_for_each_cod_3badd541",
								)}
							</p>
						</div>
						{organizations.length > 1 && (
							<OrganizationAutocomplete
								value={organization}
								ariaLabel={tI18n(
									"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.organization_value0_792b6bda",
									{
										value0: getOrganizationLabel(organization, organizations),
									},
								)}
								options={organizations}
								triggerClassName="w-60"
								optionsTabbable
								onChange={(nextOrganization) => {
									if (nextOrganization) {
										onSelectOrganization(nextOrganization);
									}
								}}
							/>
						)}
					</div>
					{requestedOrganizationDenied && (
						<Alert severity="warning">
							{tI18n(
								"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.the_requested_organization_is_not_available_show_89eae427",
							)}{" "}
							{organization.display_name || organization.name}
							{tI18n(
								"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.instead_d360b016",
							)}
						</Alert>
					)}
					{organizationAccessError != null && (
						<ErrorAlert error={organizationAccessError} />
					)}
					{organizationPermissionsError != null && (
						<ErrorAlert error={organizationPermissionsError} />
					)}
					{organizationSettings}
				</section>
			) : organizationAccessError != null ? (
				<ErrorAlert error={organizationAccessError} />
			) : null}
			{canEditDeploymentConfig && (
				<section
					aria-labelledby="deployment-agent-settings"
					className="flex flex-col gap-6"
				>
					<div>
						<h2
							id="deployment-agent-settings"
							className="m-0 text-xl font-semibold"
						>
							{tI18n(
								"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.deployment_settings_777bc7ac",
							)}
						</h2>
						<p className="mt-1 mb-0 text-sm text-content-secondary">
							{tI18n(
								"AISettingsPage.CoderAgentsPage.CoderAgentsPageView.configure_coder_agents_capabilities_that_apply_t_fa5efb62",
							)}
						</p>
					</div>
					<div className="flex flex-col gap-6 rounded-lg border border-solid border-border px-6 py-7">
						<AdminPersonalModelOverridesSettings
							adminSettings={adminOverridesData}
							adminSettingsError={adminOverridesError}
							onRetryAdminSettings={onRetryAdminOverrides}
							isRetryingAdminSettings={isRetryingAdminOverrides}
							onSaveAdminSetting={onSaveAdminOverrides}
							isSavingAdminSetting={isSavingAdminOverrides}
							isSaveAdminSettingError={isSaveAdminOverridesError}
						/>
						{showVirtualDesktopSettings && (
							<VirtualDesktopSettings
								computerUseProviderData={computerUseProviderData}
								isLoadingComputerUseProvider={isLoadingComputerUseProvider}
								onSaveComputerUseProvider={onSaveComputerUseProvider}
								isSavingComputerUseProvider={isSavingComputerUseProvider}
								computerUseProviderSaveError={computerUseProviderSaveError}
							/>
						)}
						{showAdvisorSettings && (
							<AdvisorSettings
								advisorConfigData={advisorConfigData}
								isAdvisorConfigLoading={isAdvisorConfigLoading}
								isAdvisorConfigFetching={isAdvisorConfigFetching}
								isAdvisorConfigLoadError={isAdvisorConfigLoadError}
								onSaveAdvisorConfig={onSaveAdvisorConfig}
								isSavingAdvisorConfig={isSavingAdvisorConfig}
								isSaveAdvisorConfigError={isSaveAdvisorConfigError}
								saveAdvisorConfigError={saveAdvisorConfigError}
							/>
						)}
					</div>
				</section>
			)}
		</div>
	);
};
