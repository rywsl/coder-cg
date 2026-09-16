import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { isApiError } from "#/api/errors";
import { deploymentSSHConfig } from "#/api/queries/deployment";
import {
	enrollLocalConnector,
	localConnectorRelease,
	localConnectors,
	revokeLocalConnector,
	updateLocalConnector,
} from "#/api/queries/localConnect";
import { workspaceSSHEnrollmentStatus } from "#/api/queries/workspaceSSH";
import type {
	LocalConnectorWorkspace,
	Workspace,
	WorkspaceAgent,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Input } from "#/components/Input/Input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";

export const localDeviceKey = (organization: string) =>
	`coder.local.device.${organization}`;

export function LocalAccess({
	workspace,
	agent,
	browserOnly,
}: {
	workspace: Workspace;
	agent: WorkspaceAgent;
	browserOnly: boolean;
}) {
	const { t } = useTranslation("common");
	const [open, setOpen] = useState(false);
	const [deviceID, setDeviceID] = useState(
		() => localStorage.getItem(localDeviceKey(workspace.organization_id)) ?? "",
	);
	const [port, setPort] = useState("");
	const [invalidPort, setInvalidPort] = useState(false);
	const [paused, setPaused] = useState(false);
	const selectorID = useId();
	const portID = useId();
	const queryClient = useQueryClient();
	const devices = useQuery(localConnectors(workspace.organization_id));
	const gateway = useQuery(deploymentSSHConfig());
	const release = useQuery(localConnectorRelease(open));
	const enroll = useMutation(enrollLocalConnector(agent.id));
	const update = useMutation(
		updateLocalConnector(queryClient, workspace.organization_id),
	);
	const revoke = useMutation(
		revokeLocalConnector(queryClient, workspace.organization_id),
	);
	const enrollment = useQuery(
		workspaceSSHEnrollmentStatus(
			enroll.data?.enrollment_id ?? "",
			open && Boolean(enroll.data),
			2000,
		),
	);
	const device = devices.data?.find((candidate) => candidate.id === deviceID);
	const enrolledDevice = devices.data?.find(
		(candidate) =>
			candidate.workspace_ssh_key_id === enrollment.data?.workspace_ssh_key_id,
	);
	const canConnect =
		Boolean(gateway.data?.workspace_ssh_gateway?.enabled) &&
		!browserOnly &&
		agent.status === "connected" &&
		agent.lifecycle_state === "ready";
	const selected = device?.desired.find(
		(target) =>
			target.workspace_id === workspace.id && target.agent_name === agent.name,
	);
	const activated = useRef("");
	const mutate = update.mutate;
	// Synchronize this browser's explicit device selection with its background connector.
	useEffect(() => {
		if (
			!device ||
			!canConnect ||
			paused ||
			selected ||
			activated.current === device.id
		)
			return;
		activated.current = device.id;
		mutate(
			{
				id: device.id,
				revision: device.revision,
				desired: [
					...device.desired,
					{
						workspace_id: workspace.id,
						agent_name: agent.name,
						automatic: true,
						ports: [],
					},
				],
			},
			{
				onError: (error) => {
					if (isApiError(error) && error.response.status === 409)
						activated.current = "";
				},
			},
		);
	}, [device, canConnect, paused, selected, mutate, workspace.id, agent.name]);
	const save = (target?: LocalConnectorWorkspace) => {
		if (!device) return;
		const desired = device.desired.filter(
			(item) =>
				item.workspace_id !== workspace.id || item.agent_name !== agent.name,
		);
		if (target) desired.push(target);
		update.mutate({ id: device.id, revision: device.revision, desired });
	};
	const begin = () => {
		setPaused(false);
		save({
			workspace_id: workspace.id,
			agent_name: agent.name,
			automatic: true,
			ports: selected?.ports ?? [],
		});
	};
	const selectDevice = (id: string) => {
		setDeviceID(id);
		setPaused(false);
		localStorage.setItem(localDeviceKey(workspace.organization_id), id);
	};
	const mappings =
		device?.reported.filter(
			(mapping) =>
				mapping.workspace_id === workspace.id &&
				mapping.agent_name === agent.name,
		) ?? [];
	const busy = update.isPending || revoke.isPending;
	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				{t("localConnect.title")}
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>{t("localConnect.title")}</DialogTitle>
						<DialogDescription>
							{t("localConnect.description")}
						</DialogDescription>
					</DialogHeader>
					{devices.isLoading && (
						<p role="status">{t("localConnect.loading")}</p>
					)}
					{(devices.error ||
						gateway.error ||
						update.error ||
						revoke.error ||
						enroll.error) && (
						<ErrorAlert
							error={
								devices.error ||
								gateway.error ||
								update.error ||
								revoke.error ||
								enroll.error
							}
						/>
					)}
					{!canConnect && <p>{t("localConnect.blocked")}</p>}
					{devices.data?.length === 0 && <p>{t("localConnect.empty")}</p>}
					<label htmlFor={selectorID}>{t("localConnect.device")}</label>
					<Select value={deviceID} onValueChange={selectDevice}>
						<SelectTrigger id={selectorID}>
							<SelectValue placeholder={t("localConnect.choose")} />
						</SelectTrigger>
						<SelectContent>
							{devices.data?.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{device && (
						<>
							<p role="status">
								{device.online
									? t("localConnect.online")
									: t("localConnect.offline")}
							</p>
							<div className="flex flex-wrap gap-2">
								<Button disabled={!canConnect || busy} onClick={begin}>
									{selected
										? t("localConnect.reconnect")
										: t("localConnect.start")}
								</Button>
								<Button
									variant="outline"
									disabled={busy || !selected}
									onClick={() => {
										setPaused(true);
										save();
									}}
								>
									{t("localConnect.stop")}
								</Button>
								<Button
									variant="outline"
									disabled={busy}
									onClick={() =>
										revoke.mutate(device.workspace_ssh_key_id, {
											onSuccess: () => {
												setDeviceID("");
												localStorage.removeItem(
													localDeviceKey(workspace.organization_id),
												);
											},
										})
									}
								>
									{t("localConnect.revoke")}
								</Button>
							</div>
							<label htmlFor={portID}>{t("localConnect.port")}</label>
							<div className="flex gap-2">
								<Input
									id={portID}
									inputMode="numeric"
									value={port}
									onChange={(event) => setPort(event.target.value)}
								/>
								<Button
									disabled={!canConnect || busy}
									onClick={() => {
										const parsed = Number(port);
										if (
											!/^\d+$/.test(port) ||
											!Number.isInteger(parsed) ||
											parsed < 1 ||
											parsed > 65535
										) {
											setInvalidPort(true);
											return;
										}
										setInvalidPort(false);
										setPaused(false);
										save({
											workspace_id: workspace.id,
											agent_name: agent.name,
											automatic: true,
											ports: [...new Set([...(selected?.ports ?? []), parsed])],
										});
									}}
								>
									{t("localConnect.add")}
								</Button>
							</div>
							{invalidPort && (
								<p role="alert">{t("localConnect.invalidPort")}</p>
							)}
							{mappings.length === 0 && <p>{t("localConnect.noPorts")}</p>}
							{mappings.map((mapping) => (
								<div
									key={mapping.remote_port}
									className="rounded border border-border p-2"
								>
									<p>
										{mapping.remote_port} → {mapping.local_port}
									</p>
									{mapping.error_code && (
										<p role="alert">
											{mapping.error_code === "capacity"
												? t("localConnect.capacity")
												: t("localConnect.unavailable")}
										</p>
									)}
									{mapping.local_port > 0 &&
										mapping.local_port !== mapping.remote_port && (
											<p>{t("localConnect.conflict")}</p>
										)}
									{device.online &&
										canConnect &&
										selected &&
										(!mapping.error_code ||
											mapping.error_code === "capacity") &&
										["http", "https"].includes(mapping.protocol) &&
										mapping.local_port > 0 && (
											<a
												href={`${mapping.protocol}://localhost:${mapping.local_port}/`}
												target="_blank"
												rel="noreferrer"
											>
												{t("localConnect.open")}{" "}
												{t("localConnect.localURL", {
													protocol: mapping.protocol,
													port: mapping.local_port,
												})}
											</a>
										)}
								</div>
							))}
						</>
					)}
					<Button
						variant="outline"
						disabled={!canConnect || enroll.isPending}
						onClick={() => enroll.mutate()}
					>
						{t("localConnect.setup")}
					</Button>
					{enroll.data && (
						<>
							<p>{t("localConnect.install")}</p>
							<p>{t("localConnect.unix")}</p>
							{release.isError && (
								<p role="alert">{t("localConnect.downloadError")}</p>
							)}
							{release.data?.artifacts.map((artifact) => (
								<div key={artifact.name}>
									<a
										href={`/api/v2/local-connect/download/${encodeURIComponent(artifact.name)}`}
									>
										{artifact.os} {artifact.arch}
									</a>
									<details>
										<summary>{t("localConnect.checksum")}</summary>
										<code className="break-all">{artifact.sha256}</code>
									</details>
								</div>
							))}
							<p>{t("localConnect.address")}</p>
							<CodeExample code={location.origin} />
							<p>{t("localConnect.enrollment")}</p>
							<CodeExample code={enroll.data.enrollment_id} />
							<p>{t("localConnect.token")}</p>
							<CodeExample code={enroll.data.token} />
							{enrollment.data?.status === "complete" && (
								<>
									<p role="status">{t("localConnect.complete")}</p>
									<Button
										disabled={!enrolledDevice}
										onClick={() => {
											if (enrolledDevice) selectDevice(enrolledDevice.id);
										}}
									>
										{t("localConnect.selectEnrolled")}
									</Button>
								</>
							)}
							{enrollment.error && <ErrorAlert error={enrollment.error} />}
							{enrollment.data?.status === "expired" && (
								<p role="alert">{t("localConnect.expired")}</p>
							)}
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
