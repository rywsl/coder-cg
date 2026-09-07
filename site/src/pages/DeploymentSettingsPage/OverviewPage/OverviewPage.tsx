import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { deploymentDAUs } from "#/api/queries/deployment";
import {
	availableExperiments,
	experiments,
	isKnownExperiment,
} from "#/api/queries/experiments";
import { useEmbeddedMetadata } from "#/hooks/useEmbeddedMetadata";
import { useDeploymentConfig } from "#/modules/management/DeploymentConfigProvider";
import { pageTitle } from "#/utils/page";
import { OverviewPageView } from "./OverviewPageView";

const OverviewPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { deploymentConfig } = useDeploymentConfig();
	const safeExperimentsQuery = useQuery(availableExperiments());

	const { metadata } = useEmbeddedMetadata();
	const enabledExperimentsQuery = useQuery(experiments(metadata.experiments));

	const safeExperiments = safeExperimentsQuery.data?.safe ?? [];
	const invalidExperiments =
		enabledExperimentsQuery.data?.filter((exp) => {
			return !isKnownExperiment(exp);
		}) ?? [];

	const { data: dailyActiveUsers } = useQuery(deploymentDAUs());

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.OverviewPage.OverviewPage.overview_d4b1ea57",
					),
					tI18n(
						"DeploymentSettingsPage.OverviewPage.OverviewPage.deployment_870a8ffd",
					),
				)}
			</title>
			<OverviewPageView
				deploymentOptions={deploymentConfig.options}
				dailyActiveUsers={dailyActiveUsers}
				invalidExperiments={invalidExperiments}
				safeExperiments={safeExperiments}
			/>
		</>
	);
};

export default OverviewPage;
