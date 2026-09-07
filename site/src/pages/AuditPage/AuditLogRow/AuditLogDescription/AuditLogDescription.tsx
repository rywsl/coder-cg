import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { AuditLog } from "#/api/typesGenerated";
import { Link } from "#/components/Link/Link";
import { BuildAuditDescription } from "./BuildAuditDescription";

interface AuditLogDescriptionProps {
	auditLog: AuditLog;
}

export const AuditLogDescription: FC<AuditLogDescriptionProps> = ({
	auditLog,
}) => {
	if (auditLog.resource_type === "workspace_build") {
		return <BuildAuditDescription auditLog={auditLog} />;
	}
	if (auditLog.additional_fields?.connection_type) {
		return <AppSessionAuditLogDescription auditLog={auditLog} />;
	}

	let target = auditLog.resource_target.trim();
	let user = auditLog.user
		? auditLog.user.username.trim()
		: "Unauthenticated user";

	// SSH key entries have no links
	if (auditLog.resource_type === "git_ssh_key") {
		target = "";
	}

	// This occurs when SCIM creates a user, or dormancy changes a users status.
	if (
		auditLog.resource_type === "user" &&
		auditLog.additional_fields?.automatic_actor === "coder"
	) {
		user = "Coder automatically";
	}

	const truncatedDescription = auditLog.description
		.replace("{user}", `${user}`)
		.replace("{target}", "");

	// logs for workspaces created on behalf of other users indicate ownership in the description
	const onBehalfOf =
		auditLog.additional_fields.workspace_owner &&
		auditLog.additional_fields.workspace_owner !== "unknown" &&
		auditLog.additional_fields.workspace_owner.trim() !== user
			? ` on behalf of ${auditLog.additional_fields.workspace_owner}`
			: "";

	return (
		<span>
			{truncatedDescription}
			{auditLog.resource_link ? (
				<Link asChild showExternalIcon={false} className="text-base px-0">
					<RouterLink to={auditLog.resource_link}>
						<strong>{target}</strong>
					</RouterLink>
				</Link>
			) : (
				<strong>{target}</strong>
			)}
			{onBehalfOf}
		</span>
	);
};

function AppSessionAuditLogDescription({ auditLog }: AuditLogDescriptionProps) {
	const { t: tI18n } = useTranslation("administration");

	const { connection_type, workspace_owner, workspace_name } =
		auditLog.additional_fields;

	return (
		<>
			{connection_type}
			{tI18n(
				"AuditPage.AuditLogRow.AuditLogDescription.AuditLogDescription.session_to_add0c80c",
			)}
			{workspace_owner}
			{tI18n(
				"AuditPage.AuditLogRow.AuditLogDescription.AuditLogDescription.s_edc00d4d",
			)}{" "}
			<Link asChild showExternalIcon={false} className="text-base px-0">
				<RouterLink to={`${auditLog.resource_link}`}>
					<strong>{workspace_name}</strong>
				</RouterLink>
			</Link>{" "}
			{tI18n(
				"AuditPage.AuditLogRow.AuditLogDescription.AuditLogDescription.workspace_21a3230e",
			)}{" "}
			<strong>
				{auditLog.action === "disconnect"
					? tI18n(
							"AuditPage.AuditLogRow.AuditLogDescription.AuditLogDescription.closed_c3eefb58",
						)
					: tI18n(
							"AuditPage.AuditLogRow.AuditLogDescription.AuditLogDescription.opened_50236627",
						)}
			</strong>
		</>
	);
}
