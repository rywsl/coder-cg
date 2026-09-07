import { CodeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import type { HealthcheckReport } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { pageTitle } from "#/utils/page";
import {
	Header,
	HeaderTitle,
	HealthyDot,
	Main,
	Pill,
	SectionLabel,
} from "./Content";
import { MuteWarningsButton } from "./MuteWarningsButton";

const WebsocketPage = () => {
	const { t: tI18n } = useTranslation("pages");

	const healthStatus = useOutletContext<HealthcheckReport>();
	const { websocket } = healthStatus;

	return (
		<>
			<title>
				{pageTitle(tI18n("HealthPage.WebsocketPage.websocket_health_f99d0eb7"))}
			</title>
			<Header>
				<HeaderTitle>
					<HealthyDot severity={websocket.severity} />
					{tI18n("HealthPage.WebsocketPage.websocket_748a3a01")}
				</HeaderTitle>
				<MuteWarningsButton healthcheck="Websocket" />
			</Header>
			<Main>
				{websocket.error && (
					<Alert severity="error" prominent>
						{websocket.error}
					</Alert>
				)}

				{websocket.warnings.map((warning) => {
					return (
						<Alert key={warning.code} severity="warning" prominent dismissible>
							{warning.message}
						</Alert>
					);
				})}

				<section>
					<Tooltip>
						<TooltipTrigger asChild>
							<Pill icon={<CodeIcon className="size-icon-sm" />}>
								{websocket.code}
							</Pill>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{tI18n("HealthPage.WebsocketPage.code_340f4630")}
						</TooltipContent>
					</Tooltip>
				</section>

				<section>
					<SectionLabel>
						{tI18n("HealthPage.WebsocketPage.body_6ccaa641")}
					</SectionLabel>
					<div className="bg-surface-secondary border border-solid border-border rounded-lg text-sm p-6 font-mono">
						{websocket.body !== "" ? (
							websocket.body
						) : (
							<span className="text-content-secondary">
								{tI18n("HealthPage.WebsocketPage.no_body_message_20f9ab6d")}
							</span>
						)}
					</div>
				</section>
			</Main>
		</>
	);
};

export default WebsocketPage;
