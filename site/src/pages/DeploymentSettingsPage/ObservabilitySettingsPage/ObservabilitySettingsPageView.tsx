import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SerpentOption } from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import { deploymentGroupHasParent } from "#/utils/deployOptions";
import { docs } from "#/utils/docs";
import OptionsTable from "../OptionsTable";

type ObservabilitySettingsPageViewProps = {
	options: SerpentOption[];
	featureAuditLogEnabled: boolean;
	canViewPremium: boolean;
};

export const ObservabilitySettingsPageView: FC<
	ObservabilitySettingsPageViewProps
> = ({ options, featureAuditLogEnabled, canViewPremium }) => {
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
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.audit_logging_06fcaf01",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.allow_auditors_to_monitor_user_operations_in_you_2314f0f1",
						)}{" "}
						<SettingsHeaderDocsLink
							href={docs("/admin/security/audit-logs")}
							context="about audit logging"
						/>
					</SettingsHeaderDescription>
				</SettingsHeader>

				{featureAuditLogEnabled ? (
					<OptionsTable
						options={options.filter((o) => o.name === "Audit Logs Retention")}
					/>
				) : (
					<PremiumPaywall
						source="observability"
						message={tI18n(
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.audit_logging_06fcaf01",
						)}
						description={tI18n(
							"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.monitor_user_operations_across_your_deployment_3d6e74f2",
						)}
						features={[
							tI18n(
								"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.track_user_actions_across_deployment_be71b28b",
							),
							tI18n(
								"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.observe_developer_and_agent_activity_ebd79f38",
							),
							tI18n(
								"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.configurable_audit_log_retention_period_49e913b6",
							),
							tI18n(
								"DeploymentSettingsPage.ObservabilitySettingsPage.ObservabilitySettingsPageView.support_compliance_and_security_reviews_8a5edb81",
							),
						]}
						canViewPremium={canViewPremium}
					/>
				)}
			</div>
			<div>
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
