import { cn } from "cn";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { Link } from "#/components/Link/Link";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import { currentIntlLocale } from "#/i18n/locale";
import { CONTACT_SALES_LINK } from "#/modules/licenses/trialLicense";
import { docs } from "#/utils/docs";

// Allocation sentinel for unlimited agent runtime hours
// (AgentRuntimeHoursUnlimitedAllocation in enterprise/coderd/license).
const unlimitedAllocation = -1;

// Concurrent chat cap once the hard limit is reached. Mirrors
// defaultMaxConcurrentRootAgents in coderd/x/chatd; keep in sync.
const maxConcurrentChatsOverHardLimit = 5;

type CoderAgentsProductCardProps = {
	/**
	 * The license's agent_runtime_hours_allocation claim, in hours.
	 * Undefined or non-positive (except -1, unlimited) grants no hours.
	 */
	allocation?: number;
	/**
	 * Hours used in the current usage period, floored to tenths.
	 * Undefined when usage does not apply to this license.
	 */
	actual?: number;
	/**
	 * Usage is at or above this license's advisory soft limit, but still
	 * within the purchased allocation.
	 */
	isSoftLimitReached: boolean;
	/** Usage is above this license's allocation. */
	isExceeded: boolean;
	/** Usage is at or above this license's hard limit. */
	isHardLimitExceeded: boolean;
};

const MetricLabel: FC<{ label: string; tooltip: string }> = ({
	label,
	tooltip,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex items-center gap-1 font-medium text-content-secondary">
			<span>{label}</span>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						aria-label={tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.value0_information_7b759800",
							{
								value0: label,
							},
						)}
						className="m-0 inline-flex appearance-none border-0 bg-transparent p-0 text-content-secondary"
					>
						<InfoIcon className="size-3" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="top" className="max-w-xs">
					{tooltip}
				</TooltipContent>
			</Tooltip>
		</div>
	);
};

const CardContainer: FC<{
	className?: string;
	headerEnd?: ReactNode;
	children: ReactNode;
}> = ({ className, headerEnd, children }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div
			className={cn(
				"min-w-[320px] flex-1 rounded-sm border px-6 py-4",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="text-sm font-medium text-content-primary">
					{tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.coder_agents_19b8e154",
					)}
				</div>
				{headerEnd}
			</div>
			{children}
		</div>
	);
};

// TODO: placeholder tooltip copy pending product review.
const totalAgentHoursTooltip = i18n.t(
	"administration:DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.total_agent_runtime_hours_used_out_of_the_hours__c065fa26",
);
const concurrentChatsTooltip = i18n.t(
	"administration:DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.number_of_agents_that_can_run_at_the_same_time_334ba53e",
);
const concurrentChatsHardLimitTooltip = i18n.t(
	"administration:DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.value0_you_ve_reached_your_limit_concurrent_chat_a246ce76",
	{
		value0: concurrentChatsTooltip,
		value1: maxConcurrentChatsOverHardLimit,
	},
);

// The value is already floored to tenths, so no rounding happens here.
const formatHoursUsed = (hours: number) =>
	hours.toLocaleString(currentIntlLocale(), {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});

export const CoderAgentsProductCard: FC<CoderAgentsProductCardProps> = ({
	allocation,
	actual,
	isSoftLimitReached,
	isExceeded,
	isHardLimitExceeded,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const isUnlimited = allocation === unlimitedAllocation;
	const grantsAgentHours =
		allocation !== undefined && (allocation > 0 || isUnlimited);

	if (!grantsAgentHours) {
		return (
			<CardContainer className="border-dashed border-highlight-purple">
				<div className="mt-3 flex flex-wrap gap-x-12 gap-y-3 text-xs">
					<div>
						<MetricLabel
							label={tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.max_concurrent_agents_1ba2d158",
							)}
							tooltip={concurrentChatsTooltip}
						/>
						<div className="mt-0.5 text-sm font-medium text-content-primary">
							{maxConcurrentChatsOverHardLimit}
						</div>
					</div>
					{actual !== undefined && (
						<div>
							<div className="flex items-center gap-1 font-medium text-content-secondary">
								<span>
									{tI18n(
										"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.agent_hours_used_221f75b7",
									)}
								</span>
							</div>
							<div className="mt-0.5 text-sm font-medium text-content-primary">
								{formatHoursUsed(actual)}
							</div>
						</div>
					)}
				</div>
				<Button asChild className="mt-4 w-full">
					<a href={CONTACT_SALES_LINK} target="_blank" rel="noreferrer">
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.upgrade_7ec0261b",
						)}
					</a>
				</Button>
			</CardContainer>
		);
	}

	const isOverage = isExceeded || isHardLimitExceeded;
	const actualLabel = actual === undefined ? "\u2014" : formatHoursUsed(actual);
	const hoursValueClassName = isOverage
		? "text-content-destructive"
		: isSoftLimitReached
			? "text-border-warning"
			: undefined;

	return (
		<CardContainer
			className={cn(
				"border-solid",
				isOverage
					? "border-border-destructive"
					: isSoftLimitReached
						? "border-border-warning"
						: "border-border",
			)}
			headerEnd={
				isHardLimitExceeded ? (
					<Badge variant="destructive" size="sm" role="status">
						<TriangleAlertIcon />
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.limit_reached_6a1ca519",
						)}
					</Badge>
				) : isSoftLimitReached && !isOverage ? (
					// The soft limit is otherwise only conveyed by the warning
					// colors, so announce it for assistive technology too.
					<span role="status" className="sr-only">
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.approaching_hours_limit_cca9d872",
						)}
					</span>
				) : undefined
			}
		>
			<div className="mt-3 flex flex-wrap gap-x-12 gap-y-3 text-xs">
				<div>
					<MetricLabel
						label={tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.total_agent_hours_53225fa8",
						)}
						tooltip={totalAgentHoursTooltip}
					/>
					<div className="mt-0.5 text-sm font-medium text-content-primary">
						{isUnlimited ? (
							tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.unlimited_11dde17d",
							)
						) : (
							<>
								<span className={hoursValueClassName}>{actualLabel}</span> /{" "}
								{allocation.toLocaleString(currentIntlLocale())}
							</>
						)}
					</div>
				</div>
				<div>
					<MetricLabel
						label={tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.concurrent_agents_c416769c",
						)}
						tooltip={
							isHardLimitExceeded
								? concurrentChatsHardLimitTooltip
								: concurrentChatsTooltip
						}
					/>
					<div
						className={cn(
							"mt-0.5 text-sm font-medium",
							isHardLimitExceeded
								? "text-content-destructive"
								: "text-content-primary",
						)}
					>
						{isHardLimitExceeded
							? maxConcurrentChatsOverHardLimit
							: tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.unlimited_11dde17d",
								)}
					</div>
				</div>
			</div>
			<div className="mt-4 text-sm">
				<Link href={docs("/ai-coder/agents/licensing-usage")} size="lg">
					{tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.CoderAgentsProductCard.view_docs_61479fda",
					)}
				</Link>
			</div>
		</CardContainer>
	);
};
