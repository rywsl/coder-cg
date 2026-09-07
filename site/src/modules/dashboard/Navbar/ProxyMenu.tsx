import { RadioIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import type * as TypesGen from "#/api/typesGenerated";
import { Abbr } from "#/components/Abbr/Abbr";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { Latency } from "#/components/Latency/Latency";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import type { ProxyContextValue } from "#/contexts/ProxyContext";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { getLatencyColor } from "#/utils/latency";
import { sortProxiesByLatency } from "./proxyUtils";

interface ProxyMenuProps {
	proxyContextValue: ProxyContextValue;
}

export const ProxyMenu: FC<ProxyMenuProps> = ({ proxyContextValue }) => {
	const { t: tI18n } = useTranslation("dashboard");

	const [open, setOpen] = useState(false);
	const [refetchDate, setRefetchDate] = useState<Date>();
	const selectedProxy = proxyContextValue.proxy.proxy;
	const refreshLatencies = proxyContextValue.refetchProxyLatencies;
	const closeMenu = () => setOpen(false);
	const latencies = proxyContextValue.proxyLatencies;
	const isLoadingLatencies = Object.keys(latencies).length === 0;
	const isLoading = proxyContextValue.isLoading || isLoadingLatencies;
	const { permissions } = useAuthenticated();

	const proxyLatencyLoading = (proxy: TypesGen.Region): boolean => {
		if (!refetchDate) {
			// Only show loading if the user manually requested a refetch
			return false;
		}

		// Only show a loading spinner if:
		//  - A latency exists. This means the latency was fetched at some point, so
		//    the loader *should* be resolved.
		//  - The proxy is healthy. If it is not, the loader might never resolve.
		//  - The latency reported is older than the refetch date. This means the
		//    latency is stale and we should show a loading spinner until the new
		//    latency is fetched.
		const latency = latencies[proxy.id];
		return proxy.healthy && latency !== undefined && latency.at < refetchDate;
	};

	// This endpoint returns a 404 when not using enterprise.
	// If we don't return null, then it looks like this is
	// loading forever!
	if (proxyContextValue.error) {
		return null;
	}

	if (isLoading) {
		return (
			<Skeleton
				width="110px"
				height={40}
				className="rounded-[6px] transform-none"
			/>
		);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="lg">
					<span className="sr-only">
						{tI18n("dashboard.Navbar.ProxyMenu.latency_for_82129a3e")}
						{selectedProxy?.display_name ??
							tI18n("dashboard.Navbar.ProxyMenu.your_region_927d4d96")}
					</span>

					{selectedProxy ? (
						<>
							<RadioIcon
								aria-hidden="true"
								className={getLatencyColor(
									proxyLatencyLoading(selectedProxy)
										? undefined
										: latencies?.[selectedProxy.id]?.latencyMS,
								)}
							/>

							<Latency
								className={
									latencies?.[selectedProxy.id]?.latencyMS
										? "text-content-primary"
										: undefined
								}
								latency={latencies?.[selectedProxy.id]?.latencyMS}
								isLoading={proxyLatencyLoading(selectedProxy)}
							/>
						</>
					) : (
						tI18n("dashboard.Navbar.ProxyMenu.select_proxy_02b1bace")
					)}

					<ChevronDownIcon className="text-content-primary" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				{proxyContextValue.proxies && proxyContextValue.proxies.length > 1 && (
					<DropdownMenuItem
						disabled
						className="flex flex-col gap-1 items-start data-disabled:opacity-100"
					>
						<div className="text-content-primary font-semibold text-left">
							{tI18n(
								"dashboard.Navbar.ProxyMenu.select_a_region_nearest_to_you_5f2d9fac",
							)}
						</div>
						<div className="text-xs text-content-secondary leading-relaxed">
							{tI18n(
								"dashboard.Navbar.ProxyMenu.workspace_proxies_improve_terminal_and_web_app_c_6f88285e",
							)}{" "}
							<Abbr
								title={tI18n(
									"dashboard.Navbar.ProxyMenu.command_line_interface_db96c4f5",
								)}
								pronunciation="initialism"
							>
								CLI
							</Abbr>{" "}
							{tI18n(
								"dashboard.Navbar.ProxyMenu.connections_are_unaffected_if_no_region_is_selec_2c8404d5",
							)}
						</div>
					</DropdownMenuItem>
				)}

				{proxyContextValue.proxies && proxyContextValue.proxies.length > 1 && (
					<DropdownMenuSeparator />
				)}

				{proxyContextValue.proxies && (
					<div className="max-h-[calc(100vh-22rem)] -mr-2 pr-2 overflow-y-auto scrollbar-thin [scrollbar-color:hsl(var(--surface-quaternary))_transparent]">
						<DropdownMenuRadioGroup value={selectedProxy?.id}>
							{sortProxiesByLatency(proxyContextValue.proxies, latencies).map(
								(proxy) => (
									<DropdownMenuRadioItem
										value={proxy.id}
										key={proxy.id}
										onClick={(e) => {
											e.preventDefault();
											if (!proxy.healthy) {
												toast.error(
													tI18n(
														"dashboard.Navbar.ProxyMenu.failed_to_select_proxy_value0_d7077442",
														{
															value0: proxy.display_name,
														},
													),
													{
														description: tI18n(
															"dashboard.Navbar.ProxyMenu.please_select_a_healthy_workspace_proxy_25ba0ed8",
														),
													},
												);
												closeMenu();
												return;
											}

											proxyContextValue.setProxy(proxy);
											closeMenu();
										}}
									>
										<div className="flex gap-3 items-center w-full">
											<div className="leading-none size-4">
												<ExternalImage
													src={proxy.icon_url}
													alt=""
													className="object-contain size-full"
												/>
											</div>

											{proxy.display_name}

											<Latency
												className="ml-auto"
												latency={latencies?.[proxy.id]?.latencyMS}
												isLoading={proxyLatencyLoading(proxy)}
											/>
										</div>
									</DropdownMenuRadioItem>
								),
							)}
						</DropdownMenuRadioGroup>
					</div>
				)}

				<DropdownMenuSeparator />

				{Boolean(permissions.editWorkspaceProxies) && (
					<DropdownMenuItem asChild>
						<Link to="/deployment/workspace-proxies">
							<span>
								{tI18n("dashboard.Navbar.ProxyMenu.proxy_settings_4529dd70")}
							</span>
						</Link>
					</DropdownMenuItem>
				)}

				<DropdownMenuItem
					onClick={(e) => {
						e.preventDefault();
						const refetchDate = refreshLatencies();
						setRefetchDate(refetchDate);
					}}
				>
					{tI18n("dashboard.Navbar.ProxyMenu.refresh_latencies_ba8f2209")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
