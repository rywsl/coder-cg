import {
	ChevronDownIcon,
	ExternalLinkIcon,
	LaptopIcon,
	MessageSquareCodeIcon,
	Trash2Icon,
} from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage, isApiError } from "#/api/errors";
import { deploymentSSHConfig } from "#/api/queries/deployment";
import {
	createWorkspaceSSHBootstrap,
	deleteWorkspaceSSHKey,
	workspaceSSHEnrollmentStatus,
	workspaceSSHKeys,
	workspaceSSHKeysQueryKey,
} from "#/api/queries/workspaceSSH";
import type {
	Workspace,
	WorkspaceAgent,
	WorkspaceSSHBootstrapResponse,
} from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#/components/Tabs/Tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useAuthenticated } from "#/hooks/useAuthenticated";

const CHATGPT_DESKTOP_DOWNLOAD_URL = "https://openai.com/chatgpt/desktop/";
const CHATGPT_CONNECTIONS_DEEP_LINK = "codex://settings/connections";
const CHATGPT_DEVICE_CHANGE_EVENT = "coder:chatgpt-desktop-device-change";

export const chatGPTDesktopDeviceStorageKey = (
	workspace: Workspace,
	agentName: string,
) =>
	`chatgptDesktop.sshKey.v2.${workspace.id}.${workspace.owner_name}.${workspace.name}.${agentName}`;

interface ChatGPTDesktopButtonProps {
	agent: WorkspaceAgent;
	workspace: Workspace;
	browserOnly: boolean;
	deepLinkFallbackDelayMs?: number;
	enrollmentPollIntervalMs?: number;
	now?: () => number;
	openDeepLink?: (deepLink: string) => void;
}

const defaultOpenDeepLink = (deepLink: string) => {
	location.href = deepLink;
};

export const chatGPTDesktopDeepLink = (
	alias: string,
	projectPath: string,
): string =>
	`codex://settings/connections/ssh/add?name=${encodeURIComponent(alias)}&projectPath=${encodeURIComponent(projectPath)}&enabled=true`;

