import { InfoIcon, NetworkIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import userAgentParser from "ua-parser-js";
import type { ConnectionLog } from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Link } from "#/components/Link/Link";
import { StatusBadge } from "#/components/StatusBadge/StatusBadge";
import { TableCell } from "#/components/Table/Table";
import { TimelineEntry } from "#/components/Timeline/TimelineEntry";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { currentIntlLocale } from "#/i18n/locale";
import { connectionTypeIsWeb } from "#/utils/connection";
import { ConnectionLogDescription } from "./ConnectionLogDescription/ConnectionLogDescription";

interface ConnectionLogRowProps {
	connectionLog: ConnectionLog;
}

export const ConnectionLogRow: FC<ConnectionLogRowProps> = ({
	connectionLog,
}) => {
	const { t: tI18n } = useTranslation("pages");

	const userAgent = connectionLog.web_info?.user_agent
		? userAgentParser(connectionLog.web_info?.user_agent)
		: undefined;
	const isWeb = connectionTypeIsWeb(connectionLog.type);
	const code =
		connectionLog.web_info?.status_code ?? connectionLog.ssh_info?.exit_code;

	return (
		<TimelineEntry
			key={connectionLog.id}
			data-testid={`connection-log-row-${connectionLog.id}`}
			clickable={false}
		>
			<TableCell className="p-0! border-0">
				<div className="flex flex-row items-center gap-4 py-4 px-8">
					<div className="flex flex-row items-center gap-4 flex-1">
						{/* Non-web logs don't have an associated user, so we
						 * display a default network icon instead */}
						{connectionLog.web_info?.user ? (
							<Avatar
								fallback={connectionLog.web_info.user.username}
								src={connectionLog.web_info.user.avatar_url}
							/>
						) : (
							<Avatar>
								<NetworkIcon className="h-full w-full p-1" />
							</Avatar>
						)}

						<div className="flex flex-row items-center justify-between w-full">
							<div className="flex flex-row items-baseline gap-2 text-base">
								<ConnectionLogDescription connectionLog={connectionLog} />
								<span className="text-content-secondary text-xs">
									{new Date(connectionLog.connect_time).toLocaleTimeString(
										currentIntlLocale(),
									)}
									{connectionLog.ssh_info?.disconnect_time &&
										tI18n(
											"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.value0_9cd15df5",
											{
												value0: new Date(
													connectionLog.ssh_info.disconnect_time,
												).toLocaleTimeString(currentIntlLocale()),
											},
										)}
								</span>
							</div>

							<div className="flex flex-row items-center gap-4">
								{code !== undefined && (
									<StatusBadge
										code={code}
										isHttpCode={isWeb}
										label={
											isWeb
												? tI18n(
														"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.http_status_code_7ca7e69c",
													)
												: tI18n(
														"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.ssh_exit_code_23251ab9",
													)
										}
									/>
								)}
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className="size-icon-sm text-content-secondary" />
									</TooltipTrigger>
									<TooltipContent side="bottom">
										<div className="flex flex-col gap-2">
											{connectionLog.ip && (
												<div>
													<h4 className="m-0 text-content-primary text-sm leading-[150%] font-semibold">
														{tI18n(
															"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.ip_9efec746",
														)}
													</h4>
													<div>{connectionLog.ip}</div>
												</div>
											)}
											{userAgent?.os.name && (
												<div>
													<h4 className="m-0 text-content-primary text-sm leading-[150%] font-semibold">
														{tI18n(
															"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.os_049f4de9",
														)}
													</h4>
													<div>{userAgent.os.name}</div>
												</div>
											)}
											{userAgent?.browser.name && (
												<div>
													<h4 className="m-0 text-content-primary text-sm leading-[150%] font-semibold">
														{tI18n(
															"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.browser_875ac3ed",
														)}
													</h4>
													<div>
														{userAgent.browser.name} {userAgent.browser.version}
													</div>
												</div>
											)}
											{connectionLog.organization && (
												<div>
													<h4 className="m-0 text-content-primary text-sm leading-[150%] font-semibold">
														{tI18n(
															"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.organization_5300e286",
														)}
													</h4>
													<Link
														asChild
														showExternalIcon={false}
														className="px-0 text-xs"
													>
														<RouterLink
															to={`/organizations/${connectionLog.organization.name}`}
														>
															{connectionLog.organization.display_name ||
																connectionLog.organization.name}
														</RouterLink>
													</Link>
												</div>
											)}
											{connectionLog.ssh_info?.disconnect_reason && (
												<div>
													<h4 className="m-0 text-content-primary text-sm leading-[150%] font-semibold">
														{tI18n(
															"ConnectionLogPage.ConnectionLogRow.ConnectionLogRow.close_reason_2e49ef84",
														)}
													</h4>
													<div>{connectionLog.ssh_info?.disconnect_reason}</div>
												</div>
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</div>
				</div>
			</TableCell>
		</TimelineEntry>
	);
};
