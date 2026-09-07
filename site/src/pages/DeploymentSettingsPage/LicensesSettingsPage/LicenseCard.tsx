import { cn } from "cn";
import dayjs from "dayjs";
import { ChevronDownIcon, EllipsisVerticalIcon, TrashIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetLicensesResponse } from "#/api/api";
import type { Feature } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/Collapsible/Collapsible";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { AIGovernanceAddOnCard } from "./AIGovernanceAddOnCard";
import { licenseShowsAiGovernanceAddOn } from "./AIGovernanceLicensing";
import { CoderAgentsProductCard } from "./CoderAgentsProductCard";
import { CoderWorkspacesProductCard } from "./CoderWorkspacesProductCard";
import { isLicenseApplicableForFeatureUsage } from "./licenseApplicability";

type LicenseCardProps = {
	license: GetLicensesResponse;
	aiGovernanceUserFeature?: Feature;
	agentRuntimeHoursFeature?: Feature;
	userLimitActual?: number;
	userLimitLimit?: number;
	onRemove: (licenseId: number) => void;
	isRemoving: boolean;
};

export const LicenseCard: FC<LicenseCardProps> = ({
	license,
	aiGovernanceUserFeature,
	agentRuntimeHoursFeature,
	userLimitActual,
	userLimitLimit,
	onRemove,
	isRemoving,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [licenseIDMarkedForRemoval, setLicenseIDMarkedForRemoval] = useState<
		number | undefined
	>(undefined);

	const currentUserLimit = license.claims.features.user_limit ?? userLimitLimit;
	const confirmationName = licenseIDMarkedForRemoval?.toString() ?? "";

	const isExpired = dayjs
		.unix(license.claims.license_expires)
		.isBefore(dayjs());
	const isNotYetValid =
		license.claims.nbf !== undefined &&
		dayjs.unix(license.claims.nbf).isAfter(dayjs());
	const isPremium = license.claims.feature_set?.toLowerCase() === "premium";
	const aiGovernanceActual = aiGovernanceUserFeature?.actual;
	const aiGovernanceMergedLimit = aiGovernanceUserFeature?.limit;
	const aiGovernanceLimit =
		license.claims.features?.ai_governance_user_limit ?? 0;

	const licenseType = isPremium ? "Premium" : "Enterprise";

	const hasExplicitAiGovernanceAddOn = licenseShowsAiGovernanceAddOn(license);
	// Overage/display checks only apply to licenses that are currently effective.
	const isLicenseApplicable = isLicenseApplicableForFeatureUsage(
		license,
		aiGovernanceUserFeature,
	);
	// A license "wins" when its AI Governance limit matches the merged limit.
	const isWinningAiGovernanceLicense =
		aiGovernanceMergedLimit !== undefined &&
		aiGovernanceLimit > 0 &&
		aiGovernanceLimit === aiGovernanceMergedLimit;
	const canUseAiGovernanceUsageForThisLicense =
		isLicenseApplicable &&
		hasExplicitAiGovernanceAddOn &&
		isWinningAiGovernanceLicense;
	// Show the add-on as exceeded only for the winning, active add-on license.
	const isAiGovernanceAddOnExceeded =
		canUseAiGovernanceUsageForThisLicense &&
		aiGovernanceActual !== undefined &&
		aiGovernanceActual > aiGovernanceLimit;
	// Show actual usage only when this license is the one providing the limit.
	const aiGovernanceDisplayActual = canUseAiGovernanceUsageForThisLicense
		? aiGovernanceActual
		: undefined;

	// Agent runtime hour claims, in hours. -1 means unlimited; other
	// negatives are ignored and zero grants the feature disabled.
	const agentHoursAllocation =
		license.claims.features.agent_runtime_hours_allocation;
	// The backend decodes these claims for any feature set, so a
	// non-Premium license with a usable claim also shows Coder Agents.
	const hasAgentHoursClaim =
		agentHoursAllocation !== undefined &&
		(agentHoursAllocation >= 0 || agentHoursAllocation === -1);
	const licenseGrantsAgentHours =
		agentHoursAllocation !== undefined &&
		(agentHoursAllocation > 0 || agentHoursAllocation === -1);
	// Mirror the backend's threshold validation; invalid claims are
	// ignored rather than disqualifying the license.
	const agentHoursSoftLimitClaim =
		license.claims.features.agent_runtime_hours_limit_soft;
	const agentHoursHardLimitClaim =
		license.claims.features.agent_runtime_hours_limit_hard;
	const agentHoursSoftLimit =
		agentHoursAllocation !== undefined &&
		agentHoursAllocation > 0 &&
		agentHoursSoftLimitClaim !== undefined &&
		agentHoursSoftLimitClaim >= 0 &&
		agentHoursSoftLimitClaim < agentHoursAllocation
			? agentHoursSoftLimitClaim
			: undefined;
	const agentHoursHardLimit =
		agentHoursAllocation !== undefined &&
		agentHoursAllocation > 0 &&
		agentHoursHardLimitClaim !== undefined &&
		agentHoursHardLimitClaim >= agentHoursAllocation
			? agentHoursHardLimitClaim
			: undefined;
	const isAgentHoursLicenseApplicable = isLicenseApplicableForFeatureUsage(
		license,
		agentRuntimeHoursFeature,
	);
	// The merged usage period is copied from the winning license's
	// iat/nbf/exp claims. All three must match: issued-at alone can
	// collide across licenses.
	const mergedUsagePeriod = agentRuntimeHoursFeature?.usage_period;
	const matchesMergedUsagePeriod =
		license.claims.iat !== undefined &&
		license.claims.nbf !== undefined &&
		license.claims.exp !== undefined &&
		mergedUsagePeriod !== undefined &&
		dayjs.unix(license.claims.iat).isSame(mergedUsagePeriod.issued_at) &&
		dayjs.unix(license.claims.nbf).isSame(mergedUsagePeriod.start) &&
		dayjs.unix(license.claims.exp).isSame(mergedUsagePeriod.end);
	// The winner's allocation and thresholds must also equal the merged
	// entitlement's; an unlimited allocation reports no merged limit.
	const isWinningAgentHoursLicense =
		matchesMergedUsagePeriod &&
		agentHoursSoftLimit === agentRuntimeHoursFeature?.soft_limit &&
		agentHoursHardLimit === agentRuntimeHoursFeature?.hard_limit &&
		(agentHoursAllocation === -1
			? agentRuntimeHoursFeature?.enabled === true &&
				agentRuntimeHoursFeature.limit === undefined
			: agentHoursAllocation !== undefined &&
				agentHoursAllocation > 0 &&
				agentHoursAllocation === agentRuntimeHoursFeature?.limit);
	const canUseAgentHoursUsageForThisLicense =
		isAgentHoursLicenseApplicable && isWinningAgentHoursLicense;
	// Usage floored to tenths of an hour via integer math so the display
	// and the exceeded states below flip at the same instant.
	const agentHoursActualMs = agentRuntimeHoursFeature?.actual_ms;
	const agentHoursActual =
		agentHoursActualMs === undefined
			? undefined
			: Math.floor(agentHoursActualMs / 360_000) / 10;
	// Licenses without an allocation show deployment-wide usage in their
	// upgrade card.
	const agentHoursDisplayActual =
		isAgentHoursLicenseApplicable &&
		(isWinningAgentHoursLicense || !licenseGrantsAgentHours)
			? agentHoursActual
			: undefined;
	const isAgentHoursHardLimitExceeded =
		canUseAgentHoursUsageForThisLicense &&
		agentHoursHardLimit !== undefined &&
		agentHoursDisplayActual !== undefined &&
		agentHoursDisplayActual >= agentHoursHardLimit;
	// Inclusive: usage equal to the allocation is already over, matching
	// the backend's "allocation reached" warning boundary.
	const isAgentHoursExceeded =
		canUseAgentHoursUsageForThisLicense &&
		!isAgentHoursHardLimitExceeded &&
		agentHoursAllocation !== undefined &&
		agentHoursAllocation > 0 &&
		agentHoursDisplayActual !== undefined &&
		agentHoursDisplayActual >= agentHoursAllocation;
	// Advisory only: at or above the soft threshold, still inside the
	// purchased allocation. Allocation and hard-limit overage supersede
	// this so the product card never stacks warning on destructive.
	const isAgentHoursSoftLimitReached =
		canUseAgentHoursUsageForThisLicense &&
		!isAgentHoursHardLimitExceeded &&
		!isAgentHoursExceeded &&
		agentHoursAllocation !== undefined &&
		agentHoursAllocation > 0 &&
		agentHoursSoftLimit !== undefined &&
		agentHoursDisplayActual !== undefined &&
		agentHoursDisplayActual >= agentHoursSoftLimit &&
		agentHoursDisplayActual < agentHoursAllocation;

	const statusClassName =
		isAgentHoursHardLimitExceeded ||
		isAgentHoursExceeded ||
		isAiGovernanceAddOnExceeded ||
		isExpired
			? "text-content-destructive"
			: isNotYetValid
				? "text-content-warning"
				: "text-content-success";
	const statusText = isAgentHoursHardLimitExceeded
		? tI18n(
				"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.limit_exceeded_c5d1937b",
			)
		: isAgentHoursExceeded
			? tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.agent_hours_exceeded_cf4f066f",
				)
			: isAiGovernanceAddOnExceeded
				? tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.add_on_exceeded_05be64ad",
					)
				: isExpired
					? tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.expired_424a2551",
						)
					: isNotYetValid
						? tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.not_started_ba35f0c4",
							)
						: tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.active_92340695",
							);
	const includesAgents =
		Boolean(license.claims.trial) || licenseGrantsAgentHours;
	const includedProducts = isPremium
		? [
				"Workspaces",
				...(hasExplicitAiGovernanceAddOn ? ["AI Governance"] : []),
				...(includesAgents ? ["Agents"] : []),
			]
		: [];
	const includedProductsLabel = includedProducts.join(" + ");
	const headerContent = (
		<>
			<div className="flex items-start gap-1.5">
				<ChevronDownIcon className="license-chevron mt-1 size-4 shrink-0 text-content-secondary transition-colors transition-transform group-hover:text-content-primary" />
				<span className="text-base font-medium text-content-secondary">
					#{license.id}
				</span>
				<div className="flex min-w-0 flex-col">
					<span className="account-type text-base font-medium text-content-primary capitalize">
						{licenseType}
					</span>
					{includedProducts.length > 0 && (
						<div
							role="group"
							aria-label={includedProductsLabel}
							className="text-xs font-medium text-content-secondary"
						>
							{includedProducts.map((product, index) => (
								<span key={product}>
									{index > 0 && (
										<span className="text-highlight-purple"> + </span>
									)}
									{product}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="ml-auto flex items-center gap-12 text-xs font-medium">
				<div className="flex flex-col items-center">
					<span className="text-content-secondary">
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.status_920e413c",
						)}
					</span>
					<span className={statusClassName}>{statusText}</span>
				</div>
				<div className="flex flex-col items-center">
					<span className="text-content-secondary">
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.type_baaddf70",
						)}
					</span>
					<span className="license-type text-content-primary">
						{license.claims.trial
							? tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.trial_98a66e97",
								)
							: tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.standard_ef669154",
								)}
					</span>
				</div>
				<div className="flex flex-col items-center">
					<span className="text-content-secondary">
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.users_6b0cc904",
						)}
					</span>
					<span className="text-content-primary user-limit">
						{userLimitActual} {` / ${currentUserLimit || "Unlimited"}`}
					</span>
				</div>
				{license.claims.nbf && (
					<div className="flex flex-col items-center">
						<span className="text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.valid_from_f38b0e27",
							)}
						</span>
						<span
							className={cn("license-valid-from", {
								"text-content-warning": statusText === "Not started",
								"text-content-primary": statusText !== "Not started",
							})}
						>
							{dayjs.unix(license.claims.nbf).format("MMMM D, YYYY")}
						</span>
					</div>
				)}
				<div className="flex flex-col items-center">
					<span className="text-content-secondary">
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.valid_until_b252ed96",
						)}
					</span>
					<span className="text-content-primary license-expires">
						{dayjs.unix(license.claims.license_expires).format("MMMM D, YYYY")}
					</span>
				</div>
			</div>
		</>
	);

	return (
		<Collapsible defaultOpen>
			<DeleteDialog
				key={licenseIDMarkedForRemoval}
				isOpen={licenseIDMarkedForRemoval !== undefined}
				onConfirm={() => {
					if (!licenseIDMarkedForRemoval) return;
					onRemove(licenseIDMarkedForRemoval);
					setLicenseIDMarkedForRemoval(undefined);
				}}
				onCancel={() => setLicenseIDMarkedForRemoval(undefined)}
				entity={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.license_cc1d3b02",
				)}
				name={confirmationName}
				label={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.id_of_the_license_to_remove_af756af2",
				)}
				title={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.confirm_license_removal_9952c9b1",
				)}
				verb={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.removing_9f2c59a1",
				)}
				confirmText={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.remove_c3812fc4",
				)}
				info={
					isExpired
						? tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.this_license_has_already_expired_and_is_not_prov_6a5aae22",
							)
						: tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.removing_this_license_will_disable_all_premium_f_8f5def18",
							)
				}
				confirmLoading={isRemoving}
			/>
			<div className="license-card group overflow-hidden rounded-md border border-solid border-border bg-surface-secondary text-sm shadow-xs">
				<div className="flex items-center gap-6 p-3">
					<CollapsibleTrigger
						asChild
						className="[&[data-state=closed]_.license-chevron]:-rotate-90"
					>
						<button
							type="button"
							className="m-0 flex min-w-0 flex-1 appearance-none items-center gap-6 border-0 bg-transparent p-0 text-left"
						>
							{headerContent}
						</button>
					</CollapsibleTrigger>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="icon"
								variant="subtle"
								onClick={(event) => event.stopPropagation()}
								className="size-[30px]"
							>
								<EllipsisVerticalIcon />
								<span className="sr-only">
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.show_license_actions_a942a24c",
									)}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								className="text-content-destructive focus:text-content-destructive"
								onClick={() => setLicenseIDMarkedForRemoval(license.id)}
							>
								<TrashIcon />
								{tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.remove_708d2523",
								)}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<CollapsibleContent>
					<div className="border-0 border-t border-solid border-border bg-surface-primary px-4 py-4">
						<div className="text-sm font-medium text-content-secondary">
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.products_4edc8bfa",
							)}
						</div>
						<div className="mt-3 flex flex-wrap gap-3">
							<CoderWorkspacesProductCard
								userLimitActual={userLimitActual}
								userLimitLimit={currentUserLimit}
							/>
							{(isPremium || hasAgentHoursClaim) && (
								<CoderAgentsProductCard
									allocation={agentHoursAllocation}
									actual={agentHoursDisplayActual}
									isSoftLimitReached={isAgentHoursSoftLimitReached}
									isExceeded={isAgentHoursExceeded}
									isHardLimitExceeded={isAgentHoursHardLimitExceeded}
								/>
							)}
						</div>
						{hasExplicitAiGovernanceAddOn && (
							<>
								<div className="mt-4 text-sm font-medium text-content-secondary">
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.add_ons_ccfc53fc",
									)}
								</div>
								<div className="mt-3 flex flex-wrap gap-3">
									<AIGovernanceAddOnCard
										title={tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.ai_governance_2ab040bd",
										)}
										unit={tI18n(
											"DeploymentSettingsPage.LicensesSettingsPage.LicenseCard.seats_f3b81325",
										)}
										actual={aiGovernanceDisplayActual}
										limit={aiGovernanceLimit}
										isExceeded={isAiGovernanceAddOnExceeded}
									/>
								</div>
							</>
						)}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
};
