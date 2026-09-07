import type { JSX } from "react";
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

type UserAuthSettingsPageViewProps = {
	options: SerpentOption[];
};

export const UserAuthSettingsPageView = ({
	options,
}: UserAuthSettingsPageViewProps): JSX.Element => {
	const { t: tI18n } = useTranslation("administration");

	const oidcEnabled = Boolean(
		useDeploymentOptions(options, "OIDC Client ID")[0].value,
	);
	const githubEnabled = Boolean(
		useDeploymentOptions(options, "OAuth2 GitHub Client ID")[0].value,
	);

	return (
		<div className="flex flex-col gap-12">
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.UserAuthSettingsPage.UserAuthSettingsPageView.user_authentication_35610171",
						)}
					</SettingsHeaderTitle>
				</SettingsHeader>

				<SettingsHeader>
					<SettingsHeaderTitle level="h2" hierarchy="secondary">
						{tI18n(
							"DeploymentSettingsPage.UserAuthSettingsPage.UserAuthSettingsPageView.login_with_openid_connect_d70a496c",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.UserAuthSettingsPage.UserAuthSettingsPageView.set_up_authentication_to_login_with_openid_conne_7667d728",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/users/oidc-auth")}
							context="about OpenID Connect login"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<BadgeGroup>
					{oidcEnabled ? <EnabledBadge /> : <DisabledBadge />}
				</BadgeGroup>

				{oidcEnabled && (
					<OptionsTable
						options={options.filter((o) =>
							deploymentGroupHasParent(o.group, "OIDC"),
						)}
					/>
				)}
			</div>
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle level="h2" hierarchy="secondary">
						{tI18n(
							"DeploymentSettingsPage.UserAuthSettingsPage.UserAuthSettingsPageView.login_with_github_4824044a",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.UserAuthSettingsPage.UserAuthSettingsPageView.set_up_authentication_to_login_with_github_e8140eb5",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/users/github-auth")}
							context="about GitHub login"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<BadgeGroup>
					{githubEnabled ? <EnabledBadge /> : <DisabledBadge />}
				</BadgeGroup>

				{githubEnabled && (
					<OptionsTable
						options={options.filter((o) =>
							deploymentGroupHasParent(o.group, "GitHub"),
						)}
					/>
				)}
			</div>
		</div>
	);
};
