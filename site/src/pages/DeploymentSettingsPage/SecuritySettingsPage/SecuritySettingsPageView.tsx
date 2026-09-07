import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SerpentOption } from "#/api/typesGenerated";
import { BadgeGroup } from "#/components/Badge/Badge";
import { DisabledBadge, EnabledBadge } from "#/components/Badge/PresetBadges";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { PremiumPaywallSmall } from "#/modules/paywall/PremiumPaywallSmall";
import {
	deploymentGroupHasParent,
	useDeploymentOptions,
} from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";

type SecuritySettingsPageViewProps = {
	options: SerpentOption[];
	/** True when the license covers browser-only connections. */
	isBrowserOnlyEntitled: boolean;
	/** True when the deployment has browser-only connections turned on. */
	featureBrowserOnlyEnabled: boolean;
};

export const SecuritySettingsPageView: FC<SecuritySettingsPageViewProps> = ({
	options,
	isBrowserOnlyEntitled,
	featureBrowserOnlyEnabled,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const tlsOptions = options.filter((o) =>
		deploymentGroupHasParent(o.group, "TLS"),
	);

	return (
		<div className="flex flex-col gap-12">
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.security_8f6fb4eb",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.ensure_your_coder_deployment_is_secure_c4b0572b",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/security")}
							context="about security"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<OptionsTable
					options={useDeploymentOptions(
						options,
						"SSH Keygen Algorithm",
						"Secure Auth Cookie",
						"Disable Owner Workspace Access",
					)}
				/>
			</div>
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle
						level="h2"
						hierarchy="secondary"
						className="items-center"
					>
						{tI18n(
							"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.browser_only_connections_642ab2ae",
						)}{" "}
						<BadgeGroup>
							{featureBrowserOnlyEnabled ? <EnabledBadge /> : <DisabledBadge />}
						</BadgeGroup>
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.block_all_workspace_access_via_ssh_port_forward__95e73275",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/networking#browser-only-connections")}
							context="about browser-only connections"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				{!isBrowserOnlyEntitled ? (
					<PremiumPaywallSmall
						source="browser_only"
						message={tI18n(
							"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.browser_only_connections_642ab2ae",
						)}
						description={tI18n(
							"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.block_all_workspace_access_via_ssh_port_forward__95e73275",
						)}
						features={[
							tI18n(
								"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.restrict_access_to_web_based_connections_f09ad3e2",
							),
							tI18n(
								"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.block_ssh_and_port_forward_entirely_72d11e71",
							),
							tI18n(
								"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.enforce_browser_only_compliance_policies_52d99a4f",
							),
						]}
						canViewPremium
					/>
				) : null}
			</div>
			{tlsOptions.length > 0 && (
				<div>
					<SettingsHeader>
						<SettingsHeaderTitle level="h2" hierarchy="secondary">
							{tI18n(
								"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.tls_d1c18ec0",
							)}
						</SettingsHeaderTitle>
						<SettingsHeaderDescription>
							{tI18n(
								"DeploymentSettingsPage.SecuritySettingsPage.SecuritySettingsPageView.ensure_tls_is_properly_configured_for_your_coder_c8a34f2d",
							)}
						</SettingsHeaderDescription>
					</SettingsHeader>

					<OptionsTable options={tlsOptions} />
				</div>
			)}
		</div>
	);
};
