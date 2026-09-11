import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SerpentOption } from "#/api/typesGenerated";
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

type SecuritySettingsPageViewProps = {
	options: SerpentOption[];
};

export const SecuritySettingsPageView: FC<SecuritySettingsPageViewProps> = ({
	options,
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
