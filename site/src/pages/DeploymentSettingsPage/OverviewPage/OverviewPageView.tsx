import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	DAUsResponse,
	Experiment,
	SerpentOption,
} from "#/api/typesGenerated";
import { Alert, AlertTitle } from "#/components/Alert/Alert";
import { Link } from "#/components/Link/Link";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useDeploymentOptions } from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";
import { UserEngagementChart } from "./UserEngagementChart";

type OverviewPageViewProps = {
	deploymentOptions: SerpentOption[];
	dailyActiveUsers: DAUsResponse | undefined;
	readonly invalidExperiments: readonly string[];
	readonly safeExperiments: readonly Experiment[];
};

export const OverviewPageView: FC<OverviewPageViewProps> = ({
	deploymentOptions,
	dailyActiveUsers,
	safeExperiments,
	invalidExperiments,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"DeploymentSettingsPage.OverviewPage.OverviewPageView.general_c910d474",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"DeploymentSettingsPage.OverviewPage.OverviewPageView.information_about_your_coder_deployment_0860d99a",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/setup")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			<div className="flex flex-col gap-8">
				<UserEngagementChart
					data={dailyActiveUsers?.entries.map((i) => ({
						date: i.date,
						users: i.amount,
					}))}
				/>
				{invalidExperiments.length > 0 && (
					<Alert severity="warning">
						<AlertTitle>
							{tI18n(
								"DeploymentSettingsPage.OverviewPage.OverviewPageView.invalid_experiments_in_use_2ed9f8f7",
							)}
						</AlertTitle>
						<ul>
							{invalidExperiments.map((it) => (
								<li key={it}>
									<pre>{it}</pre>
								</li>
							))}
						</ul>
						{tI18n(
							"DeploymentSettingsPage.OverviewPage.OverviewPageView.it_is_recommended_that_you_remove_these_experime_d712aa24",
						)}{" "}
						<Link
							href={docs("/reference/cli/server#--experiments")}
							target="_blank"
							rel="noreferrer"
						>
							{tI18n(
								"DeploymentSettingsPage.OverviewPage.OverviewPageView.the_documentation_a0030756",
							)}
						</Link>{" "}
						{tI18n(
							"DeploymentSettingsPage.OverviewPage.OverviewPageView.for_more_details_1db5bfcf",
						)}
					</Alert>
				)}
				<OptionsTable
					options={useDeploymentOptions(
						deploymentOptions,
						"Access URL",
						"Wildcard Access URL",
						"Experiments",
					)}
					additionalValues={safeExperiments}
				/>
			</div>
		</>
	);
};
