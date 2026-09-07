import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Link } from "#/components/Link/Link";
import { docs } from "#/utils/docs";

export const AIBridgeSetupAlert: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<Alert className="mb-12" severity="warning" prominent>
			<AlertTitle>
				{tI18n(
					"AIBridgePage.AIBridgeSetupAlert.ai_gateway_is_included_in_your_license_but_not_s_b8958a5e",
				)}
			</AlertTitle>
			<AlertDescription>
				{tI18n(
					"AIBridgePage.AIBridgeSetupAlert.you_have_access_to_ai_governance_but_it_still_ne_94431ebc",
				)}{" "}
				<Link href={docs("/ai-coder/ai-gateway")} target="_blank">
					{tI18n("AIBridgePage.AIBridgeSetupAlert.ai_gateway_47219de2")}
				</Link>{" "}
				{tI18n(
					"AIBridgePage.AIBridgeSetupAlert.documentation_to_get_started_82f67848",
				)}
			</AlertDescription>
		</Alert>
	);
};
