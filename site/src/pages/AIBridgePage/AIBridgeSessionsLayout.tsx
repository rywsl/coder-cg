import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { Link } from "#/components/Link/Link";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import { docs } from "#/utils/docs";

const AIBridgeSessionsLayout: FC<PropsWithChildren> = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<Margins className="pb-12">
			<PageHeader>
				<PageHeaderTitle>
					<div className="flex items-center gap-2">
						<span>
							{tI18n(
								"AIBridgePage.AIBridgeSessionsLayout.ai_sessions_647e1a78",
							)}
						</span>
					</div>
				</PageHeaderTitle>
				<PageHeaderSubtitle>
					{tI18n(
						"AIBridgePage.AIBridgeSessionsLayout.review_and_audit_ai_activity_token_usage_and_pro_ccbe1f79",
					)}{" "}
					<Link href={docs("/ai-coder/ai-gateway/audit")}>
						{tI18n("AIBridgePage.AIBridgeSessionsLayout.view_docs_61479fda")}
					</Link>
				</PageHeaderSubtitle>
			</PageHeader>
			<Outlet />
		</Margins>
	);
};

export default AIBridgeSessionsLayout;
