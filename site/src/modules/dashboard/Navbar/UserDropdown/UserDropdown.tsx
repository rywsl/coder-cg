import { cn } from "cn";
import { OctagonAlertIcon, TriangleAlertIcon } from "lucide-react";
import type { FC, JSX } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { meAISpend } from "#/api/queries/users";
import type * as TypesGen from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { i18n } from "#/i18n";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { getSeverity, type UsageSeverity } from "#/utils/budget";
import { UserDropdownAISpend } from "./UserDropdownAISpend";
import { UserDropdownContent } from "./UserDropdownContent";
import { UserDropdownPremiumTrialCTA } from "./UserDropdownPremiumTrialCTA";

// Elevated states show a corner badge with a distinct icon per state.
const severityIndicators: Partial<
	Record<UsageSeverity, { badge: string; icon: JSX.Element; label: string }>
> = {
	warning: {
		badge: "bg-surface-orange text-highlight-orange",
		icon: <TriangleAlertIcon aria-hidden className="size-3" />,
		label: i18n.t(
			"dashboard:dashboard.Navbar.UserDropdown.UserDropdown.ai_spend_is_nearing_its_limit_21a981cc",
		),
	},
	exceeded: {
		badge: "bg-surface-red text-highlight-red",
		icon: <OctagonAlertIcon aria-hidden className="size-3" />,
		label: i18n.t(
			"dashboard:dashboard.Navbar.UserDropdown.UserDropdown.ai_spend_limit_exceeded_2ac39fb8",
		),
	},
};

interface UserDropdownProps {
	user: TypesGen.User;
	buildInfo?: TypesGen.BuildInfoResponse;
	supportLinks: readonly TypesGen.LinkConfig[];
	codernautsEnabled?: boolean;
	onSignOut: () => void;
	canViewLicenses: boolean;
}

export const UserDropdown: FC<UserDropdownProps> = ({
	buildInfo,
	user,
	supportLinks,
	codernautsEnabled,
	onSignOut,
	canViewLicenses,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	const aibridgeVisible = Boolean(useFeatureVisibility().aibridge);
	const { data, isError } = useQuery({
		...meAISpend(),
		enabled: aibridgeVisible,
	});

	// A null budget is unlimited and still shown.
	const hasValidSpend =
		data !== undefined &&
		data.current_spend_micros >= 0 &&
		(data.effective_budget === null ||
			data.effective_budget.spend_limit_micros >= 0);
	const spend =
		aibridgeVisible && !isError && hasValidSpend
			? {
					currentSpend: data.current_spend_micros,
					spendLimit: data.effective_budget?.spend_limit_micros ?? null,
					periodStart: data.period_start,
					periodEnd: data.period_end,
				}
			: null;
	const severity =
		spend && spend.spendLimit !== null
			? getSeverity(spend.currentSpend, spend.spendLimit)
			: "normal";
	const indicator = spend ? severityIndicators[severity] : undefined;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={
						indicator
							? tI18n(
									"dashboard.Navbar.UserDropdown.UserDropdown.user_menu_value0_bf9ce2a7",
									{
										value0: indicator.label,
									},
								)
							: tI18n(
									"dashboard.Navbar.UserDropdown.UserDropdown.user_menu_6fa25be1",
								)
					}
					className="relative bg-transparent border-0 cursor-pointer p-0"
				>
					<Avatar fallback={user.username} src={user.avatar_url} size="lg" />
					{indicator && (
						<span
							className={cn(
								"absolute -top-2 -right-2 flex size-[18px] items-center",
								"justify-center rounded",
								indicator.badge,
							)}
						>
							{indicator.icon}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[260px]">
				<UserDropdownContent
					user={user}
					buildInfo={buildInfo}
					profileExtra={
						spend && (
							<>
								<DropdownMenuSeparator />
								<UserDropdownAISpend {...spend} />
							</>
						)
					}
					supportLinks={supportLinks}
					codernautsEnabled={codernautsEnabled}
					onSignOut={onSignOut}
					trialCta={
						<UserDropdownPremiumTrialCTA canViewLicenses={canViewLicenses} />
					}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
