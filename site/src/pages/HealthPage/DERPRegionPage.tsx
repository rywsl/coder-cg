import { cn } from "cn";
import { ChevronLeftIcon, CodeIcon, HashIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext, useParams } from "react-router";
import type {
	DERPNodeReport,
	DERPRegionReport,
	HealthcheckReport,
	HealthSeverity,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "#/components/Table/Table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { getLatencyColor } from "#/utils/latency";
import { pageTitle } from "#/utils/page";
import {
	BooleanPill,
	Header,
	HeaderTitle,
	HealthMessageDocsLink,
	HealthyDot,
	Logs,
	Main,
	Pill,
	StatusIcon,
} from "./Content";

interface NodeCheckRow {
	label: string;
	description: string;
	value: boolean | null;
}

const DERPRegionPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	const healthStatus = useOutletContext<HealthcheckReport>();
	const params = useParams() as { regionId: string };
	const regionId = Number(params.regionId);
	const {
		region,
		node_reports: reports,
		warnings,
		severity,
	} = healthStatus.derp.regions[regionId] as DERPRegionReport;

	if (!region) {
		return null;
	}

	return (
		<>
			<title>
				{pageTitle(
					region.RegionName,
					tI18n("HealthPage.DERPRegionPage.health_55898449"),
				)}
			</title>
			<Header>
				<hgroup>
					<Link
						className="text-xs no-underline text-content-secondary font-medium inline-flex items-center hover:text-content-primary mb-2 leading-tight"
						to="/health/derp"
					>
						<ChevronLeftIcon className="size-icon-xs align-middle mr-2" />
						{tI18n("HealthPage.DERPRegionPage.back_to_derp_50ac2836")}
					</Link>
					<HeaderTitle>
						<HealthyDot severity={severity as HealthSeverity} />
						{region.RegionName}
					</HeaderTitle>
				</hgroup>
			</Header>
			<Main>
				{warnings.map((warning) => {
					return (
						<Alert
							actions={<HealthMessageDocsLink {...warning} />}
							key={warning.code}
							severity="warning"
							prominent
							dismissible
						>
							{warning.message}
						</Alert>
					);
				})}

				<section>
					<div className="flex flex-wrap gap-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<Pill icon={<HashIcon className="size-icon-sm" />}>
									{region.RegionID}
								</Pill>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{tI18n("HealthPage.DERPRegionPage.region_id_4bd985c8")}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Pill icon={<CodeIcon className="size-icon-sm" />}>
									{region.RegionCode}
								</Pill>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{tI18n("HealthPage.DERPRegionPage.region_code_da692a86")}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<BooleanPill value={region.EmbeddedRelay}>
									{tI18n("HealthPage.DERPRegionPage.embedded_relay_02893ba1")}
								</BooleanPill>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{tI18n(
									"HealthPage.DERPRegionPage.whether_this_region_uses_a_relay_server_embedded_dfd101d1",
								)}
							</TooltipContent>
						</Tooltip>
					</div>
				</section>

				{reports.map((rawReport) => {
					if (!rawReport) {
						return null;
					}
					const report = rawReport as DERPNodeReport;
					const { node, client_logs: logs } = report;
					if (!node) {
						return null;
					}

					const latencyColor = getLatencyColor(report.round_trip_ping_ms);
					const latencyBackground = getLatencyColor(
						report.round_trip_ping_ms,
						"background",
					);
					const checks: NodeCheckRow[] = [
						{
							label: tI18n(
								"HealthPage.DERPRegionPage.exchange_messages_fbbadfb1",
							),
							description: tI18n(
								"HealthPage.DERPRegionPage.whether_derp_clients_can_relay_messages_through__4fe27b2b",
							),
							value: report.can_exchange_messages,
						},
						{
							label: tI18n(
								"HealthPage.DERPRegionPage.direct_http_upgrade_dc01dc1f",
							),
							description: tI18n(
								"HealthPage.DERPRegionPage.whether_the_connection_used_a_direct_http_upgrad_64baccf9",
							),
							value: !report.uses_websocket,
						},
						{
							label: tI18n("HealthPage.DERPRegionPage.stun_enabled_0fb7c3ea"),
							description: tI18n(
								"HealthPage.DERPRegionPage.whether_stun_is_enabled_on_this_node_dfd989aa",
							),
							value: report.stun.Enabled,
						},
						{
							label: tI18n("HealthPage.DERPRegionPage.stun_reachable_f8c13292"),
							description: tI18n(
								"HealthPage.DERPRegionPage.whether_this_node_responded_to_a_stun_request_su_7ebc4b19",
							),
							value: report.stun.CanSTUN,
						},
					];
					return (
						<section
							key={node.HostName}
							className="border border-solid border-border rounded-lg overflow-hidden text-sm"
						>
							<header className="p-6 flex justify-between items-center">
								<div>
									<h4 className="font-medium m-0 leading-none">
										{node.HostName}
									</h4>
									<div className="flex items-center gap-2 text-content-secondary text-xs leading-tight mt-2">
										<span>
											{tI18n("HealthPage.DERPRegionPage.derp_port_5c96fb23")}
											{node.DERPPort ??
												tI18n("HealthPage.DERPRegionPage.none_dc937b59")}
										</span>
										<span>
											{tI18n("HealthPage.DERPRegionPage.stun_port_b1114842")}
											{node.STUNPort ??
												tI18n("HealthPage.DERPRegionPage.none_dc937b59")}
										</span>
									</div>
								</div>

								<Tooltip>
									<TooltipTrigger asChild>
										<Pill
											className={latencyColor}
											icon={<StatusCircle background={latencyBackground} />}
										>
											{report.round_trip_ping_ms}
											{tI18n("HealthPage.DERPRegionPage.ms_f785c3ce")}
										</Pill>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{tI18n(
											"HealthPage.DERPRegionPage.round_trip_ping_2dd63012",
										)}
									</TooltipContent>
								</Tooltip>
							</header>
							<Table>
								<TableBody className="[&>tr>td:first-of-type]:border-l-0 [&>tr>td:last-child]:border-r-0 [&>tr:last-child>td]:border-b-0 [&>tr>td]:rounded-none!">
									{checks.map((check) => (
										<TableRow key={check.label}>
											<TableCell className="w-8">
												<StatusIcon value={check.value} />
											</TableCell>
											<TableCell className="font-medium whitespace-nowrap w-40">
												{check.label}
											</TableCell>
											<TableCell className="text-content-secondary">
												{check.description}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<Logs
								lines={logs?.flat() ?? []}
								className="border-0 border-t border-solid border-border"
							/>
							{report.client_errs.length > 0 && (
								<Logs
									lines={report.client_errs.flat()}
									className="border-0 border-t border-solid border-border bg-surface-destructive text-content-destructive"
								/>
							)}
						</section>
					);
				})}
			</Main>
		</>
	);
};

type StatusCircleProps = { background: string };

const StatusCircle: FC<StatusCircleProps> = ({ background }) => {
	return (
		<div className="flex items-center justify-center">
			<div className={cn("size-2 rounded-full", background)} />
		</div>
	);
};

export default DERPRegionPage;
