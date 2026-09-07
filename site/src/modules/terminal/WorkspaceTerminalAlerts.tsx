import { cn } from "cn";
import { RefreshCwIcon } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceAgent } from "#/api/typesGenerated";
import {
	Alert,
	type AlertColor,
	type AlertProps,
} from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { Link } from "#/components/Link/Link";
import { docs } from "#/utils/docs";
import type { ConnectionStatus } from "./types";

type WorkspaceTerminalAlertsProps = {
	agent: WorkspaceAgent | undefined;
	status: ConnectionStatus;
	onAlertChange: () => void;
};

export const WorkspaceTerminalAlerts = ({
	agent,
	status,
	onAlertChange,
}: WorkspaceTerminalAlertsProps) => {
	const lifecycleState = agent?.lifecycle_state;
	const prevLifecycleState = useRef(lifecycleState);
	useEffect(() => {
		prevLifecycleState.current = lifecycleState;
	}, [lifecycleState]);

	// MutationObserver triggers onAlertChange after DOM updates so
	// the terminal can refit once alert height changes.
	const wrapperRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!wrapperRef.current) {
			return;
		}
		const observer = new MutationObserver(onAlertChange);
		observer.observe(wrapperRef.current, { childList: true });

		return () => {
			observer.disconnect();
		};
	}, [onAlertChange]);

	return (
		<div ref={wrapperRef}>
			{status === "disconnected" ? (
				<DisconnectedAlert />
			) : lifecycleState === "start_error" ? (
				<ErrorScriptAlert />
			) : lifecycleState === "starting" ? (
				<LoadingScriptsAlert />
			) : lifecycleState === "ready" &&
				prevLifecycleState.current === "starting" ? (
				<LoadedScriptsAlert />
			) : null}
		</div>
	);
};

const ErrorScriptAlert: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<TerminalAlert
			severity="warning"
			dismissible
			actions={<RefreshSessionButton />}
		>
			{tI18n("terminal.WorkspaceTerminalAlerts.the_workspace_ee8dc98c")}{" "}
			<Link
				title={tI18n(
					"terminal.WorkspaceTerminalAlerts.startup_script_has_exited_with_an_error_45b27cbe",
				)}
				href={docs(
					"/admin/templates/troubleshooting#startup-script-exited-with-an-error",
				)}
				target="_blank"
				rel="noreferrer"
				className="mx-0"
			>
				{tI18n(
					"terminal.WorkspaceTerminalAlerts.startup_script_has_exited_with_an_error_45b27cbe",
				)}
			</Link>
			{tI18n(
				"terminal.WorkspaceTerminalAlerts.we_recommend_reloading_this_session_and_243078c0",
			)}{" "}
			<Link
				title={tI18n(
					"terminal.WorkspaceTerminalAlerts.debugging_the_startup_script_c56ee7ca",
				)}
				href={docs("/admin/templates/troubleshooting#startup-script-issues")}
				target="_blank"
				rel="noreferrer"
			>
				{tI18n(
					"terminal.WorkspaceTerminalAlerts.debugging_the_startup_script_797895bf",
				)}
			</Link>{" "}
			{tI18n("terminal.WorkspaceTerminalAlerts.because_a511aeee")}{" "}
			<Link
				title={tI18n(
					"terminal.WorkspaceTerminalAlerts.your_workspace_may_be_incomplete_b00f06ec",
				)}
				href={docs(
					"/admin/templates/troubleshooting#your-workspace-may-be-incomplete",
				)}
				target="_blank"
				rel="noreferrer"
			>
				{tI18n(
					"terminal.WorkspaceTerminalAlerts.your_workspace_may_be_incomplete_b00f06ec",
				)}
			</Link>{" "}
		</TerminalAlert>
	);
};

const LoadingScriptsAlert: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<TerminalAlert
			dismissible
			severity="info"
			actions={<RefreshSessionButton />}
		>
			{tI18n(
				"terminal.WorkspaceTerminalAlerts.startup_scripts_are_still_running_you_can_contin_d92b7fd0",
			)}{" "}
			<Link
				title={tI18n(
					"terminal.WorkspaceTerminalAlerts.your_workspace_may_be_incomplete_b00f06ec",
				)}
				href={docs(
					"/admin/templates/troubleshooting#your-workspace-may-be-incomplete",
				)}
				target="_blank"
				rel="noreferrer"
			>
				{" "}
				{tI18n(
					"terminal.WorkspaceTerminalAlerts.your_workspace_may_be_incomplete_b00f06ec",
				)}
			</Link>
		</TerminalAlert>
	);
};

const LoadedScriptsAlert: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<TerminalAlert
			severity="success"
			dismissible
			actions={<RefreshSessionButton />}
		>
			{tI18n(
				"terminal.WorkspaceTerminalAlerts.startup_scripts_have_completed_successfully_the__47b00667",
			)}{" "}
			<Link
				title={tI18n(
					"terminal.WorkspaceTerminalAlerts.session_was_started_before_the_startup_scripts_f_d639fbbd",
				)}
				href={docs(
					"/admin/templates/troubleshooting#your-workspace-may-be-incomplete",
				)}
				target="_blank"
				rel="noreferrer"
			>
				{tI18n(
					"terminal.WorkspaceTerminalAlerts.session_was_started_before_the_startup_script_fi_2938fa8e",
				)}
			</Link>{" "}
			{tI18n(
				"terminal.WorkspaceTerminalAlerts.to_ensure_your_shell_environment_is_up_to_date_w_a2dda7e7",
			)}
		</TerminalAlert>
	);
};

const severityBorderColors: Record<AlertColor, string> = {
	info: "border-l-highlight-sky",
	success: "border-l-content-success",
	warning: "border-l-content-warning",
	error: "border-l-content-destructive",
};

const TerminalAlert: FC<AlertProps> = (props) => {
	const severity = props.severity ?? "info";
	return (
		<Alert
			{...props}
			className={cn(
				"rounded-none border-0 border-b border-l-[3px] border-b-border-default bg-surface-primary mb-px",
				severityBorderColors[severity],
			)}
		/>
	);
};

// Since the terminal connection is always trying to reconnect, we show this
// alert to indicate that the terminal is trying to connect.
const DisconnectedAlert: FC<AlertProps> = (props) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<TerminalAlert
			{...props}
			severity="info"
			actions={<RefreshSessionButton />}
		>
			{tI18n("terminal.WorkspaceTerminalAlerts.trying_to_connect_8aa585d3")}
		</TerminalAlert>
	);
};

const RefreshSessionButton: FC = () => {
	const { t: tI18n } = useTranslation("components");

	const [isRefreshing, setIsRefreshing] = useState(false);

	return (
		<Button
			disabled={isRefreshing}
			size="sm"
			onClick={() => {
				setIsRefreshing(true);
				location.reload();
			}}
		>
			<RefreshCwIcon className={cn(isRefreshing && "animate-spin")} />
			{isRefreshing
				? tI18n("terminal.WorkspaceTerminalAlerts.refreshing_session_8c713dac")
				: tI18n("terminal.WorkspaceTerminalAlerts.refresh_session_e019a4be")}
		</Button>
	);
};