export const ChatGPTDesktopButton: FC<ChatGPTDesktopButtonProps> = ({
	agent,
	workspace,
	browserOnly,
	deepLinkFallbackDelayMs = 1800,
	enrollmentPollIntervalMs = 2_000,
	now = Date.now,
	openDeepLink = defaultOpenDeepLink,
}) => {
	const { t: tI18n } = useTranslation("workspaces");
	const queryClient = useQueryClient();
	const { permissions } = useAuthenticated();
	const [setupOpen, setSetupOpen] = useState(false);
	const [setupPending, setSetupPending] = useState(false);
	const [fallbackOpen, setFallbackOpen] = useState(false);
	const deviceStorageKey = chatGPTDesktopDeviceStorageKey(
		workspace,
		agent.name,
	);
	const [configuredKeyID, setConfiguredKeyID] = useState(() =>
		localStorage.getItem(deviceStorageKey),
	);
	const [enrollmentID, setEnrollmentID] = useState("");
	const setupExpiryTimer = useRef<number>(undefined);
	const fallbackTimer = useRef<number>(undefined);
	const deploymentSSHQuery = useQuery(deploymentSSHConfig());
	const gateway = deploymentSSHQuery.data?.workspace_ssh_gateway;
	const gatewayAvailable = Boolean(
		gateway?.enabled && gateway.chatgpt_desktop_available,
	);
	const keysQuery = useQuery({
		...workspaceSSHKeys(
			workspace.organization_name,
			deploymentSSHQuery.isSuccess,
		),
	});
	const enrollmentQuery = useQuery(
		workspaceSSHEnrollmentStatus(
			enrollmentID,
			setupPending && enrollmentID !== "",
			enrollmentPollIntervalMs,
		),
	);
	const bootstrapMutation = useMutation({
		...createWorkspaceSSHBootstrap(agent.id),
		onSuccess: (bootstrap) => {
			window.clearTimeout(setupExpiryTimer.current);
			setEnrollmentID(bootstrap.enrollment_id);
			setSetupPending(true);
			setupExpiryTimer.current = window.setTimeout(
				() => setSetupPending(false),
				Math.max(0, new Date(bootstrap.expires_at).getTime() - now()),
			);
		},
	});
	const deleteKeyMutation = useMutation(
		deleteWorkspaceSSHKey(queryClient, workspace.organization_name),
	);
	const keys = keysQuery.data ?? [];
	const deviceConfigured = keys.some((key) => key.id === configuredKeyID);

	useEffect(() => {
		const syncConfiguredKey = () => {
			setConfiguredKeyID(localStorage.getItem(deviceStorageKey));
		};
		syncConfiguredKey();
		window.addEventListener(CHATGPT_DEVICE_CHANGE_EVENT, syncConfiguredKey);
		return () => {
			window.removeEventListener(
				CHATGPT_DEVICE_CHANGE_EVENT,
				syncConfiguredKey,
			);
			window.clearTimeout(setupExpiryTimer.current);
			window.clearTimeout(fallbackTimer.current);
		};
	}, [deviceStorageKey]);

	useEffect(() => {
		if (!setupPending || !enrollmentQuery.data) {
			return;
		}
		if (enrollmentQuery.data.status === "expired") {
			setSetupPending(false);
			window.clearTimeout(setupExpiryTimer.current);
			return;
		}
		const enrolledKeyID = enrollmentQuery.data.workspace_ssh_key_id;
		if (enrollmentQuery.data.status !== "complete" || !enrolledKeyID) {
			return;
		}
		localStorage.setItem(deviceStorageKey, enrolledKeyID);
		setConfiguredKeyID(enrolledKeyID);
		setSetupPending(false);
		window.clearTimeout(setupExpiryTimer.current);
		window.dispatchEvent(new Event(CHATGPT_DEVICE_CHANGE_EVENT));
		void queryClient.invalidateQueries({
			queryKey: workspaceSSHKeysQueryKey(workspace.organization_name),
		});
	}, [
		deviceStorageKey,
		enrollmentQuery.data,
		queryClient,
		setupPending,
		workspace.organization_name,
	]);

	const alias = gateway
		? `${agent.name}.${workspace.name}.${workspace.owner_name}.${gateway.alias_suffix}`
		: "";
	const projectPath = agent.expanded_directory ?? "";
	const deepLink = chatGPTDesktopDeepLink(alias, projectPath);
	const agentUnavailable =
		workspace.latest_build.status !== "running" ||
		agent.status !== "connected" ||
		agent.lifecycle_state !== "ready" ||
		agent.operating_system.toLowerCase() !== "linux" ||
		projectPath === "";
	const isLoading = deploymentSSHQuery.isLoading || keysQuery.isLoading;
	const error = deploymentSSHQuery.error ?? keysQuery.error;
	const setupDisabled =
		isLoading ||
		Boolean(error) ||
		!gatewayAvailable ||
		agentUnavailable ||
		browserOnly;
	const managementDisabled = isLoading || Boolean(error);

	const beginSetup = () => {
		if (setupDisabled) {
			return;
		}
		setEnrollmentID("");
		setSetupPending(false);
		setSetupOpen(true);
		bootstrapMutation.reset();
		bootstrapMutation.mutate();
	};

	const launch = () => {
		if (setupDisabled) {
			return;
		}
		if (!deviceConfigured) {
			beginSetup();
			return;
		}
		setFallbackOpen(false);
		window.clearTimeout(fallbackTimer.current);
		openDeepLink(deepLink);
		fallbackTimer.current = window.setTimeout(() => {
			if (document.visibilityState === "visible") {
				setFallbackOpen(true);
			}
		}, deepLinkFallbackDelayMs);
	};

	const connectionUnavailableMessage = tI18n(
		"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.chatgpt_desktop_connection_is_unavailable_658f94d5",
	);
	const unavailableMessage = error
		? isApiError(error)
			? getErrorMessage(error, connectionUnavailableMessage)
			: connectionUnavailableMessage
		: !gatewayAvailable && !isLoading
			? tI18n(
					"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.gateway_not_enabled",
				)
			: browserOnly
				? tI18n(
						"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.browser_only_disables_chatgpt_desktop_connections_22b66fd7",
					)
				: agentUnavailable
					? tI18n(
							"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.chatgpt_desktop_requires_a_running_ready_linux_a_3b60630f",
						)
					: tI18n(
							"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.loading_chatgpt_desktop_connection_8f33f012",
						);

	return (
		<>
			<div className="inline-flex items-center">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span>
								<Button
									variant="subtle"
									size="sm"
									aria-disabled={setupDisabled}
									onClick={launch}
									className="rounded-r-none aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled"
								>
									{isLoading ? (
										<Spinner loading size="sm" aria-hidden />
									) : (
										<MessageSquareCodeIcon />
									)}
									{tI18n(
										"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.open_in_chatgpt_c27a47a5",
									)}
								</Button>
							</span>
						</TooltipTrigger>
						{setupDisabled && (
							<TooltipContent>{unavailableMessage}</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="subtle"
							size="icon"
							disabled={managementDisabled}
							className="rounded-l-none border-l border-y-0 border-r-0 border-solid border-border-default"
							aria-label={tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.manage_chatgpt_desktop_connection_bebd01cc",
							)}
						>
							<ChevronDownIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-64">
						{permissions.editDeploymentConfig && (
							<DropdownMenuItem asChild>
								<Link to="/deployment/network">
									<ExternalLinkIcon />
									{tI18n(
										"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.configure_gateway",
									)}
								</Link>
							</DropdownMenuItem>
						)}
						<DropdownMenuItem disabled={setupDisabled} onSelect={beginSetup}>
							<LaptopIcon />
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.set_up_this_device_8f199176",
							)}
						</DropdownMenuItem>
						{keys.length > 0 && <DropdownMenuSeparator />}
						{keys.map((key) => (
							<DropdownMenuItem
								key={key.id}
								disabled={deleteKeyMutation.isPending}
								onSelect={() => {
									deleteKeyMutation.mutate(key.id, {
										onSuccess: () => {
											if (configuredKeyID === key.id) {
												localStorage.removeItem(deviceStorageKey);
												setConfiguredKeyID(null);
												window.dispatchEvent(
													new Event(CHATGPT_DEVICE_CHANGE_EVENT),
												);
											}
											toast.success(
												tI18n(
													"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.revoked_value0_9dd5929e",
													{ value0: key.device_name },
												),
											);
										},
										onError: (deleteError) => {
											toast.error(
												tI18n(
													"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.failed_to_revoke_ssh_device_fec6a7e0",
												),
												{
													description: isApiError(deleteError)
														? getErrorDetail(deleteError)
														: undefined,
												},
											);
										},
									});
								}}
							>
								<Trash2Icon />
								{tI18n(
									"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.revoke_8da69e19",
								)}
								{key.device_name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<SetupDialog
				open={setupOpen}
				onOpenChange={setSetupOpen}
				bootstrap={bootstrapMutation.data}
				loading={bootstrapMutation.isPending}
				error={bootstrapMutation.error}
				onRetry={() => bootstrapMutation.mutate()}
			/>
			<FallbackDialog
				open={fallbackOpen}
				onOpenChange={setFallbackOpen}
				alias={alias}
				projectPath={projectPath}
			/>
		</>
	);
};

interface SetupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bootstrap?: WorkspaceSSHBootstrapResponse;
	loading: boolean;
	error: unknown;
	onRetry: () => void;
}

const SetupDialog: FC<SetupDialogProps> = ({
	open,
	onOpenChange,
	bootstrap,
	loading,
	error,
	onRetry,
}) => {
	const { t: tI18n } = useTranslation("workspaces");
	const setupErrorMessage = tI18n(
		"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.could_not_create_the_setup_command_40adc2d2",
	);
	const errorDetail = isApiError(error) ? getErrorDetail(error) : undefined;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{tI18n(
							"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.set_up_chatgpt_desktop_b99efbff",
						)}
					</DialogTitle>
					<DialogDescription>
						{tI18n(
							"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.run_one_command_on_this_device_it_creates_a_dedi_b0c36ca4",
						)}
					</DialogDescription>
				</DialogHeader>
				{loading && (
					<div
						className="flex min-h-28 items-center justify-center"
						role="status"
					>
						<Spinner
							loading
							label={tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.creating_setup_command_694feed1",
							)}
						/>
					</div>
				)}
				{Boolean(error) && (
					<Alert severity="error" prominent>
						<AlertTitle>
							{isApiError(error)
								? getErrorMessage(error, setupErrorMessage)
								: setupErrorMessage}
						</AlertTitle>
						{errorDetail && <AlertDescription>{errorDetail}</AlertDescription>}
					</Alert>
				)}
				{bootstrap && (
					<Tabs defaultValue="bash">
						<TabsList
							aria-label={tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.operating_system_0fcabfe6",
							)}
						>
							<TabsTrigger value="bash">
								{tI18n(
									"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.macos_or_linux_ceb9e091",
								)}
							</TabsTrigger>
							<TabsTrigger value="powershell">Windows</TabsTrigger>
						</TabsList>
						<TabsContent value="bash" className="pt-4">
							<CodeExample secret={false} code={bootstrap.bash_command} />
						</TabsContent>
						<TabsContent value="powershell" className="pt-4">
							<CodeExample secret={false} code={bootstrap.powershell_command} />
						</TabsContent>
					</Tabs>
				)}
				<DialogFooter>
					{error ? (
						<Button onClick={onRetry}>
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.retry_942087cc",
							)}
						</Button>
					) : (
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.close_7d9eb7ac",
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

interface FallbackDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	alias: string;
	projectPath: string;
}

