import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { PaywallGuidance } from "#/components/Paywall/Paywall";
import { Supergraphic } from "#/components/Supergraphic/Supergraphic";
import { LicenseActivePanel } from "./LicenseActivePanel";
import { TrialActivePanel } from "./TrialActivePanel";
import { TrialRequestForm } from "./TrialRequestForm";

type PremiumPageViewProps = {
	hasLicense: boolean;
	isTrial: boolean;
	/** Whether the viewer may request a trial for this deployment. */
	canRequestTrial: boolean;
	trialDaysRemaining: number | undefined;
	onSubmit: (request: TypesGen.CreateTrialLicenseRequest) => void;
	isSubmitting: boolean;
	error?: unknown;
};

export const PremiumPageView: FC<PremiumPageViewProps> = ({
	hasLicense,
	isTrial,
	canRequestTrial,
	trialDaysRemaining,
	onSubmit,
	isSubmitting,
	error,
}) => {
	const { t: tI18n } = useTranslation("administration");

	// An installed license has nothing to sell, so both license states collapse
	// the two-column pitch into a single banner.
	if (hasLicense) {
		return (
			<div className="relative isolate overflow-hidden rounded-lg py-12 mb-8 border border-solid bg-surface-secondary flex items-center justify-center">
				<Supergraphic className="bg-position-[20%_20%]" />
				{isTrial ? (
					<TrialActivePanel daysRemaining={trialDaysRemaining} />
				) : (
					<LicenseActivePanel />
				)}
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-solid border-border-default bg-surface-primary overflow-hidden">
			<div className="grid grid-cols-1 lg:grid-cols-2 min-h-[640px]">
				<div className="relative isolate overflow-hidden hidden lg:flex flex-col p-12 bg-surface-secondary">
					<Supergraphic className="bg-position-[20%_20%] bg-size-[110%_125%] -scale-x-100" />
					<div className="self-center pt-24 max-w-sm">
						<h2 className="m-0 text-3xl font-semibold text-content-primary text-balance">
							{tI18n(
								"DeploymentSettingsPage.PremiumPage.PremiumPageView.start_an_unlimited_30_day_coder_trial_27c16ec9",
							)}
						</h2>
						<p className="m-0 pt-6 text-sm text-content-primary">
							{tI18n(
								"DeploymentSettingsPage.PremiumPage.PremiumPageView.unlock_unlimited_coder_agents_usage_and_enterpri_d7e0d0a6",
							)}
						</p>
					</div>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-12 bg-surface-secondary">
					{canRequestTrial ? (
						<TrialRequestForm
							onSubmit={onSubmit}
							isSubmitting={isSubmitting}
							error={error}
						/>
					) : (
						<PaywallGuidance className="mx-0">
							{tI18n(
								"DeploymentSettingsPage.PremiumPage.PremiumPageView.contact_your_deployment_administrator_for_premiu_e349ee15",
							)}
						</PaywallGuidance>
					)}
				</div>
			</div>
		</div>
	);
};
