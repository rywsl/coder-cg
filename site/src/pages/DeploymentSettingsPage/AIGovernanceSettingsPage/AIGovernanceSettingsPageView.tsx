import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SerpentOption } from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Link } from "#/components/Link/Link";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { PremiumPaywallAIGovernance } from "#/modules/paywall/PremiumPaywallAIGovernance";
import { deploymentGroupHasParent } from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";

type AIGovernanceSettingsPageViewProps = {
	options: SerpentOption[];
	featureAIBridgeEntitled: boolean;
	featureAIBridgeEnabled: boolean;
};

export const AIGovernanceSettingsPageView: FC<
	AIGovernanceSettingsPageViewProps
> = ({ options, featureAIBridgeEntitled, featureAIBridgeEnabled }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col gap-12">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.ai_governance_2ab040bd",
					)}
				</SettingsHeaderTitle>
			</SettingsHeader>
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle hierarchy="secondary" level="h2">
						{tI18n(
							"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.ai_gateway_47219de2",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.monitor_and_manage_ai_requests_across_your_deplo_dcb8de0a",
						)}{" "}
						<SettingsHeaderDocsLink href={docs("/ai-coder/ai-governance")} />
					</SettingsHeaderDescription>
				</SettingsHeader>

				{featureAIBridgeEntitled ? (
					<>
						{!featureAIBridgeEnabled && (
							<Alert className="mb-12" severity="warning" prominent>
								<AlertTitle>
									{tI18n(
										"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.ai_gateway_is_included_in_your_license_but_not_s_b8958a5e",
									)}
								</AlertTitle>
								<AlertDescription>
									{tI18n(
										"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.you_have_access_to_ai_governance_but_it_still_ne_eee315ab",
									)}{" "}
									<Link href={docs("/ai-coder/ai-gateway")} target="_blank">
										{tI18n(
											"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.ai_gateway_47219de2",
										)}
									</Link>{" "}
									{tI18n(
										"DeploymentSettingsPage.AIGovernanceSettingsPage.AIGovernanceSettingsPageView.documentation_to_get_started_82f67848",
									)}
								</AlertDescription>
							</Alert>
						)}
						<OptionsTable
							options={options
								.filter((o) => deploymentGroupHasParent(o.group, "AI Gateway"))
								.filter((o) => !o.annotations?.secret === true)}
						/>
					</>
				) : (
					<PremiumPaywallAIGovernance source="ai_governance" />
				)}
			</div>
		</div>
	);
};
