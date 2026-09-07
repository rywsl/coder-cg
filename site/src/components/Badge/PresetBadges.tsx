import { useTranslation } from "react-i18next";
import { Badge } from "./Badge";

export const EnabledBadge: React.FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Badge className="option-enabled" variant="green">
			{tI18n("Badge.PresetBadges.enabled_92c1cdfd")}
		</Badge>
	);
};

export const DisabledBadge: React.FC<React.ComponentPropsWithRef<"div">> = ({
	...props
}) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Badge {...props} className="option-disabled">
			{tI18n("Badge.PresetBadges.disabled_75081b59")}
		</Badge>
	);
};

export const EnterpriseBadge: React.FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Badge variant="purple">
			{tI18n("Badge.PresetBadges.enterprise_3fbe5ed1")}
		</Badge>
	);
};

export const PremiumBadge: React.FC<React.PropsWithChildren> = ({
	children = "Premium",
}) => {
	return <Badge variant="magenta">{children}</Badge>;
};

export const AlphaBadge: React.FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Badge variant="purple">{tI18n("Badge.PresetBadges.alpha_b1a96dd6")}</Badge>
	);
};

export const DeprecatedBadge: React.FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Badge variant="warning">
			{tI18n("Badge.PresetBadges.deprecated_6b2e8f83")}
		</Badge>
	);
};
