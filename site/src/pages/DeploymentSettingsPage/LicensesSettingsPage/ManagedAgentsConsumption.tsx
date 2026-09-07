import { cn } from "cn";
import dayjs from "dayjs";
import { ChevronRightIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Feature } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { Link } from "#/components/Link/Link";
import { currentIntlLocale } from "#/i18n/locale";
import { docs } from "#/utils/docs";

interface ManagedAgentsConsumptionProps {
	managedAgentFeature?: Feature;
}

export const ManagedAgentsConsumption: FC<ManagedAgentsConsumptionProps> = ({
	managedAgentFeature,
}) => {
	const { t: tI18n } = useTranslation("administration");

	// If no feature is provided or it's disabled, show disabled state
	if (!managedAgentFeature?.enabled) {
		return (
			<div className="min-h-60 flex items-center justify-center rounded-lg border border-solid p-12">
				<div className="flex flex-col gap-4 items-center justify-center">
					<div className="flex flex-col gap-2 items-center justify-center">
						<span className="text-base">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.agent_workspace_builds_disabled_60182a1c",
							)}
						</span>
						<span className="text-content-secondary text-center max-w-[464px] mt-2">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.agent_workspace_builds_are_not_included_in_your__66cd4378",
							)}
							<Link href="mailto:sales@coder.com">
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.sales_e04eb290",
								)}
							</Link>
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.to_upgrade_your_license_and_unlock_this_feature_c4ce1cc5",
							)}
						</span>
					</div>
				</div>
			</div>
		);
	}

	const usage = managedAgentFeature.actual;
	const included = managedAgentFeature.limit;
	const startDate = managedAgentFeature.usage_period?.start;
	const endDate = managedAgentFeature.usage_period?.end;

	if (usage === undefined || usage < 0) {
		return (
			<ErrorAlert
				error={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.invalid_usage_data_d7e597fe",
				)}
			/>
		);
	}

	if (included === undefined || included < 0) {
		return (
			<ErrorAlert
				error={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.invalid_license_usage_limits_dcc0f71b",
				)}
			/>
		);
	}

	if (!startDate || !endDate) {
		return (
			<ErrorAlert
				error={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.missing_license_usage_period_2b89bf84",
				)}
			/>
		);
	}

	const start = dayjs(startDate);
	const end = dayjs(endDate);
	if (!start.isValid() || !end.isValid() || !start.isBefore(end)) {
		return (
			<ErrorAlert
				error={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.invalid_license_usage_period_d0597685",
				)}
			/>
		);
	}

	const usagePercentage = Math.min((usage / included) * 100, 100);

	return (
		<section className="border border-solid rounded">
			<div className="p-4">
				<Collapsible>
					<header className="flex flex-col gap-2 items-start">
						<h3 className="text-md m-0 font-medium">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.agent_workspace_builds_1c7057cf",
							)}
						</h3>

						<CollapsibleTrigger asChild>
							<Button
								className={`
                  h-auto p-0 border-0 bg-transparent font-medium text-content-secondary
                  hover:bg-transparent hover:text-content-primary
                  [&[data-state=open]_svg]:rotate-90
                `}
							>
								<ChevronRightIcon />
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.learn_more_1445799c",
								)}
							</Button>
						</CollapsibleTrigger>
					</header>

					<CollapsibleContent
						className={`
              pt-2 pl-7 pr-5 space-y-4 font-medium max-w-[720px]
              text-sm text-content-secondary
              [&_p]:m-0 [&_ul]:m-0 [&_ul]:p-0 [&_ul]:list-none
            `}
					>
						<p>
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.agent_workspace_builds_are_measured_when_you_sta_7955747b",
							)}
						</p>
						<p>
							<Link
								href={docs("/ai-coder/agents")}
								target="_blank"
								rel="noreferrer"
							>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.coder_agents_19b8e154",
								)}
							</Link>{" "}
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.workspaces_count_towards_your_agent_workspace_bu_cdd9d6a8",
							)}
							<Link
								href={docs("/ai-coder/ai-governance")}
								target="_blank"
								rel="noreferrer"
							>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.view_docs_61479fda",
								)}
							</Link>
						</p>
						<ul>
							<li className="flex items-center gap-2">
								<div className="rounded-[2px] bg-highlight-green size-3 inline-block">
									<span className="sr-only">
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.legend_for_started_workspaces_b171f4f6",
										)}
									</span>
								</div>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.amount_of_started_workspaces_with_an_ai_agent_8f34a51f",
								)}
							</li>
							<li className="flex items-center gap-2">
								<div className="rounded-[2px] bg-highlight-orange size-3 inline-block">
									<span className="sr-only">
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.legend_for_usage_exceeding_included_allowance_e4dc9ac9",
										)}
									</span>
								</div>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.usage_has_exceeded_included_allowance_from_your__2ba08578",
								)}
							</li>
						</ul>
					</CollapsibleContent>
				</Collapsible>
			</div>
			<div className="p-6 border-0 border-t border-solid">
				<div className="flex justify-between text-sm text-content-secondary mb-4">
					<span>
						{startDate ? dayjs(startDate).format("MMMM D, YYYY") : ""}
					</span>
					<span>{endDate ? dayjs(endDate).format("MMMM D, YYYY") : ""}</span>
				</div>

				<div className="relative h-6 bg-surface-secondary rounded overflow-hidden">
					<div
						className={cn(
							"absolute top-0 left-0 h-full transition-all duration-300",
							usagePercentage < 100
								? "bg-highlight-green"
								: "bg-highlight-orange",
						)}
						style={{ width: `${usagePercentage}%` }}
					/>
				</div>

				<div className="relative hidden lg:flex justify-between mt-4 text-sm">
					<div className="flex flex-col items-start">
						<span className="text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.actual_9c723441",
							)}
						</span>
						<span className="font-medium">
							{usage.toLocaleString(currentIntlLocale())}
						</span>
					</div>

					<div className="flex flex-col items-end">
						<span className="text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.included_194beab0",
							)}
						</span>
						<span className="font-medium">
							{included.toLocaleString(currentIntlLocale())}
						</span>
					</div>
				</div>

				<div className="flex lg:hidden flex-col gap-3 mt-4 text-sm">
					<div className="flex justify-between">
						<div className="flex flex-col items-start">
							<span className="text-content-secondary">
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.actual_9c723441",
								)}
							</span>
							<span className="font-medium">
								{usage.toLocaleString(currentIntlLocale())}
							</span>
						</div>
						<div className="flex flex-col items-end">
							<span className="text-content-secondary">
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.ManagedAgentsConsumption.included_194beab0",
								)}
							</span>
							<span className="font-medium">
								{included.toLocaleString(currentIntlLocale())}
							</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
