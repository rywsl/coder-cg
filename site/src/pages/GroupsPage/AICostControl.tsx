import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "#/components/Link/Link";
import { docs } from "#/utils/docs";

export const SpendEstimateDocsLink: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Link
			href={docs("/ai-coder/ai-gateway/cost-controls#how-spend-is-estimated")}
			target="_blank"
			rel="noreferrer"
		>
			{tI18n("GroupsPage.AICostControl.how_spend_is_estimated_16dc6144")}
		</Link>
	);
};
