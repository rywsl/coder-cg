export const common = {
	publicPorts: {
		title: "Public access",
		description:
			"Access this workspace on a dedicated HTTPS port on the public IP. No connector is needed. Anyone with the address can access a published service.",
		loading: "Loading public ports…",
		retry: "Retry",
		disabled:
			"Public ports are disabled. Ask your administrator to configure HTTPS ingress and FRP.",
		browserOnly:
			"Browser-only policy prevents publishing ports. Existing shares can still be removed.",
		offline: "The agent is not ready. Existing shares can still be removed.",
		empty: "This agent has no public ports.",
		copy: "Copy public URL",
		remove: "Remove public access to port {{port}}",
		port: "Remote web port",
		detected: "Detected listening ports: {{ports}}",
		none: "None",
		protocol: "Remote service protocol",
		consent: "Allow anyone to access this port without signing in",
		publish: "Publish port",
		certificate:
			"The public endpoint needs a valid HTTPS certificate for this IP. If your browser reports a certificate error, ask your administrator to fix it. Do not bypass verification.",
		states: {
			ingress_error: "HTTPS ingress or FRP unavailable",
			ready: "Proxy ready",
			unavailable: "Workspace or permission unavailable",
			proxy_error: "Proxy listener failed",
			disabled: "Disabled by administrator",
		},
	},
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
