import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import { ScrollArea } from "#/components/ScrollArea/ScrollArea";
import { AgentPageHeader } from "./components/AgentPageHeader";

const AgentSettingsLayout: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const location = useLocation();
	const match = location.pathname.match(/\/agents\/settings\/(.+)/);
	const section = match?.[1];
	const mobileBack = section
		? {
				to: "/agents/settings",
				label: tI18n("AgentsPage.AgentSettingsLayout.settings_74a883a0"),
			}
		: undefined;

	return (
		<ScrollArea className="min-h-0 flex-1" viewportClassName="[&>div]:block!">
			<AgentPageHeader mobileBack={mobileBack} />
			<div className="p-4 pt-8">
				<div className="mx-auto w-full max-w-3xl">
					<Outlet />
				</div>
			</div>
		</ScrollArea>
	);
};

export default AgentSettingsLayout;
