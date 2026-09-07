import { ExternalLinkIcon, NetworkIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace, WorkspaceAgent } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { i18n } from "#/i18n";
import { WorkspaceIframe } from "#/modules/apps/WorkspaceAppFrame";
import { portForwardURL } from "#/utils/portForward";
import type { UserRightPanelTab } from "../../utils/rightPanelTabs";

export const PortPreviewPanel: FC<{
	workspace: Workspace;
	agent: WorkspaceAgent;
	host: string;
	tab: Extract<UserRightPanelTab, { kind: "port" }>;
}> = ({ workspace, agent, host, tab }) => {
	const { t: tI18n } = useTranslation("agents");

	const url = portForwardURL(
		host,
		tab.port,
		agent.name,
		workspace.name,
		workspace.owner_name,
		tab.protocol,
	);
	const unavailableMessage = getUnavailableMessage({ host, agent, url });

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex shrink-0 items-center gap-2 border-0 border-b border-solid border-border-default bg-surface-secondary px-2 py-1 text-xs text-content-secondary">
				<NetworkIcon className="size-3.5 shrink-0" />
				<span className="min-w-0 truncate text-content-primary">
					{tab.label}
				</span>
				<div className="flex-1" />
				{unavailableMessage ? (
					<Button
						size="icon"
						variant="subtle"
						disabled
						aria-label={tI18n(
							"AgentsPage.components.RightPanel.PortPreviewPanel.open_port_in_new_tab_e0d5c04f",
						)}
					>
						<ExternalLinkIcon />
					</Button>
				) : (
					<Button size="icon" variant="subtle" asChild>
						<a
							href={url}
							target="_blank"
							rel="noreferrer"
							aria-label={tI18n(
								"AgentsPage.components.RightPanel.PortPreviewPanel.open_port_in_new_tab_e0d5c04f",
							)}
						>
							<ExternalLinkIcon />
						</a>
					</Button>
				)}
			</div>
			{unavailableMessage ? (
				<div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-xs text-content-secondary">
					{unavailableMessage}
				</div>
			) : (
				<WorkspaceIframe src={url} title={tab.label} />
			)}
		</div>
	);
};

function getUnavailableMessage({
	host,
	agent,
	url,
}: {
	host: string;
	agent: WorkspaceAgent;
	url: string;
}): string | undefined {
	if (host.trim() === "") {
		return i18n.t(
			"agents:AgentsPage.components.RightPanel.PortPreviewPanel.port_previews_require_a_wildcard_access_url_c023812a",
		);
	}
	if (agent.status !== "connected") {
		return i18n.t(
			"agents:AgentsPage.components.RightPanel.PortPreviewPanel.port_preview_will_be_available_once_the_workspac_d287032d",
		);
	}
	if (url === "#") {
		return i18n.t(
			"agents:AgentsPage.components.RightPanel.PortPreviewPanel.the_wildcard_access_url_produced_an_invalid_prev_846953f0",
		);
	}
	return undefined;
}
