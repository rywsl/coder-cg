import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	createWorkspacePublicPortMapping,
	deleteWorkspacePublicPortMapping,
	workspacePublicPortMappings,
} from "#/api/queries/workspaceportsharing";
import { agentListeningPorts } from "#/api/queries/workspaces";
import type { Workspace, WorkspaceAgent } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";

export function PublicAccess({
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
	const [port, setPort] = useState("");
	const [protocol, setProtocol] = useState<"http" | "https">("http");
	const [consent, setConsent] = useState(false);
	const portID = useId();
	const consentID = useId();
	const queryClient = useQueryClient();
	const mappingQuery = workspacePublicPortMappings(workspace.id);
	const mappings = useQuery({
		...mappingQuery,
		enabled: open,
		refetchInterval: open ? 5000 : false,
	});
	const ready =
		agent.status === "connected" &&
		agent.lifecycle_state === "ready" &&
		agent.operating_system === "linux" &&
		!browserOnly;
	const ports = useQuery({
		...agentListeningPorts(agent.id),
		enabled: open && ready,
		refetchInterval: open && ready ? 5000 : false,
	});
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: mappingQuery.queryKey });
	const create = useMutation({
		...createWorkspacePublicPortMapping(workspace.id),
		onSettled: invalidate,
		onSuccess: () => setConsent(false),
	});
	const remove = useMutation({
		...deleteWorkspacePublicPortMapping(workspace.id),
		onSettled: invalidate,
	});
	const busy = create.isPending || remove.isPending;
	const selectedPort = Number(port);
	const validPort =
		Number.isInteger(selectedPort) &&
		selectedPort >= 1 &&
		selectedPort <= 65535;
	const shares =
		mappings.data?.mappings.filter(
			(mapping) => mapping.agent_name === agent.name,
		) ?? [];
	const error = mappings.error || ports.error || create.error || remove.error;

	return (
		<>
			<Button size="sm" variant="subtle" onClick={() => setOpen(true)}>
				{t("publicPorts.title")}
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("publicPorts.title")}</DialogTitle>
						<DialogDescription>
							{t("publicPorts.description")}
						</DialogDescription>
					</DialogHeader>
					{error && <ErrorAlert error={error} />}
					{mappings.isLoading && (
						<div role="status">
							<Spinner />
							{t("publicPorts.loading")}
						</div>
					)}
					{mappings.isError && (
						<Button variant="outline" onClick={() => mappings.refetch()}>
							{t("publicPorts.retry")}
						</Button>
					)}
					{mappings.data && (
						<>
							{!mappings.data.enabled && <p>{t("publicPorts.disabled")}</p>}
							{!ready && (
								<p>
									{browserOnly
										? t("publicPorts.browserOnly")
										: t("publicPorts.offline")}
								</p>
							)}
							{shares.length === 0 ? (
								<p>{t("publicPorts.empty")}</p>
							) : (
								<ul className="list-none p-0 space-y-4">
									{shares.map((mapping) => (
										<li
											key={mapping.id}
											className="rounded border border-border p-3 space-y-2"
										>
											<div>
												{mapping.agent_name}:{mapping.remote_port} ·{" "}
												{t(`publicPorts.states.${mapping.state}`, {
													defaultValue: t("publicPorts.states.unavailable"),
												})}
											</div>
											<a
												className="text-content-link"
												href={mapping.url}
												target="_blank"
												rel="noreferrer"
											>
												{mapping.url}
											</a>
											<div className="flex gap-2">
												<CopyButton
													text={mapping.url}
													label={t("publicPorts.copy")}
												/>
												<Button
													size="sm"
													variant="outline"
													disabled={busy}
													onClick={() => remove.mutate(mapping.id)}
												>
													{t("publicPorts.remove", {
														port: mapping.remote_port,
													})}
												</Button>
											</div>
										</li>
									))}
								</ul>
							)}
							{mappings.data.enabled && (
								<form
									className="space-y-3"
									onSubmit={(event) => {
										event.preventDefault();
										if (!validPort || !consent || !ready || busy) return;
										create.mutate({
											agent_name: agent.name,
											remote_port: selectedPort,
											protocol,
											share_level: "public",
										});
									}}
								>
									<Label htmlFor={portID}>{t("publicPorts.port")}</Label>
									<Input
										id={portID}
										type="number"
										min={1}
										max={65535}
										required
										value={port}
										disabled={!ready || busy}
										onChange={(event) => setPort(event.target.value)}
									/>
									<p className="text-xs text-content-secondary">
										{t("publicPorts.detected", {
											ports:
												ports.data?.ports.map((p) => p.port).join(", ") ||
												t("publicPorts.none"),
										})}
									</p>
									<Select
										value={protocol}
										onValueChange={(value) => {
											if (value === "http" || value === "https")
												setProtocol(value);
										}}
										disabled={!ready || busy}
									>
										<SelectTrigger aria-label={t("publicPorts.protocol")}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="http">HTTP</SelectItem>
											<SelectItem value="https">HTTPS</SelectItem>
										</SelectContent>
									</Select>
									<div className="flex items-center gap-2">
										<Checkbox
											id={consentID}
											checked={consent}
											disabled={!ready || busy}
											onCheckedChange={(value) => setConsent(value === true)}
										/>
										<Label htmlFor={consentID}>
											{t("publicPorts.consent")}
										</Label>
									</div>
									<Button
										type="submit"
										disabled={!ready || !validPort || !consent || busy}
									>
										<Spinner loading={create.isPending} />
										{t("publicPorts.publish")}
									</Button>
								</form>
							)}
							<p className="text-xs text-content-secondary">
								{t("publicPorts.certificate")}
							</p>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
