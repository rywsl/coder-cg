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
import {
	deploymentGroupHasParent,
	useDeploymentOptions,
} from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";

type NetworkSettingsPageViewProps = {
	options: SerpentOption[];
};

export const NetworkSettingsPageView: FC<NetworkSettingsPageViewProps> = ({
	options,
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
