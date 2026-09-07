import { XIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ProvisionerDaemon } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { Link } from "#/components/Link/Link";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
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
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import { LastConnectionHead } from "./LastConnectionHead";
import { ProvisionerRow } from "./ProvisionerRow";

type ProvisionersFilter = {
	ids: string;
	offline: boolean;
};

interface OrganizationProvisionersPageViewProps {
	showPaywall: boolean | undefined;
	provisioners: readonly ProvisionerDaemon[] | undefined;
	buildVersion: string | undefined;
	error: unknown;
	filter: ProvisionersFilter;
	permissions: Permissions;
	onRetry: () => void;
	onFilterChange: (filter: ProvisionersFilter) => void;
}

export const OrganizationProvisionersPageView: FC<
	OrganizationProvisionersPageViewProps
> = ({
	showPaywall,
	error,
	provisioners,
	buildVersion,
	filter,
	permissions,
	onFilterChange,
	onRetry,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<section className="w-full max-w-(--breakpoint-2xl) pb-10">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.provisioners_82d4a12e",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.coder_server_runs_provisioner_daemons_which_exec_8f8bec6c",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/provisioners")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			{filter.ids && (
				<div className="flex items-center gap-2 mb-6">
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
												"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.clear_id_9537d728",
											)}
										</span>
										<XIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.clear_id_9537d728",
									)}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
			)}
			{showPaywall ? (
				<PremiumPaywall
					source="provisioners"
					message={tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.provisioners_82d4a12e",
					)}
					description={tI18n(
						"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.provisioners_run_your_terraform_to_create_templa_09060a53",
					)}
					features={[
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.run_build_jobs_in_isolation_172531de",
						),
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.isolate_cloud_apis_from_coder_bab1d6d8",
						),
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.keep_secrets_off_the_coder_host_68379f8f",
						),
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.reduce_server_load_and_queue_times_af610661",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			) : (
				<>
					<div className="flex items-center gap-2 mb-6">
						<Checkbox
							id="offline-filter"
							checked={filter.offline}
							onCheckedChange={(checked) => {
								onFilterChange({
									...filter,
									offline: checked === true,
								});
							}}
						/>
						<label
							htmlFor="offline-filter"
							className="text-sm font-medium leading-none"
						>
							{tI18n(
								"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.include_offline_provisioners_616cce9e",
							)}
						</label>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.name_dcd1d522",
									)}
								</TableHead>
								<TableHead>
									{tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.key_99a52df3",
									)}
								</TableHead>
								<TableHead>
									{tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.version_dd167905",
									)}
								</TableHead>
								<TableHead>
									{tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.status_920e413c",
									)}
								</TableHead>
								<TableHead>
									{tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.tags_1331275b",
									)}
								</TableHead>
								<TableHead>
									<LastConnectionHead />
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provisioners ? (
								provisioners.length > 0 ? (
									provisioners.map((provisioner) => (
										<ProvisionerRow
											provisioner={provisioner}
											key={provisioner.id}
											buildVersion={buildVersion}
											defaultIsOpen={filter.ids.includes(provisioner.id)}
										/>
									))
								) : (
									<TableEmpty
										message={tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.no_provisioners_found_6a5751fd",
										)}
										description={tI18n(
											"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.a_provisioner_is_required_before_you_can_create__94114ee5",
										)}
										cta={
											<Button size="sm" asChild>
												<Link href={docs("/admin/provisioners")}>
													{tI18n(
														"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.create_a_provisioner_8365116e",
													)}
												</Link>
											</Button>
										}
									/>
								)
							) : error ? (
								<TableEmpty
									message={tI18n(
										"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.error_loading_the_provisioner_jobs_c06b62fc",
									)}
									cta={
										<Button onClick={onRetry} size="sm">
											{tI18n(
												"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPageView.retry_942087cc",
											)}
										</Button>
									}
								/>
							) : (
								<TableLoader />
							)}
						</TableBody>
					</Table>
				</>
			)}
		</section>
	);
};
