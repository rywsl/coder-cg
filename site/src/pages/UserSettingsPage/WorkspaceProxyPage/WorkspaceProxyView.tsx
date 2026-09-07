import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { Region } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
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
import type { ProxyLatencyReport } from "#/contexts/useProxyLatency";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import { ProxyRow } from "./WorkspaceProxyRow";

interface WorkspaceProxyViewProps {
	proxies?: readonly Region[];
	proxyLatencies?: Record<string, ProxyLatencyReport>;
	getWorkspaceProxiesError?: unknown;
	isLoading: boolean;
	hasLoaded: boolean;
	preferredProxy?: Region;
	selectProxyError?: unknown;
	showPaywall: boolean;
	permissions: Permissions;
}

export const WorkspaceProxyView: FC<WorkspaceProxyViewProps> = ({
	proxies,
	proxyLatencies,
	getWorkspaceProxiesError,
	isLoading,
	hasLoaded,
	selectProxyError,
	showPaywall,
	permissions,
}) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<div>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.workspace_proxies_62ee3d16",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.workspace_proxies_improve_terminal_and_web_app_c_074d8faa",
					)}{" "}
					<SettingsHeaderDocsLink
						href={docs("/admin/networking/workspace-proxies")}
					/>
				</SettingsHeaderDescription>
			</SettingsHeader>
			{showPaywall ? (
				<PremiumPaywall
					source="workspace_proxies"
					message={tI18n(
						"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.workspace_proxies_62ee3d16",
					)}
					description={tI18n(
						"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.provide_low_latency_connections_for_geo_distribu_94a04038",
					)}
					features={[
						tI18n(
							"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.low_latency_connections_for_global_teams_82872a96",
						),
						tI18n(
							"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.automatic_lowest_latency_proxy_selection_9a2b5f28",
						),
						tI18n(
							"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.relay_for_ssh_apps_and_ports_bae88b12",
						),
						tI18n(
							"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.per_proxy_latency_and_health_metrics_31413af3",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			) : (
				<div className="flex flex-col gap-4">
					{Boolean(getWorkspaceProxiesError) && (
						<ErrorAlert error={getWorkspaceProxiesError} />
					)}
					{Boolean(selectProxyError) && <ErrorAlert error={selectProxyError} />}

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[60%]">
									{tI18n(
										"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.proxy_a68ee416",
									)}
								</TableHead>
								<TableHead className="w-[20%]">
									{tI18n(
										"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.status_920e413c",
									)}
								</TableHead>
								<TableHead className="w-[20%]">
									{tI18n(
										"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.latency_e0e7d293",
									)}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<ProxiesTableBody
								proxies={proxies}
								proxyLatencies={proxyLatencies}
								isLoading={isLoading}
								hasLoaded={hasLoaded}
							/>
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

interface ProxiesTableBodyProps {
	proxies?: readonly Region[];
	proxyLatencies?: Record<string, ProxyLatencyReport>;
	isLoading: boolean;
	hasLoaded: boolean;
}

const ProxiesTableBody: FC<ProxiesTableBodyProps> = ({
	proxies,
	proxyLatencies,
	isLoading,
	hasLoaded,
}) => {
	const { t: tI18n } = useTranslation("users");

	if (isLoading) {
		return <TableLoader />;
	}
	if (hasLoaded && proxies?.length === 0) {
		return (
			<TableEmpty
				message={tI18n(
					"UserSettingsPage.WorkspaceProxyPage.WorkspaceProxyView.no_workspace_proxies_found_8d45be26",
				)}
			/>
		);
	}
	return proxies?.map((proxy) => (
		<ProxyRow
			latency={proxyLatencies?.[proxy.id]}
			key={proxy.id}
			proxy={proxy}
		/>
	));
};
