import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { InfoTooltip } from "#/components/InfoTooltip/InfoTooltip";

// Shared by the sessions list badges and the session detail summary card, which
// render the same two non-numeric states for a session's network requests but
// differ in how they present a live count.

export const NetworkMonitoringDisabled: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<span className="inline-flex items-center gap-1 whitespace-nowrap text-content-secondary">
			{tI18n("AIBridgePage.NetworkRequestStates.disabled_75081b59")}
			<InfoTooltip
				message={tI18n(
					"AIBridgePage.NetworkRequestStates.network_request_monitoring_was_not_active_for_th_c7355552",
				)}
			/>
		</span>
	);
};

export const NetworkNoActivity: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<span className="whitespace-nowrap text-content-secondary">
			{tI18n("AIBridgePage.NetworkRequestStates.no_activity_0cf9505f")}
		</span>
	);
};
