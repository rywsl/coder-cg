import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	DeploymentValues,
	ExternalAuthConfig,
} from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { PremiumPaywallSmall } from "#/modules/paywall/PremiumPaywallSmall";
import { docs } from "#/utils/docs";

type ExternalAuthSettingsPageViewProps = {
	config: DeploymentValues;
	/** True when the deployment may configure more than one provider. */
	isEntitled: boolean;
	canViewPremium: boolean;
};

export const ExternalAuthSettingsPageView: FC<
	ExternalAuthSettingsPageViewProps
> = ({ config, isEntitled, canViewPremium }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.external_authentication_1b308ef4",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.coder_integrates_with_github_gitlab_bitbucket_az_737e67fd",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/external-auth")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			<video
				autoPlay
				muted
				loop
				playsInline
				src="/external-auth.mp4"
				style={{
					maxWidth: "100%",
					borderRadius: 4,
				}}
			/>
			{!isEntitled && (
				<div className="mt-6 mb-6">
					<PremiumPaywallSmall
						source="external_auth"
						message={tI18n(
							"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.external_authentication_1b308ef4",
						)}
						description={tI18n(
							"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.connect_multiple_git_and_oauth_providers_at_once_af4660cc",
						)}
						features={[
							tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.connect_multiple_git_providers_at_once_987c6711",
							),
							tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.match_providers_by_regex_per_host_4d8094a2",
							),
							tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.separate_credentials_for_each_provider_07812dac",
							),
						]}
						canViewPremium={canViewPremium}
					/>
				</div>
			)}
			<Table className="[&_td]:py-6 [&_td:last-child]:pl-8 [&_th:last-child]:pl-8">
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/3">
							{tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.id_3843971d",
							)}
						</TableHead>
						<TableHead className="w-1/3">
							{tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.client_id_8726db01",
							)}
						</TableHead>
						<TableHead className="w-1/3">
							{tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.match_03c0e806",
							)}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{config.external_auth === null ||
					config.external_auth?.length === 0 ? (
						<TableEmpty
							message={tI18n(
								"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.no_providers_have_been_configured_3144b523",
							)}
						/>
					) : (
						config.external_auth?.map((git: ExternalAuthConfig) => {
							const name = git.id || git.type;
							return (
								<TableRow key={name}>
									<TableCell>{name}</TableCell>
									<TableCell>{git.client_id}</TableCell>
									<TableCell>
										{git.regex ||
											tI18n(
												"DeploymentSettingsPage.ExternalAuthSettingsPage.ExternalAuthSettingsPageView.not_set_8290035d",
											)}
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</>
	);
};
