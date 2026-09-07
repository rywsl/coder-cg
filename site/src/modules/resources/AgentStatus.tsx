import { cn } from "cn";
import { TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	WorkspaceAgent,
	WorkspaceAgentDevcontainer,
} from "#/api/typesGenerated";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverText,
	HelpPopoverTitle,
	HelpPopoverTrigger,
} from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import {
	agentConnectionMessages,
	agentScriptMessages,
} from "../workspaces/health";

const statusDotBaseClassName = "size-1.5 shrink-0 rounded-full";
const statusDotConnectedClassName =
	"bg-content-success shadow-[0_0_12px_0] shadow-content-success";
const statusDotDisconnectedClassName = "bg-content-secondary";
const statusDotConnectingClassName =
	"bg-content-link animate-pulse [animation-delay:0.5s]";

// If we think in the agent status and lifecycle into a single enum/state I'd
// say we would have: connecting, timeout, disconnected, connected:created,
// connected:starting, connected:start_timeout, connected:start_error,
// connected:ready, connected:shutting_down, connected:shutdown_timeout,
// connected:shutdown_error, connected:off.

interface AgentWarningTooltipProps {
	ariaLabel: string;
	title: string;
	detail: string;
	troubleshootingURL?: string;
	variant?: "warning" | "error";
}

/**
 * Shared tooltip for agent warning/error states. Renders an alert
 * icon with a help tooltip showing the title, detail, and an
 * optional troubleshooting link.
 */
const AgentWarningTooltip: FC<AgentWarningTooltipProps> = ({
	ariaLabel,
	title,
	detail,
	troubleshootingURL,
	variant = "warning",
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<HelpPopover>
			<HelpPopoverTrigger asChild role="status" aria-label={ariaLabel}>
				<TriangleAlertIcon
					className={cn(
						"relative size-3.5",
						variant === "warning"
							? "text-content-warning"
							: "text-content-destructive",
					)}
				/>
			</HelpPopoverTrigger>
			<HelpPopoverContent>
				<HelpPopoverTitle>{title}</HelpPopoverTitle>
				<HelpPopoverText>
					{detail}
					{troubleshootingURL && (
						<>
							{" "}
							<Link
								target="_blank"
								rel="noreferrer"
								href={troubleshootingURL}
								className="p-0 mt-2"
								showExternalIcon={false}
							>
								{tI18n("resources.AgentStatus.troubleshoot_29f172d0")}
							</Link>
						</>
					)}
				</HelpPopoverText>
			</HelpPopoverContent>
		</HelpPopover>
	);
};

const ReadyLifecycle: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<div
			role="status"
			data-testid="agent-status-ready"
			aria-label={tI18n("resources.AgentStatus.ready_5fa7aac5")}
			className={cn(statusDotBaseClassName, statusDotConnectedClassName)}
		/>
	);
};

const StartingLifecycle: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					role="status"
					aria-label={tI18n("resources.AgentStatus.starting_82b93630")}
					className={cn(statusDotBaseClassName, statusDotConnectingClassName)}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{tI18n("resources.AgentStatus.starting_82b93630")}
			</TooltipContent>
		</Tooltip>
	);
};

interface AgentStatusProps {
	agent: WorkspaceAgent;
}

interface SubAgentStatusProps {
	agent?: WorkspaceAgent;
}

interface DevcontainerStatusProps {
	devcontainer: WorkspaceAgentDevcontainer;
	parentAgent: WorkspaceAgent;
	agent?: WorkspaceAgent;
}

const ShuttingDownLifecycle: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					role="status"
					aria-label={tI18n("resources.AgentStatus.stopping_6f68db10")}
					className={cn(statusDotBaseClassName, statusDotConnectingClassName)}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{tI18n("resources.AgentStatus.stopping_6f68db10")}
			</TooltipContent>
		</Tooltip>
	);
};

const ShutdownTimeoutLifecycle: FC<AgentStatusProps> = ({ agent }) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<AgentWarningTooltip
			ariaLabel={tI18n(
				"resources.AgentStatus.shutdown_script_timeout_8d818e9d",
			)}
			title={agentScriptMessages.shutdown_timeout.title}
			detail={agentScriptMessages.shutdown_timeout.detail}
			troubleshootingURL={agent.troubleshooting_url}
		/>
	);
};

const ShutdownErrorLifecycle: FC<AgentStatusProps> = ({ agent }) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<AgentWarningTooltip
			ariaLabel={tI18n("resources.AgentStatus.shutdown_script_failed_7ab20100")}
			title={agentScriptMessages.shutdown_error.title}
			detail={agentScriptMessages.shutdown_error.detail}
			troubleshootingURL={agent.troubleshooting_url}
			variant="warning"
		/>
	);
};

