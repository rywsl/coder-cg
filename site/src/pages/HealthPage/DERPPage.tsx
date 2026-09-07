import { MapPinIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import type {
	HealthcheckReport,
	HealthSeverity,
	NetcheckReport,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "#/components/Table/Table";
import { i18n } from "#/i18n";
import { pageTitle } from "#/utils/page";
import {
	Header,
	HeaderTitle,
	HealthMessageDocsLink,
	HealthyDot,
	Logs,
	Main,
	SectionLabel,
	StatusIcon,
} from "./Content";
import { MuteWarningsButton } from "./MuteWarningsButton";

type BooleanKeys<T> = {
	[K in keyof T]: T[K] extends boolean | null ? K : never;
}[keyof T];

interface FlagInfo {
	label: string;
	description: string;
	invert?: boolean;
}

const flagDescriptions: Record<BooleanKeys<NetcheckReport>, FlagInfo> = {
	UDP: {
		label: i18n.t("pages:HealthPage.DERPPage.udp_dc4030f9"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_a_udp_stun_round_trip_completed_successf_12adb743",
		),
	},
	IPv6: {
		label: i18n.t("pages:HealthPage.DERPPage.ipv6_0b0f0a26"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_an_ipv6_stun_round_trip_completed_succes_1f4d8f12",
		),
	},
	IPv4: {
		label: i18n.t("pages:HealthPage.DERPPage.ipv4_b12b510b"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_an_ipv4_stun_round_trip_completed_succes_82fa63ad",
		),
	},
	IPv6CanSend: {
		label: i18n.t("pages:HealthPage.DERPPage.ipv6_send_0a8e1006"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_this_server_can_send_ipv6_packets_40959db0",
		),
	},
	IPv4CanSend: {
		label: i18n.t("pages:HealthPage.DERPPage.ipv4_send_5209dfd9"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_this_server_can_send_ipv4_packets_1164d92e",
		),
	},
	OSHasIPv6: {
		label: i18n.t("pages:HealthPage.DERPPage.os_ipv6_support_d2de614a"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_the_operating_system_supports_ipv6_31076960",
		),
	},
	ICMPv4: {
		label: i18n.t("pages:HealthPage.DERPPage.icmp_ping_23cc96e8"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_an_icmpv4_round_trip_completed_successfu_3610abe5",
		),
	},
	MappingVariesByDestIP: {
		label: i18n.t("pages:HealthPage.DERPPage.no_symmetric_nat_6a1427b4"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_stun_results_are_consistent_across_desti_e8abb539",
		),
		invert: true,
	},
	UPnP: {
		label: i18n.t("pages:HealthPage.DERPPage.upnp_90e86f63"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_universal_plug_and_play_was_detected_on__3e7d5c13",
		),
	},
	PMP: {
		label: i18n.t("pages:HealthPage.DERPPage.nat_pmp_e8c402cc"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_nat_port_mapping_protocol_was_detected_o_e3f8dd3a",
		),
	},
	PCP: {
		label: i18n.t("pages:HealthPage.DERPPage.pcp_ac8ab0f6"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_port_control_protocol_was_detected_on_th_b947022a",
		),
	},
	CaptivePortal: {
		label: i18n.t("pages:HealthPage.DERPPage.no_captive_portal_7674d64b"),
		description: i18n.t(
			"pages:HealthPage.DERPPage.whether_http_traffic_is_free_from_captive_portal_0f555171",
		),
		invert: true,
	},
};

interface FlagGroup {
	title: string;
	flags: BooleanKeys<NetcheckReport>[];
}

const flagGroups: FlagGroup[] = [
	{
		title: i18n.t("pages:HealthPage.DERPPage.connectivity_5479401f"),
		flags: ["UDP", "IPv4", "IPv6", "ICMPv4", "CaptivePortal"],
	},
	{
		title: i18n.t("pages:HealthPage.DERPPage.ipv6_support_e363c9d3"),
		flags: ["OSHasIPv6", "IPv4CanSend", "IPv6CanSend"],
	},
	{
		title: i18n.t("pages:HealthPage.DERPPage.nat_traversal_a3aafbb2"),
		flags: ["MappingVariesByDestIP"],
	},
	{
		title: i18n.t("pages:HealthPage.DERPPage.port_mapping_ec8f65f9"),
		flags: ["UPnP", "PMP", "PCP"],
	},
];

const severityColor = (severity: HealthSeverity): string => {
	switch (severity) {
		case "ok":
			return "text-content-success";
		case "warning":
			return "text-content-warning";
		case "error":
			return "text-content-destructive";
		default:
			return "";
	}
};

const DERPPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	const { derp } = useOutletContext<HealthcheckReport>();
	const { netcheck, regions, netcheck_logs: logs } = derp;
	const safeNetcheck = netcheck || ({} as NetcheckReport);

	return (
		<>
			<title>
				{pageTitle(tI18n("HealthPage.DERPPage.derp_health_afbf5114"))}
			</title>
			<Header>
				<HeaderTitle>
					<HealthyDot severity={derp.severity as HealthSeverity} />
					DERP
				</HeaderTitle>
				<MuteWarningsButton healthcheck="DERP" />
			</Header>
			<Main>
				{derp.warnings.map((warning) => {
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
					<SectionLabel>
						{tI18n("HealthPage.DERPPage.network_checks_cabecdf1")}
					</SectionLabel>
					{flagGroups.map((group) => (
						<div key={group.title} className="mb-6">
							<h5 className="text-xs uppercase tracking-wide text-content-secondary m-0 mb-2">
								{group.title}
							</h5>
							<Table>
								<TableBody>
									{group.flags.map((flag) => (
										<TableRow key={flag}>
											<TableCell className="w-8">
												<StatusIcon
													value={
														safeNetcheck[flag] === null
															? null
															: flagDescriptions[flag].invert
																? !safeNetcheck[flag]
																: safeNetcheck[flag]
													}
												/>
											</TableCell>
											<TableCell className="font-medium whitespace-nowrap w-36">
												{flagDescriptions[flag].label}
											</TableCell>
											<TableCell className="text-content-secondary">
												{flagDescriptions[flag].description}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					))}
				</section>

				<section>
					<SectionLabel>
						{tI18n("HealthPage.DERPPage.regions_610c65d8")}
					</SectionLabel>
					<div className="flex flex-wrap gap-3">
						{Object.values(regions ?? {})
							.filter((region) => {
								// Values can technically be null
								return region !== null;
							})
							.sort((a, b) => {
								if (a.region && b.region) {
									return a.region.RegionName.localeCompare(b.region.RegionName);
								}
								return 0;
							})
							.map(({ severity, region }) => {
								if (!region) {
									return null;
								}
								return (
									<Button variant="outline" key={region.RegionID} asChild>
										<Link to={`/health/derp/regions/${region.RegionID}`}>
											<MapPinIcon
												className={severityColor(severity as HealthSeverity)}
											/>
											{region.RegionName}
										</Link>
									</Button>
								);
							})}
					</div>
				</section>
				<section>
					<SectionLabel>
						{tI18n("HealthPage.DERPPage.logs_ea2100dc")}
					</SectionLabel>
					<Logs
						lines={logs}
						className="rounded-lg border border-solid border-border text-content-secondary"
					/>
				</section>
			</Main>
		</>
	);
};

export default DERPPage;