const FallbackDialog: FC<FallbackDialogProps> = ({
	open,
	onOpenChange,
	alias,
	projectPath,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{tI18n(
							"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.chatgpt_desktop_did_not_open_28b8157a",
						)}
					</DialogTitle>
					<DialogDescription>
						{tI18n(
							"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.install_or_update_chatgpt_desktop_then_add_the_s_1d6a3376",
						)}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div>
						<div className="mb-1 text-xs font-medium text-content-secondary">
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.ssh_alias_0228bb76",
							)}
						</div>
						<CodeExample secret={false} code={alias} />
					</div>
					<div>
						<div className="mb-1 text-xs font-medium text-content-secondary">
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.project_path_080c6857",
							)}
						</div>
						<CodeExample secret={false} code={projectPath} />
					</div>
				</div>
				<DialogFooter className="gap-2">
					<Button variant="outline" asChild>
						<a
							href={CHATGPT_DESKTOP_DOWNLOAD_URL}
							target="_blank"
							rel="noreferrer"
						>
							<ExternalLinkIcon />
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.install_or_update_0c05bbb8",
							)}
						</a>
					</Button>
					<Button asChild>
						<a href={CHATGPT_CONNECTIONS_DEEP_LINK}>
							{tI18n(
								"resources.ChatGPTDesktopButton.ChatGPTDesktopButton.open_connections_e7e09d34",
							)}
						</a>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
