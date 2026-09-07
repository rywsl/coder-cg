import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { ConnectionLog } from "#/api/typesGenerated";
import { Link } from "#/components/Link/Link";
import { connectionTypeToFriendlyName } from "#/utils/connection";

interface ConnectionLogDescriptionProps {
	connectionLog: ConnectionLog;
}

export const ConnectionLogDescription: FC<ConnectionLogDescriptionProps> = ({
	connectionLog,
}) => {
	const { t: tI18n } = useTranslation("pages");

	const { type, workspace_owner_username, workspace_name, web_info } =
		connectionLog;

	switch (type) {
		case "port_forwarding":
		case "workspace_app": {
			if (!web_info) return null;

			const { user, slug_or_port, status_code } = web_info;
			const isPortForward = type === "port_forwarding";
			const presentAction = isPortForward ? "access" : "open";
			const pastAction = isPortForward ? "accessed" : "opened";

			const target: ReactNode = isPortForward ? (
				<>
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.port_7c065190",
					)}
					<strong>{slug_or_port}</strong>
				</>
			) : (
				<strong>{slug_or_port}</strong>
			);

			const actionText: ReactNode = (() => {
				if (status_code === 303) {
					return (
						<>
							{tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.was_redirected_attempting_to_679dbe34",
							)}
							{presentAction} {target}
						</>
					);
				}
				if ((status_code ?? 0) >= 400) {
					return (
						<>
							{tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.unsuccessfully_attempted_to_74b09bdf",
							)}
							{presentAction} {target}
						</>
					);
				}
				return (
					<>
						{pastAction} {target}
					</>
				);
			})();

			const isOwnWorkspace = user
				? workspace_owner_username === user.username
				: false;

			return (
				<span>
					{user
						? user.username
						: tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.unauthenticated_user_4f793385",
							)}{" "}
					{actionText}
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.in_8f6b9ac6",
					)}{" "}
					{isOwnWorkspace
						? tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.their_fd963e4f",
							)
						: tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.value0_s_db9a5fb7",
								{
									value0: workspace_owner_username,
								},
							)}{" "}
					<Link asChild showExternalIcon={false} className="text-base">
						<RouterLink to={`/@${workspace_owner_username}/${workspace_name}`}>
							<strong>{workspace_name}</strong>
						</RouterLink>
					</Link>{" "}
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.workspace_21a3230e",
					)}
				</span>
			);
		}

		case "reconnecting_pty":
		case "ssh":
		case "jetbrains":
		case "vscode": {
			const friendlyType = connectionTypeToFriendlyName(type);
			return (
				<span>
					{friendlyType}
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.session_to_add0c80c",
					)}
					{workspace_owner_username}
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.s_edc00d4d",
					)}{" "}
					<Link asChild showExternalIcon={false} className="text-base">
						<RouterLink to={`/@${workspace_owner_username}/${workspace_name}`}>
							<strong>{workspace_name}</strong>
						</RouterLink>
					</Link>{" "}
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.workspace_21a3230e",
					)}{" "}
				</span>
			);
		}

		case "tunnel": {
			if (!web_info) return null;
			const { user, status_code } = web_info;
			const actor = user?.username ?? "Unknown user";
			const action =
				status_code >= 400
					? "was denied a tunnel to"
					: "established a tunnel to";
			const isOwnWorkspace = workspace_owner_username === user?.username;
			return (
				<span>
					{actor} {action}{" "}
					{isOwnWorkspace
						? tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.their_fd963e4f",
							)
						: tI18n(
								"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.value0_s_db9a5fb7",
								{
									value0: workspace_owner_username,
								},
							)}{" "}
					<Link asChild showExternalIcon={false} className="text-base">
						<RouterLink to={`/@${workspace_owner_username}/${workspace_name}`}>
							<strong>{workspace_name}</strong>
						</RouterLink>
					</Link>{" "}
					{tI18n(
						"ConnectionLogPage.ConnectionLogRow.ConnectionLogDescription.ConnectionLogDescription.workspace_21a3230e",
					)}
				</span>
			);
		}
	}
};
