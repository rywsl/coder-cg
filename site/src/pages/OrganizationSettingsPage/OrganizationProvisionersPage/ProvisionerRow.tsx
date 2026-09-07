import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type {
	ProvisionerDaemon,
	ProvisionerDaemonStatus,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	StatusIndicator,
	StatusIndicatorDot,
	type StatusIndicatorProps,
} from "#/components/StatusIndicator/StatusIndicator";
import { TableCell, TableRow } from "#/components/Table/Table";
import { JobStatusIndicator } from "#/modules/provisioners/JobStatusIndicator";
import {
	ProvisionerTag,
	ProvisionerTags,
	ProvisionerTruncateTags,
} from "#/modules/provisioners/ProvisionerTags";
import { ProvisionerKey } from "#/pages/OrganizationSettingsPage/OrganizationProvisionersPage/ProvisionerKey";
import { relativeTime } from "#/utils/time";
import { ProvisionerVersion } from "./ProvisionerVersion";

const variantByStatus: Record<
	ProvisionerDaemonStatus,
	StatusIndicatorProps["variant"]
> = {
	idle: "success",
	busy: "pending",
	offline: "inactive",
};

type ProvisionerRowProps = {
	provisioner: ProvisionerDaemon;
	buildVersion: string | undefined;
	defaultIsOpen: boolean;
};

export const ProvisionerRow: FC<ProvisionerRowProps> = ({
	provisioner,
	buildVersion,
	defaultIsOpen = false,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [isOpen, setIsOpen] = useState(defaultIsOpen);

	return (
		<>
			<TableRow>
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
										"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.hide_ac20a57b",
									)
								: tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.show_more_f5c9bd13",
									)}
							)
						</span>
						{provisioner.name}
					</Button>
				</TableCell>
				<TableCell>
					{provisioner.key_name && (
						<ProvisionerKey name={provisioner.key_name} />
					)}
				</TableCell>
				<TableCell>
					<ProvisionerVersion
						buildVersion={buildVersion}
						provisionerVersion={provisioner.version}
					/>
				</TableCell>
				<TableCell>
					{provisioner.status && (
						<StatusIndicator
							size="sm"
							variant={variantByStatus[provisioner.status]}
						>
							<StatusIndicatorDot />
							<span className="block first-letter:uppercase">
								{provisioner.status}
							</span>
						</StatusIndicator>
					)}
				</TableCell>
				<TableCell>
					<ProvisionerTruncateTags tags={provisioner.tags} />
				</TableCell>
				<TableCell>
					{provisioner.last_seen_at ? (
						<span className="block first-letter:uppercase">
							{relativeTime(new Date(provisioner.last_seen_at))}
						</span>
					) : (
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.never_6300ef80",
						)
					)}
				</TableCell>
			</TableRow>
			{isOpen && (
				<TableRow>
					<TableCell colSpan={999} className="p-4 border-t-0">
						<dl
							className={cn([
								"text-xs text-content-secondary",
								"m-0 grid grid-cols-[auto_1fr] gap-x-4 items-center",
								"[&_dd]:text-content-primary [&_dd]:font-mono [&_dd]:leading-[22px] [&_dt]:font-medium",
							])}
						>
							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.last_seen_8063520b",
								)}
							</dt>
							<dd data-pixel="ignore">{provisioner.last_seen_at}</dd>

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.creation_time_e087974b",
								)}
							</dt>
							<dd data-pixel="ignore">{provisioner.created_at}</dd>

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.version_4c5726ee",
								)}
							</dt>
							<dd>
								{provisioner.version === buildVersion
									? tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.up_to_date_bef6a4bb",
										)
									: tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.outdated_ee3cadee",
										)}
							</dd>

							<dt>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.tags_865658f8",
								)}
							</dt>
							<dd>
								<ProvisionerTags>
									{Object.entries(provisioner.tags).map(([key, value]) => (
										<ProvisionerTag key={key} label={key} value={value} />
									))}
								</ProvisionerTags>
							</dd>

							<div className="h-6 w-full col-span-2" />

							{provisioner.current_job && (
								<>
									<dt>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.current_job_361d5179",
										)}
									</dt>
									<dd>{provisioner.current_job.id}</dd>

									<dt>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.current_job_status_06d77c09",
										)}
									</dt>
									<dd>
										<JobStatusIndicator
											status={provisioner.current_job.status}
										/>
									</dd>
								</>
							)}

							{provisioner.previous_job && (
								<>
									<dt>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.previous_job_a61d4dfd",
										)}
									</dt>
									<dd className="flex items-center gap-2">
										<span>{provisioner.previous_job.id}</span>
										<Button size="xs" variant="outline" asChild>
											<RouterLink
												to={`../provisioner-jobs?${new URLSearchParams({ ids: provisioner.previous_job.id })}`}
											>
												{tI18n(
													"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.view_job_59012f37",
												)}
											</RouterLink>
										</Button>
									</dd>

									<dt>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.ProvisionerRow.previous_job_status_77be65b0",
										)}
									</dt>
									<dd>
										<JobStatusIndicator
											status={provisioner.previous_job.status}
										/>
									</dd>
								</>
							)}
						</dl>
					</TableCell>
				</TableRow>
			)}
		</>
	);
};
