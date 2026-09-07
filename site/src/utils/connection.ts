import type { ConnectionType } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

export const connectionTypeToFriendlyName = (type: ConnectionType): string => {
	switch (type) {
		case "jetbrains":
			return "JetBrains";
		case "reconnecting_pty":
			return i18n.t("pages:connection.web_terminal_608c7d29");
		case "ssh":
			return "SSH";
		case "vscode":
			return "VS Code";
		case "port_forwarding":
			return i18n.t("pages:connection.port_forwarding_2f9a490c");
		case "workspace_app":
			return i18n.t("pages:connection.workspace_app_832757fe");
		case "tunnel":
			return i18n.t("pages:connection.tunnel_cf23f35d");
	}
};

// connectionTypeIsWeb returns true for connection types reported by
// coderd from an HTTP request. These carry `web_info` (user, IP, user
// agent, HTTP status code) rather than agent-reported `ssh_info`, and
// are not necessarily browser connections (tunnels are typically
// established by the CLI or an IDE extension).
export const connectionTypeIsWeb = (type: ConnectionType): boolean => {
	switch (type) {
		case "port_forwarding":
		case "workspace_app":
		case "tunnel": {
			return true;
		}
		case "reconnecting_pty":
		case "ssh":
		case "jetbrains":
		case "vscode": {
			return false;
		}
	}
};