const OffLifecycle: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					role="status"
					aria-label={tI18n("resources.AgentStatus.stopped_1a4f630a")}
					className={cn(statusDotBaseClassName, statusDotDisconnectedClassName)}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{tI18n("resources.AgentStatus.stopped_1a4f630a")}
			</TooltipContent>
		</Tooltip>
	);
};

const ConnectedStatus: FC<AgentStatusProps> = ({ agent }) => {
	// This is to support legacy agents that do not support
	// reporting the lifecycle_state field.
	if (agent.scripts.length === 0) {
		return <ReadyLifecycle />;
	}
	if (agent.lifecycle_state === "ready") {
		return <ReadyLifecycle />;
	}
	// Script errors and timeouts do not affect agent connectivity.
	// These states are surfaced in the per-script log tabs instead.
	if (
		agent.lifecycle_state === "start_timeout" ||
		agent.lifecycle_state === "start_error"
	) {
		return <ReadyLifecycle />;
	}
	if (agent.lifecycle_state === "shutting_down") {
		return <ShuttingDownLifecycle />;
	}
	if (agent.lifecycle_state === "shutdown_timeout") {
		return <ShutdownTimeoutLifecycle agent={agent} />;
	}
	if (agent.lifecycle_state === "shutdown_error") {
		return <ShutdownErrorLifecycle agent={agent} />;
	}
	if (agent.lifecycle_state === "off") {
		return <OffLifecycle />;
	}
	return <StartingLifecycle />;
};

const DisconnectedStatus: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					role="status"
					aria-label={tI18n("resources.AgentStatus.disconnected_04dfac36")}
					className={cn(statusDotBaseClassName, statusDotDisconnectedClassName)}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{tI18n("resources.AgentStatus.disconnected_04dfac36")}
			</TooltipContent>
		</Tooltip>
	);
};

const ConnectingStatus: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					role="status"
					aria-label={tI18n("resources.AgentStatus.connecting_5f04ae9e")}
					className={cn(statusDotBaseClassName, statusDotConnectingClassName)}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{tI18n("resources.AgentStatus.connecting_5f04ae9e")}
			</TooltipContent>
		</Tooltip>
	);
};

const TimeoutStatus: FC<AgentStatusProps> = ({ agent }) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<AgentWarningTooltip
			ariaLabel={tI18n("resources.AgentStatus.timeout_70594d93")}
			title={agentConnectionMessages.timeout.title}
			detail={agentConnectionMessages.timeout.detail}
			troubleshootingURL={agent.troubleshooting_url}
		/>
	);
};

export const AgentStatus: FC<AgentStatusProps> = ({ agent }) => {
	if (agent.status === "connected") {
		return <ConnectedStatus agent={agent} />;
	}
	if (agent.status === "disconnected") {
		return <DisconnectedStatus />;
	}
	if (agent.status === "timeout") {
		return <TimeoutStatus agent={agent} />;
	}
	return <ConnectingStatus />;
};

const SubAgentStatus: FC<SubAgentStatusProps> = ({ agent }) => {
	if (!agent) {
		return <DisconnectedStatus />;
	}
	if (agent.status === "connected") {
		return <ConnectedStatus agent={agent} />;
	}
	if (agent.status === "disconnected") {
		return <DisconnectedStatus />;
	}
	if (agent.status === "timeout") {
		return <TimeoutStatus agent={agent} />;
	}
	return <ConnectingStatus />;
};

const DevcontainerStartError: FC<AgentStatusProps> = ({ agent }) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<AgentWarningTooltip
			ariaLabel={tI18n("resources.AgentStatus.start_error_43f6ce77")}
			title={tI18n(
				"resources.AgentStatus.error_starting_the_devcontainer_agent_f439470d",
			)}
			detail={tI18n(
				"resources.AgentStatus.something_went_wrong_during_the_devcontainer_age_42eeca80",
			)}
			troubleshootingURL={agent.troubleshooting_url}
			variant="error"
		/>
	);
};

export const DevcontainerStatus: FC<DevcontainerStatusProps> = ({
	devcontainer,
	parentAgent,
	agent,
}) => {
	if (devcontainer.error) {
		// When a dev container has an 'error' associated with it,
		// then we won't have an agent associated with it. This is
		// why we use the parent agent instead of the sub agent.
		return <DevcontainerStartError agent={parentAgent} />;
	}

	return <SubAgentStatus agent={agent} />;
};
