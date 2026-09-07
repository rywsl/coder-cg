import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "#/api/typesGenerated";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import {
	PaginationContainer,
	type PaginationResult,
} from "#/components/PaginationWidget/PaginationContainer";
import { SettingsHeaderDocsLink } from "#/components/SettingsHeader/SettingsHeader";
import { Table, TableBody } from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";
import { Timeline } from "#/components/Timeline/Timeline";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import { AuditFilter } from "./AuditFilter";
import { AuditHelpPopover } from "./AuditHelpPopover";
import { AuditLogRow } from "./AuditLogRow/AuditLogRow";

interface AuditPageViewProps {
	auditLogs?: readonly AuditLog[];
	isNonInitialPage: boolean;
	isAuditLogVisible: boolean;
	error?: unknown;
	filterProps: ComponentProps<typeof AuditFilter>;
	auditsQuery: PaginationResult;
	showOrgDetails: boolean;
	permissions: Permissions;
}

export const AuditPageView: FC<AuditPageViewProps> = ({
	auditLogs,
	isNonInitialPage,
	isAuditLogVisible,
	error,
	filterProps,
	auditsQuery: paginationResult,
	showOrgDetails,
	permissions,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const isLoading =
		(auditLogs === undefined || paginationResult.totalRecords === undefined) &&
		!error;

	const isEmpty = !isLoading && auditLogs?.length === 0;

	return (
		<Margins className="pb-12">
			<PageHeader>
				<PageHeaderTitle>
					<div className="flex flex-row gap-2 items-center">
						<span>{tI18n("AuditPage.AuditPageView.audit_bb6aea28")}</span>
						<AuditHelpPopover />
					</div>
				</PageHeaderTitle>
				<PageHeaderSubtitle>
					{tI18n(
						"AuditPage.AuditPageView.view_events_in_your_audit_log_a2177edb",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/security/audit-logs")} />
				</PageHeaderSubtitle>
			</PageHeader>
			{isAuditLogVisible ? (
				<>
					<AuditFilter {...filterProps} />

					<PaginationContainer
						query={paginationResult}
						paginationUnitLabel="logs"
					>
						<Table>
							<TableBody>
								<AuditTableBody
									auditLogs={auditLogs}
									error={error}
									isLoading={isLoading}
									isEmpty={isEmpty}
									isNonInitialPage={isNonInitialPage}
									showOrgDetails={showOrgDetails}
								/>
							</TableBody>
						</Table>
					</PaginationContainer>
				</>
			) : (
				<PremiumPaywall
					source="audit_log"
					message={tI18n("AuditPage.AuditPageView.audit_logs_569ef18c")}
					description={tI18n(
						"AuditPage.AuditPageView.see_exactly_who_changed_what_and_when_with_every_9f61d583",
					)}
					features={[
						tI18n(
							"AuditPage.AuditPageView.configurable_retention_auto_purge_de9ce451",
						),
						tI18n(
							"AuditPage.AuditPageView.api_export_to_splunk_datadog_more_a20357db",
						),
						tI18n(
							"AuditPage.AuditPageView.meets_soc_2_hipaa_audit_requirements_2ef21a94",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			)}
		</Margins>
	);
};

interface AuditTableBodyProps {
	auditLogs: readonly AuditLog[] | undefined;
	error: unknown;
	isLoading: boolean;
	isEmpty: boolean;
	isNonInitialPage: boolean;
	showOrgDetails: boolean;
}

const AuditTableBody: FC<AuditTableBodyProps> = ({
	auditLogs,
	error,
	isLoading,
	isEmpty,
	isNonInitialPage,
	showOrgDetails,
}) => {
	const { t: tI18n } = useTranslation("administration");

	// An error renders as an empty table.
	if (error) {
		return (
			<TableEmpty
				message={tI18n(
					"AuditPage.AuditPageView.an_error_occurred_while_loading_audit_logs_9385fa07",
				)}
			/>
		);
	}
	if (isLoading) {
		return <TableLoader />;
	}
	if (isEmpty) {
		const emptyMessage = isNonInitialPage
			? tI18n(
					"AuditPage.AuditPageView.no_audit_logs_available_on_this_page_1297d7e7",
				)
			: tI18n("AuditPage.AuditPageView.no_audit_logs_available_ac0929aa");
		return <TableEmpty message={emptyMessage} />;
	}
	if (!auditLogs) {
		return null;
	}
	return (
		<Timeline
			items={auditLogs}
			getDate={(log) => new Date(log.time)}
			row={(log) => (
				<AuditLogRow
					key={log.id}
					auditLog={log}
					showOrgDetails={showOrgDetails}
				/>
			)}
		/>
	);
};
