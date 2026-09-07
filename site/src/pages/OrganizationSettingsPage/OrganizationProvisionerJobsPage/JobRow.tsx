import { cn } from "cn";
import { ChevronRightIcon, TriangleAlertIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { ProvisionerJob } from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { TableCell, TableRow } from "#/components/Table/Table";
import { JobStatusIndicator } from "#/modules/provisioners/JobStatusIndicator";
import {
	ProvisionerTag,
	ProvisionerTags,
	ProvisionerTruncateTags,
} from "#/modules/provisioners/ProvisionerTags";
import { relativeTime } from "#/utils/time";
import { CancelJobButton } from "./CancelJobButton";

type JobRowProps = {
	job: ProvisionerJob;
	defaultIsOpen: boolean;
};

export const JobRow: FC<JobRowProps> = ({ job, defaultIsOpen = false }) => {
	const { t: tI18n } = useTranslation("administration");

	const metadata = job.metadata;
	const [isOpen, setIsOpen] = useState(defaultIsOpen);
	const queue = {
		size: job.queue_size,
		position: job.queue_position,
	};

	return (
		<>
			<TableRow key={job.id}>
				<TableCell>
					<Button
						variant="subtle"
						size="sm"
						className={cn([
							isOpen && "text-content-primary",
							"p-0 h-auto min-w-0 align-middle",
						])}
						onClick={() => {
							setIsOpen((v) => !v);
						}}
					>
						<ChevronRightIcon
							className={cn("mr-4 transition-transform", isOpen && "rotate-90")}
						/>
						<span className="sr-only">
							(
							{isOpen
								? tI18n(
										"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.hide_ac20a57b",
									)
								: tI18n(
										"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.show_more_f5c9bd13",
									)}
							)
						</span>
						<span className="block first-letter:uppercase">
							{relativeTime(new Date(job.created_at))}
						</span>
					</Button>
				</TableCell>
				<TableCell>
					<Badge>{job.type}</Badge>
				</TableCell>
				<TableCell>
					{job.metadata.template_name !== "" ? (
						<div className="flex items-center gap-1 whitespace-nowrap">
							<Avatar
								variant="icon"
								src={metadata.template_icon}
								fallback={
									metadata.template_display_name || metadata.template_name
								}
							/>
							{metadata.template_display_name || metadata.template_name}
						</div>
					) : (
						<span>-</span>
					)}
				</TableCell>
				<TableCell>
					<ProvisionerTruncateTags tags={job.tags} />
				</TableCell>
				<TableCell>
					<JobStatusIndicator status={job.status} queue={queue} />
				</TableCell>
				<TableCell className="text-right">
					<CancelJobButton job={job} />
				</TableCell>
			</TableRow>
			{isOpen && (
				<TableRow>
					<TableCell colSpan={999} className="p-4 border-t-0">
						{job.status === "failed" && (
							<div
								className={cn([
									"inline-flex items-center gap-2 rounded border border-solid border-boder p-2",
									"text-content-primary bg-surface-secondary mb-4",
								])}
							>
								<TriangleAlertIcon className="text-content-destructive size-icon-sm p-0.5" />
								<span className="[&:first-letter]:uppercase">{job.error}</span>
							</div>
						)}
						<dl
							className={cn([
								"text-xs text-content-secondary",
								"m-0 grid grid-cols-[auto_1fr] gap-x-4 items-center",
								"[&_dd]:text-content-primary [&_dd]:font-mono [&_dd]:leading-[22px] [&_dt]:font-medium",
							])}
						>
							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.job_id_e29dcd38",
								)}
							</dt>
							<dd>{job.id}</dd>

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.available_provisioners_633faded",
								)}
							</dt>
							<dd>
								{job.available_workers
									? JSON.stringify(job.available_workers)
									: "[]"}
							</dd>

							{job.worker_id && (
								<>
									<dt>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.completed_by_provisioner_2f6a28eb",
										)}
									</dt>
									<dd className="flex items-center gap-2">
										<span>
											{job.worker_name ||
												tI18n(
													"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.removed_985a5be9",
												)}
										</span>
										{job.worker_name && (
											<Button size="xs" variant="outline" asChild>
												<RouterLink
													to={`../provisioners?${new URLSearchParams({ ids: job.worker_id })}`}
												>
													{tI18n(
														"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.view_provisioner_878efd37",
													)}
												</RouterLink>
											</Button>
										)}
									</dd>
								</>
							)}

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.associated_workspace_cc2e492b",
								)}
							</dt>
							<dd>
								{job.metadata.workspace_name ??
									tI18n(
										"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.null_74234e98",
									)}
							</dd>

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.creation_time_e087974b",
								)}
							</dt>
							<dd data-pixel="ignore">{job.created_at}</dd>

							{job.queue_position > 0 && (
								<>
									<dt>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.queue_bc751156",
										)}
									</dt>
									<dd>
										{job.queue_position}/{job.queue_size}
									</dd>
								</>
							)}

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.JobRow.tags_865658f8",
								)}
							</dt>
							<dd>
								<ProvisionerTags>
									{Object.entries(job.tags).map(([key, value]) => (
										<ProvisionerTag key={key} label={key} value={value} />
									))}
								</ProvisionerTags>
							</dd>
						</dl>
					</TableCell>
				</TableRow>
			)}
		</>
	);
};
