import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { TemplateVersion } from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { InfoTooltip } from "#/components/InfoTooltip/InfoTooltip";
import { TableCell } from "#/components/Table/Table";
import { TimelineEntry } from "#/components/Timeline/TimelineEntry";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useClickableTableRow } from "#/hooks/useClickableTableRow";
import { currentIntlLocale } from "#/i18n/locale";

interface VersionRowProps {
	version: TemplateVersion;
	isActive: boolean;
	isLatest: boolean;
	onPromoteClick?: (version: TemplateVersion) => void;
	onArchiveClick?: (version: TemplateVersion) => void;
}

export const VersionRow: FC<VersionRowProps> = ({
	version,
	isActive,
	isLatest,
	onPromoteClick,
	onArchiveClick,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const navigate = useNavigate();
	const { permissions } = useAuthenticated();

	const clickableProps = useClickableTableRow({
		onClick: () => navigate(version.name),
	});

	const jobStatus = version.job.status;

	return (
		<TimelineEntry
			data-testid={`version-${version.id}`}
			aria-label={version.name}
			{...(permissions.updateTemplates ? clickableProps : { clickable: false })}
		>
			<TableCell className="relative border-b-0 p-0!">
				<div className="flex flex-row items-center justify-between gap-4 px-8 py-4">
					<div className="flex flex-row items-center gap-4">
						<Avatar
							fallback={version.created_by.username}
							src={version.created_by.avatar_url}
						/>
						<div className="flex flex-row items-center gap-2 font-inherit text-base font-normal leading-normal">
							<span>
								<strong>{version.created_by.username}</strong>
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.created_the_version_2734dd27",
								)}
								<strong>{version.name}</strong>
							</span>
							{version.message && (
								<InfoTooltip
									title={tI18n(
										"TemplatePage.TemplateVersionsPage.VersionRow.message_2f77668a",
									)}
									message={version.message}
								/>
							)}
							<span className="text-xs text-content-secondary">
								{new Date(version.created_at).toLocaleTimeString(
									currentIntlLocale(),
								)}
							</span>
						</div>
					</div>
					<div className="flex flex-row items-center gap-4">
						{isActive && (
							<Badge role="status" variant="green">
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.active_92340695",
								)}
							</Badge>
						)}
						{isLatest && (
							<Badge role="status">
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.newest_d15efa17",
								)}
							</Badge>
						)}
						{jobStatus === "pending" && (
							<Badge role="status">
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.pending_d867c5b4",
								)}
							</Badge>
						)}
						{jobStatus === "running" && (
							<Badge role="status" variant="info">
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.building_10dee879",
								)}
							</Badge>
						)}
						{(jobStatus === "canceling" || jobStatus === "canceled") && (
							<Badge role="status">
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.canceled_13ca2ee2",
								)}
							</Badge>
						)}
						{jobStatus === "failed" && (
							<Badge role="status" variant="destructive">
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.failed_031a8f0f",
								)}
							</Badge>
						)}

						{jobStatus === "failed" && onArchiveClick && (
							<Button
								variant="outline"
								disabled={isActive || version.archived}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onArchiveClick?.(version);
								}}
							>
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.archive_53411237",
								)}
							</Button>
						)}

						{jobStatus === "succeeded" && onPromoteClick && (
							<Button
								variant="outline"
								disabled={isActive || jobStatus !== "succeeded"}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onPromoteClick?.(version);
								}}
							>
								{tI18n(
									"TemplatePage.TemplateVersionsPage.VersionRow.promote_871f4166",
								)}
							</Button>
						)}
					</div>
				</div>
			</TableCell>
		</TimelineEntry>
	);
};
