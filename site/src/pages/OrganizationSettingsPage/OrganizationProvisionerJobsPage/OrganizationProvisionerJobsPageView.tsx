import { XIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	Organization,
	ProvisionerJob,
	ProvisionerJobStatus,
} from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { Link } from "#/components/Link/Link";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	StatusIndicator,
	StatusIndicatorDot,
	type StatusIndicatorProps,
} from "#/components/StatusIndicator/StatusIndicator";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import { JobRow } from "./JobRow";

const variantByStatus: Record<
	ProvisionerJobStatus,
	StatusIndicatorProps["variant"]
> = {
	succeeded: "success",
	failed: "failed",
	pending: "pending",
	running: "pending",
	canceling: "pending",
	canceled: "inactive",
	unknown: "inactive",
};

const StatusFilters: ProvisionerJobStatus[] = [
	"succeeded",
	"pending",
	"running",
	"canceling",
	"canceled",
	"failed",
	"unknown",
];

type JobProvisionersFilter = {
	status: string;
	ids: string;
};

type OrganizationProvisionerJobsPageViewProps = {
	jobs: ProvisionerJob[] | undefined;
	organization: Organization | undefined;
	error: unknown;
	filter: JobProvisionersFilter;
	onRetry: () => void;
	onFilterChange: (filter: JobProvisionersFilter) => void;
};

const OrganizationProvisionerJobsPageView: FC<
	OrganizationProvisionerJobsPageViewProps
> = ({ jobs, organization, error, filter, onFilterChange, onRetry }) => {
	const { t: tI18n } = useTranslation("administration");

	if (!organization) {
		return (
			<>
				<title>
					{pageTitle(
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.provisioner_jobs_e4be4fbf",
						),
					)}
				</title>
				<EmptyState
					message={tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.organization_not_found_00c50f7a",
					)}
				/>
			</>
		);
	}

	return (
		<div className="w-full max-w-(--breakpoint-2xl) pb-10">
			<title>
				{pageTitle(
					tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.provisioner_jobs_e4be4fbf",
					),
					organization.display_name || organization.name,
				)}
			</title>
			<section>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.provisioner_jobs_e4be4fbf",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.provisioner_jobs_are_the_individual_tasks_assign_edb6176d",
						)}{" "}
						<Link href={docs("/admin/provisioners/manage-provisioner-jobs")}>
							{tI18n(
								"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.view_docs_61479fda",
							)}
						</Link>
					</SettingsHeaderDescription>
				</SettingsHeader>

				<div className="flex items-center gap-2">
					{filter.ids && (
						<div className="relative">
							<Badge className="h-10 text-sm pl-3 pr-10 font-mono">
								{filter.ids}
							</Badge>
							<div className="size-10 flex items-center justify-center absolute top-0 right-0">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon"
											variant="subtle"
											onClick={() => {
												onFilterChange({ ...filter, ids: "" });
											}}
										>
											<span className="sr-only">
												{tI18n(
													"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.clear_id_9537d728",
												)}
											</span>
											<XIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.clear_id_9537d728",
										)}
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					)}

					<Select
						value={filter.status}
						onValueChange={(status) => {
							onFilterChange({
								...filter,
								status,
							});
						}}
					>
						<SelectTrigger className="w-[180px]" data-testid="status-filter">
							<SelectValue
								placeholder={tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.all_statuses_8ee57323",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{StatusFilters.map((status) => (
									<SelectItem key={status} value={status}>
										<StatusIndicator variant={variantByStatus[status]}>
											<StatusIndicatorDot />
											<span className="block first-letter:uppercase">
												{status}
											</span>
										</StatusIndicator>
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				<Table className="mt-6">
					<TableHeader>
						<TableRow>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.created_d70b9e24",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.type_baaddf70",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.template_0575f29d",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.tags_1331275b",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.status_920e413c",
								)}
							</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{jobs ? (
							jobs.length > 0 ? (
								jobs.map((j) => (
									<JobRow
										defaultIsOpen={filter.ids.includes(j.id)}
										key={j.id}
										job={j}
									/>
								))
							) : (
								<TableEmpty
									message={tI18n(
										"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.no_provisioner_jobs_found_a6dc6e49",
									)}
								/>
							)
						) : error ? (
							<TableEmpty
								message={tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.error_loading_the_provisioner_jobs_c06b62fc",
								)}
								cta={
									<Button size="sm" onClick={onRetry}>
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionerJobsPage.OrganizationProvisionerJobsPageView.retry_942087cc",
										)}
									</Button>
								}
							/>
						) : (
							<TableLoader />
						)}
					</TableBody>
				</Table>
			</section>
		</div>
	);
};

export default OrganizationProvisionerJobsPageView;
