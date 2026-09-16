import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useParams } from "react-router";
import { localConnectors } from "#/api/queries/localConnect";
import { workspaceByOwnerAndName } from "#/api/queries/workspaces";
import type { Workspace, WorkspaceAgent } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import {
	LocalAccess,
	localDeviceKey,
} from "#/modules/resources/LocalAccess/LocalAccess";

export default function LocalPreviewPage() {
	const { t } = useTranslation("common");
	const { username = "", workspace = "", agent = "", port = "" } = useParams();
	const query = useQuery(
		workspaceByOwnerAndName(username.replace(/^@/, ""), workspace),
	);
	if (query.error) return <ErrorAlert error={query.error} />;
	if (!query.data) return <Loader />;
	const target = query.data.latest_build.resources
		.flatMap((resource) => resource.agents ?? [])
		.find((candidate) => candidate.name === agent);
	const number = Number(port);
	if (!target || !/^\d+$/.test(port) || number < 1 || number > 65535)
		return <ErrorAlert error={new Error(t("localConnect.invalidTarget"))} />;
	return <LocalPreview workspace={query.data} agent={target} port={number} />;
}

export function LocalPreview({
	workspace,
	agent,
	port,
}: {
	workspace: Workspace;
	agent: WorkspaceAgent;
	port: number;
}) {
	const { t } = useTranslation("common");
	const { browser_only } = useFeatureVisibility();
	const devices = useQuery(localConnectors(workspace.organization_id));
	const deviceID = localStorage.getItem(
		localDeviceKey(workspace.organization_id),
	);
	const device = devices.data?.find((candidate) => candidate.id === deviceID);
	const mapping = device?.reported.find(
		(candidate) =>
			candidate.workspace_id === workspace.id &&
			candidate.agent_name === agent.name &&
			candidate.remote_port === port,
	);
	const ready =
		agent.status === "connected" &&
		agent.lifecycle_state === "ready" &&
		device?.desired.some(
			(target) =>
				target.workspace_id === workspace.id &&
				target.agent_name === agent.name,
		) &&
		device?.online &&
		mapping &&
		!mapping.error_code &&
		mapping.local_port > 0 &&
		mapping.local_port <= 65535 &&
		["http", "https"].includes(mapping.protocol) &&
		!browser_only;
	const href = ready
		? `${mapping.protocol}://localhost:${mapping.local_port}/`
		: undefined;
	useEffect(() => {
		if (href) window.location.replace(href);
	}, [href]);
	const webURL = `/@${encodeURIComponent(workspace.owner_name)}/${encodeURIComponent(workspace.name)}.${encodeURIComponent(agent.name)}/apps/code-server/proxy/${port}/`;
	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
			<h1>{t("localConnect.title")}</h1>
			{devices.error && <ErrorAlert error={devices.error} />}
			{devices.isLoading && <Loader />}
			<LocalAccess
				workspace={workspace}
				agent={agent}
				browserOnly={browser_only}
			/>
			{href && (
				<a href={href}>
					{t("localConnect.open")} {href}
				</a>
			)}
			<p>{t("localConnect.webLimit")}</p>
			{agent.apps.some((app) => app.slug === "code-server") && (
				<a href={webURL}>{t("localConnect.webFallback")}</a>
			)}
		</main>
	);
}
