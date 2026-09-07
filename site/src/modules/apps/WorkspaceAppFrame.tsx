import { cn } from "cn";
import {
	EllipsisVerticalIcon,
	ExternalLinkIcon,
	HouseIcon,
} from "lucide-react";
import { type ComponentProps, type FC, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { Workspace } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Spinner } from "#/components/Spinner/Spinner";
import { useProxy } from "#/contexts/ProxyContext";
import { isAppBlockedByMissingWildcard } from "./apps";
import { useAppLink } from "./useAppLink";
import { WorkspaceWildcardWarning } from "./WorkspaceWildcardWarning";
import type { WorkspaceAppWithAgent } from "./workspaceApps";

type WorkspaceAppFrameProps = {
	workspace: Workspace;
	app: WorkspaceAppWithAgent;
	// Keep the iframe mounted while hidden so callers can preserve app state.
	active: boolean;
};

export const WorkspaceAppFrame: FC<WorkspaceAppFrameProps> = ({
	workspace,
	app,
	active,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const link = useAppLink(app, {
		agent: app.agent,
		workspace,
	});
	const proxy = useProxy();
	const frameRef = useRef<HTMLIFrameElement>(null);
	const shouldDisplayWildcardWarning = isAppBlockedByMissingWildcard(
		app,
		proxy.proxy?.preferredWildcardHostname,
	);
	// The "preview" app renders a navigation toolbar above its iframe.
	const showToolbar = app.slug === "preview";

	if (shouldDisplayWildcardWarning) {
		return (
			<div className="h-full flex items-center justify-center pb-4">
				<WorkspaceWildcardWarning />
			</div>
		);
	}

	return (
		<div className={cn([active ? "flex" : "hidden", "w-full h-full flex-col"])}>
			{showToolbar && (
				<div className="bg-surface-tertiary flex items-center p-2 py-1 gap-1">
					<Button
						size="icon"
						variant="subtle"
						onClick={(e) => {
							e.preventDefault();
							if (link.href && frameRef.current?.contentWindow) {
								frameRef.current.contentWindow.location.href = link.href;
							}
						}}
					>
						<HouseIcon />
						<span className="sr-only">
							{tI18n("apps.WorkspaceAppFrame.home_3a786953")}
						</span>
					</Button>

					<div className="w-full" />

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="icon"
								variant="subtle"
								aria-label={tI18n(
									"apps.WorkspaceAppFrame.more_options_bc79cdff",
								)}
							>
								<EllipsisVerticalIcon aria-hidden="true" />
								<span className="sr-only">
									{tI18n("apps.WorkspaceAppFrame.more_options_bc79cdff")}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<RouterLink
									to={link.href ?? ""}
									target="_blank"
									rel="noreferrer"
								>
									<ExternalLinkIcon />
									{tI18n("apps.WorkspaceAppFrame.open_app_in_new_tab_afeffd83")}
								</RouterLink>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
			{app.health === "healthy" || app.health === "disabled" ? (
				<WorkspaceIframe ref={frameRef} src={link.href} title={link.label} />
			) : app.health === "unhealthy" ? (
				<div className="w-full h-full flex flex-col items-center justify-center p-4">
					<h3 className="m-0 font-medium text-content-primary text-base text-center">
						{tI18n("apps.WorkspaceAppFrame.app_7d981419")}
						{app.display_name}
						{tI18n("apps.WorkspaceAppFrame.is_unhealthy_a275e158")}
					</h3>
					<div className="text-content-secondary text-sm">
						<span className="block text-center">
							{tI18n(
								"apps.WorkspaceAppFrame.here_are_some_troubleshooting_steps_you_can_take_23bb194b",
							)}
						</span>
						<ul className="m-0 pt-4 flex flex-col gap-4">
							{app.healthcheck && (
								<li>
									<span className="block font-medium text-content-primary mb-1">
										{tI18n(
											"apps.WorkspaceAppFrame.verify_healthcheck_d521d0a9",
										)}
									</span>
									{tI18n(
										"apps.WorkspaceAppFrame.try_running_the_following_inside_your_workspace_7b03376c",
									)}{" "}
									<code className="font-mono text-content-primary select-all">
										curl -v "{app.healthcheck.url}"
									</code>
								</li>
							)}
							<li>
								<span className="block font-medium text-content-primary mb-1">
									{tI18n("apps.WorkspaceAppFrame.check_logs_ed855f3d")}
								</span>
								{tI18n("apps.WorkspaceAppFrame.see_6863067e")}{" "}
								<code className="font-mono text-content-primary select-all">
									/tmp/coder-agent.log
								</code>{" "}
								{tI18n("apps.WorkspaceAppFrame.inside_your_workspace_f3cf38c9")}
								{workspace.name}
								{tI18n("apps.WorkspaceAppFrame.for_more_information_c761f7a6")}
							</li>
						</ul>
					</div>
				</div>
			) : app.health === "initializing" ? (
				<div className="w-full h-full flex items-center justify-center">
					<Spinner loading />
				</div>
			) : (
				<div className="w-full h-full flex flex-col items-center justify-center">
					<h3 className="m-0 font-medium text-content-primary text-base">
						{tI18n("apps.WorkspaceAppFrame.error_54a0e8c1")}
					</h3>
					<span className="text-content-secondary text-sm">
						{tI18n(
							"apps.WorkspaceAppFrame.the_app_is_in_an_unknown_health_state_c4b0f3e5",
						)}
					</span>
				</div>
			)}
		</div>
	);
};

type WorkspaceIframeProps = ComponentProps<"iframe">;

export const WorkspaceIframe: FC<WorkspaceIframeProps> = ({
	className,
	ref,
	...props
}) => {
	return (
		<iframe
			ref={ref}
			loading="eager"
			className={cn("w-full h-full border-0", className)}
			allow="clipboard-read; clipboard-write"
			{...props}
		/>
	);
};
