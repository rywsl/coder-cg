import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import type { ConnectionLog } from "#/api/typesGenerated";
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
import { ConnectionLogFilter } from "./ConnectionLogFilter";
import { ConnectionLogHelpPopover } from "./ConnectionLogHelpPopover";
import { ConnectionLogRow } from "./ConnectionLogRow/ConnectionLogRow";

interface ConnectionLogPageViewProps {
	connectionLogs?: readonly ConnectionLog[];
	isNonInitialPage: boolean;
	isConnectionLogVisible: boolean;
	error?: unknown;
	filterProps: ComponentProps<typeof ConnectionLogFilter>;
	connectionLogsQuery: PaginationResult;
	permissions: Permissions;
}

export const ConnectionLogPageView: FC<ConnectionLogPageViewProps> = ({
	connectionLogs,
	isNonInitialPage,
	isConnectionLogVisible,
	error,
	filterProps,
	connectionLogsQuery: paginationResult,
	permissions,
}) => {
	const { t: tI18n } = useTranslation("pages");

	const isLoading =
		(connectionLogs === undefined ||
			paginationResult.totalRecords === undefined) &&
		!error;

	const isEmpty = !isLoading && connectionLogs?.length === 0;

	return (
		<Margins className="pb-12">
			<PageHeader>
				<PageHeaderTitle>
					<div className="flex flex-row gap-2 items-center">
						<span>
							{tI18n(
								"ConnectionLogPage.ConnectionLogPageView.connection_log_7bb75459",
							)}
						</span>
						<ConnectionLogHelpPopover />
					</div>
				</PageHeaderTitle>
				<PageHeaderSubtitle>
					{tI18n(
						"ConnectionLogPage.ConnectionLogPageView.view_workspace_connection_events_4d73c16c",
					)}{" "}
					<SettingsHeaderDocsLink
						href={docs("/admin/monitoring/connection-logs")}
					/>
				</PageHeaderSubtitle>
			</PageHeader>
			{isConnectionLogVisible ? (
				<>
					<ConnectionLogFilter {...filterProps} />

					<PaginationContainer
						query={paginationResult}
						paginationUnitLabel="logs"
					>
						<Table>
							<TableBody>
								<ConnectionLogTableBody
									connectionLogs={connectionLogs}
									error={error}
									isLoading={isLoading}
									isEmpty={isEmpty}
									isNonInitialPage={isNonInitialPage}
								/>
							</TableBody>
						</Table>
					</PaginationContainer>
				</>
			) : (
				<PremiumPaywall
					source="connection_log"
					message={tI18n(
						"ConnectionLogPage.ConnectionLogPageView.connection_logs_2c3ec0db",
					)}
					description={tI18n(
						"ConnectionLogPage.ConnectionLogPageView.track_every_ssh_ide_port_forward_connection_f9d8dce9",
					)}
					features={[
						tI18n(
							"ConnectionLogPage.ConnectionLogPageView.full_record_of_ssh_ide_app_sessions_358f3ac3",
						),
						tI18n(
							"ConnectionLogPage.ConnectionLogPageView.filter_by_organization_user_type_711cea19",
						),
						tI18n(
							"ConnectionLogPage.ConnectionLogPageView.export_to_splunk_other_siems_8aef8c0f",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			)}
		</Margins>
	);
};

interface ConnectionLogTableBodyProps {
	connectionLogs: readonly ConnectionLog[] | undefined;
	error: unknown;
	isLoading: boolean;
	isEmpty: boolean;
	isNonInitialPage: boolean;
}

const ConnectionLogTableBody: FC<ConnectionLogTableBodyProps> = ({
	connectionLogs,
	error,
	isLoading,
	isEmpty,
	isNonInitialPage,
}) => {
	const { t: tI18n } = useTranslation("pages");

	// An error renders as an empty table.
	if (error) {
		return (
			<TableEmpty
				message={tI18n(
					"ConnectionLogPage.ConnectionLogPageView.an_error_occurred_while_loading_connection_logs_8caacf06",
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
					"ConnectionLogPage.ConnectionLogPageView.no_connection_logs_available_on_this_page_406017f5",
				)
			: tI18n(
					"ConnectionLogPage.ConnectionLogPageView.no_connection_logs_available_da36b6db",
				);
		return <TableEmpty message={emptyMessage} />;
	}
	if (!connectionLogs) {
		return null;
	}
	return (
		<Timeline
			items={connectionLogs}
			getDate={(log) => new Date(log.connect_time)}
			row={(log) => <ConnectionLogRow key={log.id} connectionLog={log} />}
		/>
	);
};
