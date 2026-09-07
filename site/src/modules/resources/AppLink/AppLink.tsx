import {
	Building2Icon,
	CircleAlertIcon,
	GlobeIcon,
	type LucideIcon,
	SquareArrowOutUpRightIcon,
	UsersIcon,
} from "lucide-react";
import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { DropdownMenuItem } from "#/components/DropdownMenu/DropdownMenu";
import { Link } from "#/components/Link/Link";
import { Markdown } from "#/components/Markdown/Markdown";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useProxy } from "#/contexts/ProxyContext";
import {
	isAppBlockedByMissingWildcard,
	isAppUrlValid,
} from "#/modules/apps/apps";
import { useAppLink } from "#/modules/apps/useAppLink";
import { docs } from "#/utils/docs";
import { AgentButton } from "../AgentButton";
import { BaseIcon } from "./BaseIcon";

export const DisplayAppNameMap: Record<TypesGen.DisplayApp, string> = {
	port_forwarding_helper: "Ports",
	ssh_helper: "SSH",
	vscode: "VS Code Desktop",
	vscode_insiders: "VS Code Insiders",
	web_terminal: "Terminal",
};

interface AppLinkProps {
	workspace: TypesGen.Workspace;
	app: TypesGen.WorkspaceApp;
	agent: TypesGen.WorkspaceAgent;
	grouped?: boolean;
}

export const AppLink: FC<AppLinkProps> = ({
	app,
	workspace,
	agent,
	grouped,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const { proxy } = useProxy();
	const host = proxy.preferredWildcardHostname;
	const [iconError, setIconError] = useState(false);
	const link = useAppLink(app, { agent, workspace });

	// canClick is ONLY false when it's a subdomain app and the admin hasn't
	// enabled wildcard access URL or the session token is being fetched.
	//
	// To avoid bugs in the healthcheck code locking users out of apps, we no
	// longer block access to apps if they are unhealthy/initializing.
	let canClick = true;
	let primaryTooltip: ReactNode = "";
	let icon = !iconError && (
		<BaseIcon app={app} onIconPathError={() => setIconError(true)} />
	);

	if (app.health === "initializing") {
		icon = <Spinner loading />;
		primaryTooltip = tI18n("resources.AppLink.AppLink.initializing_6f191ff7");
	}

	if (app.health === "unhealthy") {
		icon = (
			<CircleAlertIcon
				aria-hidden="true"
				className="size-icon-sm text-content-warning"
			/>
		);
		primaryTooltip = tI18n("resources.AppLink.AppLink.unhealthy_317b1fbc");
	}

	if (isAppBlockedByMissingWildcard(app, host)) {
		canClick = false;
		icon = (
			<CircleAlertIcon
				aria-hidden="true"
				className="size-icon-sm text-content-secondary"
			/>
		);
		primaryTooltip = tI18n(
			"resources.AppLink.AppLink.your_admin_has_not_configured_subdomain_applicat_1091ca11",
		);
	}

	if (app.subdomain_name && app.subdomain_name.length > 63) {
		icon = (
			<CircleAlertIcon
				aria-hidden="true"
				className="size-icon-sm text-content-warning"
			/>
		);
		primaryTooltip = (
			<>
				{tI18n(
					"resources.AppLink.AppLink.port_forwarding_will_not_work_because_hostname_i_fa237ff3",
				)}{" "}
				<Link
					href={docs("/user-guides/workspace-access/port-forwarding#dashboard")}
					target="_blank"
					size="sm"
				>
					{tI18n("resources.AppLink.AppLink.documentation_caf9f906")}
				</Link>{" "}
				{tI18n("resources.AppLink.AppLink.for_more_details_4c7148e4")}
			</>
		);
	}

	if (!isAppUrlValid(app)) {
		canClick = false;
		icon = (
			<CircleAlertIcon
				aria-hidden="true"
				className="size-icon-sm text-content-warning"
			/>
		);
		primaryTooltip = (
			<>
				{tI18n(
					"resources.AppLink.AppLink.this_app_has_an_invalid_url_and_can_t_be_opened__005b2dad",
				)}
				<code>url</code>
				{tI18n("resources.AppLink.AppLink.in_the_template_s_52204cf4")}{" "}
				<code>coder_app</code>
				{tI18n("resources.AppLink.AppLink.configuration_2baa3a4a")}
			</>
		);
	}

	// The session token for external apps is minted on click, so key generation
	// no longer gates clickability. While a click is minting a token, show a
	// spinner to reflect the in-flight request.
	if (link.isLoading) {
		icon = <Spinner loading />;
	}

	if (
		agent.lifecycle_state === "starting" &&
		agent.startup_script_behavior === "blocking"
	) {
		canClick = false;
	}

	const canShare = app.sharing_level !== "owner";
	const { shareTooltip, shareIcon: ShareIcon } = canShare
		? app.external
			? {
					shareTooltip: tI18n(
						"resources.AppLink.AppLink.open_external_url_22f414a5",
					),
					shareIcon: SquareArrowOutUpRightIcon,
				}
			: shareDetails[app.sharing_level]
		: {
				shareTooltip: null,
				shareIcon: null,
			};

	// Token-minting external apps expose no navigable href (see useAppLink): the
	// URL is only complete after the on-click mint. Render them as a button so
	// they stay interactive. A bare anchor without href is styled and treated as
	// disabled by AgentButton, and middle-clicking one would otherwise launch
	// the custom protocol with an empty token.
	const opensViaClick = link.href === undefined;

	const content = (
		<>
			{icon}
			{link.label}
			{ShareIcon && <ShareIcon />}
		</>
	);

	const trigger = opensViaClick ? (
		<button
			type="button"
			onClick={link.onClick}
			disabled={!canClick || link.isLoading}
		>
			{content}
		</button>
	) : (
		<a
			href={canClick ? link.href : undefined}
			onClick={link.onClick}
			target={app.open_in === "tab" ? "_blank" : undefined}
			rel={app.open_in === "tab" ? "noreferrer" : undefined}
		>
			{content}
		</a>
	);

	const button = grouped ? (
		<DropdownMenuItem asChild>{trigger}</DropdownMenuItem>
	) : (
		<AgentButton asChild>{trigger}</AgentButton>
	);

	if (primaryTooltip || app.tooltip) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent className="max-w-xs">
					{primaryTooltip ? (
						primaryTooltip
					) : app.tooltip ? (
						<Markdown className="text-content-secondary prose-sm font-medium">
							{app.tooltip}
						</Markdown>
					) : null}
					{shareTooltip}
				</TooltipContent>
			</Tooltip>
		);
	}

	return button;
};

const shareDetails: {
	[SharingLevel in TypesGen.WorkspaceAppSharingLevel as Exclude<
		SharingLevel,
		"owner"
	>]: { shareTooltip: string; shareIcon: LucideIcon };
} = {
	authenticated: {
		shareTooltip: "Shared with all authenticated users",
		shareIcon: UsersIcon,
	},
	organization: {
		shareTooltip: "Shared with organization members",
		shareIcon: Building2Icon,
	},
	public: {
		shareTooltip: "Shared publicly",
		shareIcon: GlobeIcon,
	},
};
