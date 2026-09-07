import { cn } from "cn";
import { InfoIcon, NetworkIcon } from "lucide-react";
import { type FC, type KeyboardEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import userAgentParser from "ua-parser-js";
import type { AuditLog, BuildReason } from "#/api/typesGenerated";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Avatar } from "#/components/Avatar/Avatar";
import {
	Collapsible,
	CollapsibleContent,
} from "#/components/Collapsible/Collapsible";
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
import { buildReasonLabels } from "#/utils/workspace";
import { AuditLogDescription } from "./AuditLogDescription/AuditLogDescription";
import { AuditLogDiff } from "./AuditLogDiff/AuditLogDiff";
import { determineGroupDiff } from "./AuditLogDiff/auditUtils";

interface AuditLogRowProps {
	auditLog: AuditLog;
	// Useful for Storybook
	defaultIsDiffOpen?: boolean;
	showOrgDetails: boolean;
}

export const AuditLogRow: FC<AuditLogRowProps> = ({
	auditLog,
	defaultIsDiffOpen = false,
	showOrgDetails,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [isDiffOpen, setIsDiffOpen] = useState(defaultIsDiffOpen);
	const diffs = Object.entries(auditLog.diff);
	const shouldDisplayDiff = diffs.length > 0;
	const userAgent = auditLog.user_agent
		? userAgentParser(auditLog.user_agent)
		: undefined;

	let auditDiff = auditLog.diff;

	// groups have nested diffs (group members)
	if (auditLog.resource_type === "group") {
		auditDiff = determineGroupDiff(auditLog.diff);
	}

	const toggle = () => {
		if (shouldDisplayDiff) {
			setIsDiffOpen((v) => !v);
		}
	};

	return (
		<TimelineEntry
			key={auditLog.id}
			data-testid={`audit-log-row-${auditLog.id}`}
			clickable={shouldDisplayDiff}
		>
			<TableCell className="p-0! border-0 border-t text-base">
				<Collapsible open={isDiffOpen} onOpenChange={setIsDiffOpen}>
					<div
						className={cn(
							"flex flex-row items-center gap-4 py-4 px-8",
							shouldDisplayDiff && "cursor-pointer",
						)}
						{...(shouldDisplayDiff && {
							tabIndex: 0,
							role: "button",
							"aria-expanded": isDiffOpen,
							onClick: toggle,
							onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									toggle();
								}
							},
						})}
					>
						<div className="flex flex-row items-center gap-4 flex-1">
							<div className="flex flex-row items-center gap-4 w-full">
								{/*
								 * Session logs don't have an associated user to the log,
								 * so when it happens we display a default icon to represent non user actions
								 */}
								{auditLog.user ? (
									<Avatar
										fallback={auditLog.user.username}
										src={auditLog.user.avatar_url}
									/>
								) : (
									<Avatar>
										<NetworkIcon className="h-full w-full p-1" />
									</Avatar>
								)}

								<div className="flex flex-row items-baseline justify-between w-full font-normal gap-4">
									<div className="flex flex-row items-baseline gap-2">
										<AuditLogDescription auditLog={auditLog} />
										{auditLog.is_deleted && (
											<span className="text-xs text-content-secondary">
												{tI18n(
													"AuditPage.AuditLogRow.AuditLogRow.deleted_ce28beb7",
												)}
											</span>
										)}
										<span className="text-content-secondary text-xs">
											{new Date(auditLog.time).toLocaleTimeString(
												currentIntlLocale(),
											)}
										</span>
									</div>

									<div className="flex flex-row items-center gap-4">
										<StatusBadge isHttpCode code={auditLog.status_code} />

										{/* With multi-org, there is not enough space so show
                      everything in a tooltip. */}
										{showOrgDetails ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<InfoIcon className="size-icon-sm text-content-secondary" />
												</TooltipTrigger>
												<TooltipContent side="bottom">
													<div className="flex flex-col gap-2">
														{auditLog.ip && (
															<div>
																<h4 className="m-0 text-content-primary leading-[150%] font-semibold">
																	{tI18n(
																		"AuditPage.AuditLogRow.AuditLogRow.ip_9efec746",
																	)}
																</h4>
																<div>{auditLog.ip}</div>
															</div>
														)}
														{userAgent?.os.name && (
															<div>
																<h4 className="m-0 text-content-primary leading-[150%] font-semibold">
																	{tI18n(
																		"AuditPage.AuditLogRow.AuditLogRow.os_049f4de9",
																	)}
																</h4>
																<div>{userAgent.os.name}</div>
															</div>
														)}
														{userAgent?.browser.name && (
															<div>
																<h4 className="m-0 text-content-primary leading-[150%] font-semibold">
																	{tI18n(
																		"AuditPage.AuditLogRow.AuditLogRow.browser_875ac3ed",
																	)}
																</h4>
																<div>
																	{userAgent.browser.name}{" "}
																	{userAgent.browser.version}
																</div>
															</div>
														)}
														{auditLog.organization && (
															<div>
																<h4 className="m-0 text-content-primary leading-[150%] font-semibold">
																	{tI18n(
																		"AuditPage.AuditLogRow.AuditLogRow.organization_5300e286",
																	)}
																</h4>
																<Link
																	asChild
																	showExternalIcon={false}
																	className="px-0"
																>
																	<RouterLink
																		to={`/organizations/${auditLog.organization.name}`}
																	>
																		{auditLog.organization.display_name ||
																			auditLog.organization.name}
																	</RouterLink>
																</Link>
															</div>
														)}
														{auditLog.additional_fields?.build_reason &&
															auditLog.action === "start" && (
																<div>
																	<h4 className="m-0 text-content-primary leading-normal font-semibold">
																		{tI18n(
																			"AuditPage.AuditLogRow.AuditLogRow.reason_3425d108",
																		)}
																	</h4>
																	<div>
																		{
																			buildReasonLabels[
																				auditLog.additional_fields
																					.build_reason as BuildReason
																			]
																		}
																	</div>
																</div>
															)}
													</div>
												</TooltipContent>
											</Tooltip>
										) : (
											<div className="flex flex-row items-baseline gap-2">
												{auditLog.ip && (
													<span className="text-xs text-content-secondary block">
														<span>
															{tI18n(
																"AuditPage.AuditLogRow.AuditLogRow.ip_c30278e6",
															)}
														</span>
														<strong>{auditLog.ip}</strong>
													</span>
												)}
												{userAgent?.os.name && (
													<span className="text-xs text-content-secondary block">
														<span>
															{tI18n(
																"AuditPage.AuditLogRow.AuditLogRow.os_a8177235",
															)}
														</span>
														<strong>{userAgent.os.name}</strong>
													</span>
												)}
												{userAgent?.browser.name && (
													<span className="text-xs text-content-secondary block">
														<span>
															{tI18n(
																"AuditPage.AuditLogRow.AuditLogRow.browser_13071d40",
															)}
														</span>
														<strong>
															{userAgent.browser.name}{" "}
															{userAgent.browser.version}
														</strong>
													</span>
												)}
												{auditLog.additional_fields?.build_reason &&
													auditLog.action === "start" && (
														<span className="text-xs text-content-secondary block">
															<span>
																{tI18n(
																	"AuditPage.AuditLogRow.AuditLogRow.reason_4bc4df5f",
																)}
															</span>
															<strong>
																{
																	buildReasonLabels[
																		auditLog.additional_fields
																			.build_reason as BuildReason
																	]
																}
															</strong>
														</span>
													)}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{shouldDisplayDiff ? (
							<div className="size-6 flex items-center justify-center">
								<ChevronDownIcon open={isDiffOpen} />
							</div>
						) : (
							<div className="ml-6" />
						)}
					</div>

					{shouldDisplayDiff && (
						<CollapsibleContent>
							<AuditLogDiff diff={auditDiff} />
						</CollapsibleContent>
					)}
				</Collapsible>
			</TableCell>
		</TimelineEntry>
	);
};
