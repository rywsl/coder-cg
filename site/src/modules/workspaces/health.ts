import type { WorkspaceAgent } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

/**
 * Canonical messages for startup and shutdown script issues.
 * Used by the per-agent-row tooltips in AgentStatus; the
 * start-related entries are also shared with per-agent health
 * classification in getAgentScriptIssues.
 */
export const agentScriptMessages = {
	start_error: {
		title: i18n.t(
			"workspaces:workspaces.health.startup_script_failed_e21378a6",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.a_startup_script_exited_with_an_error_check_the__ea3b30c2",
		),
	},
	start_timeout: {
		title: i18n.t(
			"workspaces:workspaces.health.startup_script_is_taking_longer_than_expected_60a26e90",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.a_startup_script_has_exceeded_the_expected_time__68b6212b",
		),
	},
	shutdown_error: {
		title: i18n.t(
			"workspaces:workspaces.health.shutdown_script_failed_7ab20100",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.a_shutdown_script_exited_with_an_error_check_the_c058bbb5",
		),
	},
	shutdown_timeout: {
		title: i18n.t(
			"workspaces:workspaces.health.shutdown_script_is_taking_longer_than_expected_244d247e",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.a_shutdown_script_has_exceeded_the_expected_time_1ec0de74",
		),
	},
} as const;

/**
 * Canonical messages for agent connection issues (the agent
 * process connecting to the Coder control plane).
 */
export const agentConnectionMessages = {
	connecting: {
		title: i18n.t(
			"workspaces:workspaces.health.workspace_agent_is_connecting_fd9c7084",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.the_workspace_agent_has_not_connected_yet_wait_f_dd2878f5",
		),
	},
	timeout: {
		title: i18n.t(
			"workspaces:workspaces.health.agent_is_taking_longer_than_expected_to_connect_4bf35e2d",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.continue_to_wait_and_check_the_log_output_for_er_6a0a605b",
		),
	},
	disconnected: {
		title: i18n.t(
			"workspaces:workspaces.health.workspace_agent_has_disconnected_6e158a18",
		),
		detail: i18n.t(
			"workspaces:workspaces.health.check_the_log_output_for_errors_if_agents_do_not_df36abf7",
		),
	},
} as const;

interface AgentHealthIssue {
	title: string;
	detail: string;
	severity: "info" | "warning";
	// Whether the alert should be visually prominent. Usually true for
	// warnings, but connection timeout and startup timeout are
	// exceptions (warning severity without prominent styling).
	prominent: boolean;
}

/**
 * Classifies connectivity-related health issues for an individual agent.
 * These issues affect the agent panel border color and warning visibility.
 * Script failures are excluded from this function to prevent them from
 * incorrectly suggesting agent connectivity problems.
 */
export function getAgentConnectivityIssues(
	agent: WorkspaceAgent,
): AgentHealthIssue[] {
	const issues: AgentHealthIssue[] = [];

	if (agent.status === "disconnected") {
		issues.push({
			title: agentConnectionMessages.disconnected.title,
			detail: agentConnectionMessages.disconnected.detail,
			severity: "warning",
			prominent: false,
		});
	}

	if (agent.status === "timeout") {
		issues.push({
			title: agentConnectionMessages.timeout.title,
			detail: agentConnectionMessages.timeout.detail,
			severity: "warning",
			prominent: false,
		});
	}

	// Shutdown lifecycle states are treated as connectivity concerns rather than
	// script concerns because the workspace is actively becoming unavailable;
	// unlike startup script failures, the agent is no longer reachable once
	// shutdown begins.
	if (
		agent.lifecycle_state === "shutting_down" ||
		agent.lifecycle_state === "shutdown_error" ||
		agent.lifecycle_state === "shutdown_timeout"
	) {
		issues.push({
			title: i18n.t(
				"workspaces:workspaces.health.workspace_agent_is_shutting_down_c0beef22",
			),
			detail: i18n.t(
				"workspaces:workspaces.health.the_workspace_is_not_available_while_agents_shut_fe596802",
			),
			severity: "info",
			prominent: false,
		});
	}

	if (agent.status === "connecting") {
		issues.push({
			title: agentConnectionMessages.connecting.title,
			detail: agentConnectionMessages.connecting.detail,
			severity: "info",
			prominent: false,
		});
	}

	return issues;
}

/**
 * Classifies script-related health issues for an individual agent.
 * These issues are shown only in the script tabs, not in the agent panel header.
 */
export function getAgentScriptIssues(
	agent: WorkspaceAgent,
): AgentHealthIssue[] {
	const issues: AgentHealthIssue[] = [];

	// Check for script failures directly from the scripts array.
	for (const script of agent.scripts) {
		switch (script.status) {
			case "timed_out":
				issues.push({
					title: i18n.t(
						"workspaces:workspaces.health.value0_is_taking_longer_than_expected_d3723604",
						{
							value0: script.display_name,
						},
					),
					detail: i18n.t(
						"workspaces:workspaces.health.value0_has_exceeded_the_expected_time_check_the__eb095b63",
						{
							value0: script.display_name,
						},
					),
					severity: "warning",
					prominent: false,
				});
				break;
			case "exit_failure":
				if (script.exit_code) {
					issues.push({
						title: i18n.t(
							"workspaces:workspaces.health.value0_failed_eca3057d",
							{
								value0: script.display_name,
							},
						),
						detail: i18n.t(
							"workspaces:workspaces.health.value0_exited_with_value1_check_the_agent_logs_f_e2e3ea20",
							{
								value0: script.display_name,
								value1: script.exit_code,
							},
						),
						severity: "warning",
						prominent: false,
					});
				} else {
					issues.push({
						title: i18n.t(
							"workspaces:workspaces.health.value0_failed_eca3057d",
							{
								value0: script.display_name,
							},
						),
						detail: i18n.t(
							"workspaces:workspaces.health.value0_has_exited_with_an_error_check_the_agent__10648efc",
							{
								value0: script.display_name,
							},
						),
						severity: "warning",
						prominent: false,
					});
				}
				break;
			case "pipes_left_open":
				issues.push({
					title: i18n.t(
						"workspaces:workspaces.health.value0_left_pipes_open_4b31b1c2",
						{
							value0: script.display_name,
						},
					),
					detail: i18n.t(
						"workspaces:workspaces.health.check_the_agent_logs_for_details_516741c0",
					),
					severity: "warning",
					prominent: false,
				});
				break;
		}
	}

	return issues;
}

/**
 * Classifies all health issues for an individual agent, combining both
 * connectivity and script issues.
 */
export function getAgentHealthIssues(
	agent: WorkspaceAgent,
): AgentHealthIssue[] {
	return [...getAgentConnectivityIssues(agent), ...getAgentScriptIssues(agent)];
}
