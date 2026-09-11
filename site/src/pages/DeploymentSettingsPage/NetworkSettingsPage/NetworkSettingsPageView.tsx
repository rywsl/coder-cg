import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	SerpentOption,
	UpdateWorkspaceSSHGatewayRequest,
	WorkspaceSSHGatewayStatus,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { BadgeGroup } from "#/components/Badge/Badge";
import { DisabledBadge, EnabledBadge } from "#/components/Badge/PresetBadges";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import {
	deploymentGroupHasParent,
	useDeploymentOptions,
} from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";
import { WorkspaceSSHGatewaySection } from "./WorkspaceSSHGatewaySection";

type NetworkSettingsPageViewProps = {
	options: SerpentOption[];
	gateway?: WorkspaceSSHGatewayStatus;
	gatewayError?: unknown;
	isGatewayLoading: boolean;
	isGatewaySaving: boolean;
	isGatewayStarting: boolean;
	isGatewayStopping: boolean;
	onSaveGateway: (
		request: UpdateWorkspaceSSHGatewayRequest,
		onSuccess: () => void,
	) => void;
	onStartGateway: () => void;
	onStopGateway: () => void;
};

export const NetworkSettingsPageView: FC<NetworkSettingsPageViewProps> = ({
	options,
	gateway,
	gatewayError,
	isGatewayLoading,
	isGatewaySaving,
	isGatewayStarting,
	isGatewayStopping,
	onSaveGateway,
	onStartGateway,
	onStopGateway,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col gap-12">
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.NetworkSettingsPageView.network_1744b964",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.NetworkSettingsPageView.configure_your_deployment_connectivity_9af71f82",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/networking")}
							context="about deployment networking"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<OptionsTable
					options={options.filter((o) =>
						deploymentGroupHasParent(o.group, "Networking"),
					)}
				/>
			</div>
			{isGatewayLoading ? (
				<div
					className="flex flex-col gap-4"
					role="status"
					aria-label={tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.NetworkSettingsPageView.loading_workspace_ssh_gateway_settings_9b949179",
					)}
				>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-32 w-full" />
				</div>
			) : gateway ? (
				<WorkspaceSSHGatewaySection
					status={gateway}
					error={gatewayError}
					isSaving={isGatewaySaving}
					isStarting={isGatewayStarting}
					isStopping={isGatewayStopping}
					onSave={onSaveGateway}
					onStart={onStartGateway}
					onStop={onStopGateway}
				/>
			) : gatewayError !== undefined ? (
				<ErrorAlert error={gatewayError} />
			) : null}
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle level="h2" hierarchy="secondary">
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.NetworkSettingsPageView.port_forwarding_2f9a490c",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.NetworkSettingsPage.NetworkSettingsPageView.port_forwarding_lets_developers_securely_access__c62b9724",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/networking/port-forwarding")}
							context="about port forwarding"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<BadgeGroup>
					{useDeploymentOptions(options, "Wildcard Access URL")[0].value !==
					"" ? (
						<EnabledBadge />
					) : (
						<DisabledBadge />
					)}
				</BadgeGroup>
			</div>
		</div>
	);
};
