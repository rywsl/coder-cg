import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import { AIBridgeHelpPopover } from "./AIBridgeHelpPopover";

const AIBridgeLayout: FC<PropsWithChildren> = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<Margins className="pb-12">
			<PageHeader>
				<PageHeaderTitle>
					<div className="flex items-center gap-2">
						<span>
							{tI18n("AIBridgePage.AIBridgeLayout.ai_gateway_logs_507617f1")}
						</span>
						<AIBridgeHelpPopover />
					</div>
				</PageHeaderTitle>
				<PageHeaderSubtitle>
					{tI18n(
						"AIBridgePage.AIBridgeLayout.centralized_auditing_for_llm_usage_across_your_o_4f6c5abe",
					)}
				</PageHeaderSubtitle>
			</PageHeader>
			<Outlet />
		</Margins>
	);
};

export default AIBridgeLayout;
