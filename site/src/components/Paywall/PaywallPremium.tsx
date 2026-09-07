import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Supergraphic } from "#/components/Supergraphic/Supergraphic";
import { i18n } from "#/i18n";
import {
	PaywallCTALink,
	PaywallFeature,
	PaywallFeatures,
	PaywallGuidance,
	type PaywallProps,
	PaywallTitle,
	PREMIUM_DEFAULT_DESCRIPTION,
	PREMIUM_DEFAULT_HERO,
	PREMIUM_FEATURES,
	PREMIUM_PAGE_PATH,
} from "./Paywall";

const DEFAULT_HERO_SUBTITLE = i18n.t(
	"components:Paywall.PaywallPremium.start_an_unlimited_30_day_trial_today_d4b369bb",
);

const PaywallPremiumHeader: FC<React.ComponentProps<"div">> = ({
	children,
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				"relative isolate overflow-hidden rounded-lg py-12 mb-8",
				"flex flex-col items-center justify-center px-6 text-center",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

const PaywallPremiumContent: FC<React.ComponentProps<"div">> = ({
	children,
	className,
	...props
}) => {
	return (
		<div
			className={cn("flex flex-col md:flex-row gap-8 px-6 pb-6", className)}
			{...props}
		>
			{children}
		</div>
	);
};

const PaywallPremium = ({
	message,
	description = PREMIUM_DEFAULT_DESCRIPTION,
	canViewPremium,
	className,
	features = PREMIUM_FEATURES,
	onCTAClick,
	...props
}: PaywallProps) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<div
			className={cn(
				"rounded-lg border border-solid border-border-default bg-surface-primary p-2",
				className,
			)}
			{...props}
		>
			<PaywallPremiumHeader>
				<Supergraphic />
				<PaywallTitle>{PREMIUM_DEFAULT_HERO}</PaywallTitle>
				<p className="mt-3 mb-0 text-sm">{DEFAULT_HERO_SUBTITLE}</p>
				{canViewPremium ? (
					<PaywallCTALink
						to={PREMIUM_PAGE_PATH}
						className="mt-6 mx-0"
						onClick={onCTAClick}
					>
						{tI18n("Paywall.PaywallPremium.start_trial_for_free_1386ba3c")}
					</PaywallCTALink>
				) : (
					<PaywallGuidance className="mt-6 mx-0">
						{tI18n(
							"Paywall.PaywallPremium.contact_your_deployment_administrator_for_premiu_e349ee15",
						)}
					</PaywallGuidance>
				)}
			</PaywallPremiumHeader>
			<PaywallPremiumContent>
				<div className="flex-1">
					<h3 className="m-0 font-semibold text-base leading-relaxed text-content-primary">
						{description}
					</h3>
				</div>
				<PaywallFeatures className="flex-1 px-0" aria-label={message}>
					{features.map((feature) => (
						<PaywallFeature key={feature}>{feature}</PaywallFeature>
					))}
				</PaywallFeatures>
			</PaywallPremiumContent>
		</div>
	);
};

export { PaywallPremium };
