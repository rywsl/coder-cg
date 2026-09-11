import { createContext, type FC, useContext } from "react";
import { useQuery } from "react-query";
import { Outlet } from "react-router";
import type { DeploymentConfig } from "#/api/api";
import { deploymentConfig } from "#/api/queries/deployment";
import { isCommunityDeploymentOption } from "#/communityPolicy";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";

export const DeploymentConfigContext = createContext<
	DeploymentConfigValue | undefined
>(undefined);

type DeploymentConfigValue = Readonly<{
	deploymentConfig: DeploymentConfig;
}>;

export const useDeploymentConfig = (): DeploymentConfigValue => {
	const context = useContext(DeploymentConfigContext);
	if (!context) {
		throw new Error(
			`${useDeploymentConfig.name} should be used inside of ${DeploymentConfigProvider.name}`,
		);
	}

	return context;
};

const DeploymentConfigProvider: FC = () => {
	const deploymentConfigQuery = useQuery(deploymentConfig());

	if (deploymentConfigQuery.error) {
		return <ErrorAlert error={deploymentConfigQuery.error} />;
	}

	if (!deploymentConfigQuery.data) {
		return <Loader />;
	}
	const filteredDeploymentConfig = {
		...deploymentConfigQuery.data,
		options: deploymentConfigQuery.data.options.filter(
			isCommunityDeploymentOption,
		),
	};

	return (
		<DeploymentConfigContext.Provider
			value={{ deploymentConfig: filteredDeploymentConfig }}
		>
			<Outlet />
		</DeploymentConfigContext.Provider>
	);
};

export default DeploymentConfigProvider;
