import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SerpentOption } from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { deploymentGroupHasParent } from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";

type ObservabilitySettingsPageViewProps = {
	options: SerpentOption[];
};

export const ObservabilitySettingsPageView: FC<
	ObservabilitySettingsPageViewProps
> = ({ options }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col gap-12">
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.observability_a37c9310",
						)}
					</SettingsHeaderTitle>
				</SettingsHeader>
				<SettingsHeader>
					<SettingsHeaderTitle hierarchy="secondary" level="h2">
						{tI18n(
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.monitoring_1dc83f60",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.monitoring_your_coder_application_with_logs_and__7ed74198",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/monitoring")}
							context="about monitoring"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<OptionsTable
					options={options.filter((o) =>
						deploymentGroupHasParent(o.group, "Introspection"),
					)}
				/>
			</div>
		</div>
	);
};
