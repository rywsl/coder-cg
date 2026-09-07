import dayjs from "dayjs";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { createTrialLicense, licenses } from "#/api/queries/licenses";
import { Link } from "#/components/Link/Link";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { DATABASE_DOCS_LINK } from "#/modules/licenses/trialLicense";
import {
	clearPremiumFunnelAttribution,
	withPremiumFunnelAttribution,
} from "#/modules/paywall/premiumFunnelAttribution";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import { PremiumPageView } from "./PremiumPageView";

const PremiumPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { entitlements } = useDashboard();
	const { permissions } = useAuthenticated();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const hasLicense = entitlements.has_license;
	const isTrial = entitlements.trial;

	// Only the trial panel needs license claims; other states render entitlements
	const licensesQuery = useQuery({
		...licenses(),
		enabled: hasLicense && isTrial,
	});
	const trialMutation = useMutation(createTrialLicense(queryClient));

	const expiresAt = licensesQuery.data?.find((license) => license.claims.trial)
		?.claims.license_expires;
	const trialDaysRemaining = Number.isFinite(expiresAt)
		? dayjs.unix(Number(expiresAt)).diff(dayjs(), "day")
		: undefined;

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.PremiumPage.PremiumPage.start_a_coder_trial_1a559a1b",
					),
				)}
			</title>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.PremiumPage.start_a_coder_trial_1a559a1b",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.PremiumPage.for_enterprises_ready_to_achieve_world_class_sec_1c78a2c5",
					)}{" "}
					<SettingsHeaderDocsLink href={docs(DATABASE_DOCS_LINK)}>
						{tI18n(
							"DeploymentSettingsPage.PremiumPage.PremiumPage.review_coder_system_requirements_49510d3b",
						)}
					</SettingsHeaderDocsLink>
				</SettingsHeaderDescription>
				<Link
					href="https://coder.com/pricing#compare"
					target="_blank"
					rel="noreferrer"
					size="sm"
					className="w-fit"
				>
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.PremiumPage.learn_more_1445799c",
					)}
				</Link>
			</SettingsHeader>
			<PremiumPageView
				hasLicense={hasLicense}
				isTrial={isTrial}
				canRequestTrial={permissions.viewAllLicenses}
				trialDaysRemaining={trialDaysRemaining}
				isSubmitting={trialMutation.isPending}
				error={trialMutation.error}
				onSubmit={(request) => {
					trialMutation.mutate(withPremiumFunnelAttribution(request), {
						onSuccess: () => {
							clearPremiumFunnelAttribution();
							navigate("/deployment/licenses?success=true");
						},
						onError: (error) => {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"DeploymentSettingsPage.PremiumPage.PremiumPage.failed_to_request_a_trial_license_419f8a71",
									),
								),
								{ description: getErrorDetail(error) },
							);
						},
					});
				}}
			/>
		</>
	);
};

export default PremiumPage;
