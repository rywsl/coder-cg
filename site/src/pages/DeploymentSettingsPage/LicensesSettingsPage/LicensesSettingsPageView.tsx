import { PlusIcon, RotateCwIcon } from "lucide-react";
import type { FC } from "react";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { GetLicensesResponse } from "#/api/api";
import type { Feature, UserStatusChangeCount } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { Link } from "#/components/Link/Link";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useWindowSize } from "#/hooks/useWindowSize";
import { CONTACT_SALES_LINK } from "#/modules/licenses/trialLicense";
import { useTheme } from "#/theme/context";
import { AIGovernanceUsersConsumption } from "./AIGovernanceUsersConsumptionChart";
import { LicenseCard } from "./LicenseCard";
import { LicenseSeatConsumptionChart } from "./LicenseSeatConsumptionChart";
import { ManagedAgentsConsumption } from "./ManagedAgentsConsumption";
import { SeatUsageBarCard } from "./SeatUsageBarCard";
import { TotalAgentHoursCard } from "./TotalAgentHoursCard";

type Props = {
	showConfetti: boolean;
	isLoading: boolean;
	hasUserLimitEntitlementData: boolean;
	userLimitActual?: number;
	userLimitLimit?: number;
	licenses?: GetLicensesResponse[];
	isRemovingLicense: boolean;
	isRefreshing: boolean;
	removeLicense: (licenseId: number) => void;
	refreshEntitlements: () => void;
	activeUsers: UserStatusChangeCount[] | undefined;
	managedAgentFeature?: Feature;
	aiGovernanceUserFeature?: Feature;
	agentRuntimeHoursFeature?: Feature;
};

const LicensesSettingsPageView: FC<Props> = ({
	showConfetti,
	isLoading,
	hasUserLimitEntitlementData,
	userLimitActual,
	userLimitLimit,
	licenses,
	isRemovingLicense,
	isRefreshing,
	removeLicense,
	refreshEntitlements,
	activeUsers,
	managedAgentFeature,
	aiGovernanceUserFeature,
	agentRuntimeHoursFeature,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const theme = useTheme();
	const { width, height } = useWindowSize();

	return (
		<>
			<Confetti
				// For some reason this overflows the window and adds scrollbars if we don't subtract here.
				width={width - 1}
				height={height - 1}
				numberOfPieces={showConfetti ? 200 : 0}
				colors={[theme.palette.primary.main, theme.palette.secondary.main]}
			/>
			<div className="flex flex-row gap-4 items-baseline justify-between">
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.licenses_6d5d9004",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.manage_licenses_to_unlock_premium_features_31a087bf",
						)}
					</SettingsHeaderDescription>
				</SettingsHeader>

				<div className="flex flex-row gap-4">
					<Button variant="outline" asChild>
						<RouterLink to="/deployment/licenses/add">
							<PlusIcon />
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.add_a_license_ea3f85ca",
							)}
						</RouterLink>
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={isRefreshing}
								onClick={refreshEntitlements}
								variant="outline"
							>
								<Spinner loading={isRefreshing}>
									<RotateCwIcon />
								</Spinner>
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.refresh_0e916101",
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-xs">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.refresh_license_entitlements_this_is_done_automa_f75b985f",
							)}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				{isLoading && <Skeleton height={78} />}

				{!isLoading && licenses && licenses?.length > 0 && (
					<div className="flex flex-col gap-8 licenses">
						{[...(licenses ?? [])]
							?.sort(
								(a, b) =>
									new Date(b.claims.license_expires).valueOf() -
									new Date(a.claims.license_expires).valueOf(),
							)
							.map((license) => (
								<LicenseCard
									key={license.id}
									license={license}
									userLimitActual={userLimitActual}
									userLimitLimit={userLimitLimit}
									aiGovernanceUserFeature={aiGovernanceUserFeature}
									agentRuntimeHoursFeature={agentRuntimeHoursFeature}
									isRemoving={isRemovingLicense}
									onRemove={removeLicense}
								/>
							))}
					</div>
				)}

				{!isLoading && licenses?.length === 0 && (
					<div className="min-h-[240px] flex items-center justify-center rounded-lg border border-solid border-border p-12">
						<div className="flex flex-col gap-2 items-center">
							<div className="flex flex-col gap-1 items-center">
								<span className="text-base">
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.you_don_t_have_any_licenses_fb1564e1",
									)}
								</span>
								<span className="text-content-secondary text-center max-w-[464px] mt-2">
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.you_re_missing_out_on_high_availability_rbac_quo_28c52a3e",
									)}{" "}
									<Link
										href={CONTACT_SALES_LINK}
										className="m-0 p-0 text-base"
										showExternalIcon={false}
									>
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.sales_e04eb290",
										)}
									</Link>{" "}
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.or_7175517a",
									)}{" "}
									<RouterLink
										to="/deployment/premium"
										className="m-0 p-0 text-content-link"
									>
										{tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.request_a_trial_license_3841f600",
										)}
									</RouterLink>{" "}
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.to_get_started_305f69df",
									)}
								</span>
							</div>
						</div>
					</div>
				)}

				{licenses && licenses.length > 0 && (
					<>
						<LicenseSeatConsumptionChart
							limit={userLimitLimit}
							data={activeUsers?.map((i) => ({
								date: i.date,
								users: i.count,
								limit: 80,
							}))}
						/>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{hasUserLimitEntitlementData && (
								<SeatUsageBarCard
									title={tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPageView.seat_usage_d098712f",
									)}
									actual={userLimitActual}
									limit={userLimitLimit}
									allowUnlimited
								/>
							)}
							<AIGovernanceUsersConsumption
								aiGovernanceUserFeature={aiGovernanceUserFeature}
								licenses={licenses}
							/>
						</div>

						<TotalAgentHoursCard feature={agentRuntimeHoursFeature} />

						<ManagedAgentsConsumption
							managedAgentFeature={managedAgentFeature}
						/>
					</>
				)}
			</div>
		</>
	);
};

export default LicensesSettingsPageView;
