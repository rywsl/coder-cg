export const common = {
	localConnect: {
		localURL: "{{protocol}}://localhost:{{port}}",
		invalidTarget: "Invalid workspace or port",
		selectEnrolled: "Use the newly authorized device",
		title: "Local access",
		description:
			"Forward workspace services to this computer through the public SSH gateway without changing your project.",
		setup: "Set up this device",
		loading: "Loading devices",
		empty: "No local connectors are registered for this account.",
		device: "Device for this computer",
		choose: "Select this computer",
		online: "Connected",
		offline: "Device offline",
		start: "Enable local access",
		stop: "Stop forwarding this workspace",
		revoke: "Revoke device",
		reconnect: "Reconnect",
		port: "Remote TCP port",
		add: "Add port",
		invalidPort: "Enter an integer port between 1 and 65535.",
		noPorts:
			"No Web services discovered yet. Start a development server or add a TCP port manually.",
		blocked:
			"The gateway or workspace is unavailable, or browser-only access is enabled. Devices can still be revoked.",
		failure: "Operation failed. Check the device status and retry.",
		open: "Open",
		remove: "Remove port",
		install:
			"Download and run the connector for this computer. Enter the public URL, enrollment ID and one-time code when prompted. First setup enables login startup.",
		unix: "On macOS/Linux run chmod +x on the download before running it. On Windows double-click it. System security prompts require confirmation.",
		address: "Public URL",
		enrollment: "Enrollment ID",
		token:
			"One-time code (valid for 10 minutes; paste only at the program prompt)",
		complete: "Authorized. Select this computer in the device list.",
		expired: "Code expired. Set up the device again.",
		downloadError:
			"Installer unavailable. Ask your administrator to publish the connector.",
		checksum: "SHA256 checksum",
		conflict: "Local port occupied; another port was assigned",
		unavailable: "Unable to listen",
		capacity:
			"The connection or channel safety limit was reached. Please retry shortly.",
		webFallback: "Use Web preview",
		webLimit:
			"Path proxies may not support root-relative resources or hot reload. Local access is recommended.",
	},
	notAvailable: "N/A",
	language: {
		label: "Language",
		menuLabel: "Change language",
		english: "English",
		simplifiedChinese: "Simplified Chinese",
	},
} as const;
