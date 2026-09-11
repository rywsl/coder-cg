import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	startWorkspaceSSHGateway,
	stopWorkspaceSSHGateway,
	updateWorkspaceSSHGateway,
	workspaceSSHGateway,
} from "#/api/queries/deployment";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { NetworkSettingsPageView } from "./NetworkSettingsPageView";

const NetworkSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();
	const queryClient = useQueryClient();
	const gatewayQuery = useQuery(workspaceSSHGateway());
	const updateGatewayMutation = useMutation(
		updateWorkspaceSSHGateway(queryClient),
	);
	const startGatewayMutation = useMutation(
		startWorkspaceSSHGateway(queryClient),
	);
	const stopGatewayMutation = useMutation(stopWorkspaceSSHGateway(queryClient));
	const gatewayMutationError =
		updateGatewayMutation.error ??
		startGatewayMutation.error ??
		stopGatewayMutation.error;
	const resetMutationErrors = () => {
		updateGatewayMutation.reset();
		startGatewayMutation.reset();
		stopGatewayMutation.reset();
	};

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.NetworkSettingsPage.NetworkSettingsPage.network_settings_a47d5574",
					),
				)}
			</title>
			<NetworkSettingsPageView
				options={deploymentConfig.options}
				gateway={gatewayQuery.data}
				gatewayError={gatewayQuery.error ?? gatewayMutationError}
				isGatewayLoading={gatewayQuery.isLoading}
				isGatewaySaving={updateGatewayMutation.isPending}
				isGatewayStarting={startGatewayMutation.isPending}
				isGatewayStopping={stopGatewayMutation.isPending}
				onSaveGateway={(request, onSuccess) => {
					resetMutationErrors();
					updateGatewayMutation.mutate(request, { onSuccess });
				}}
				onStartGateway={() => {
					resetMutationErrors();
					startGatewayMutation.mutate();
				}}
				onStopGateway={() => {
					resetMutationErrors();
					stopGatewayMutation.mutate();
				}}
			/>
		</>
	);
};

export default NetworkSettingsPage;
