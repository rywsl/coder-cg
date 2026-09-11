import {
	CircleUserIcon,
	CopyIcon,
	LogOutIcon,
	MonitorIcon,
	SquareArrowOutUpRightIcon,
	TerminalIcon,
} from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { CheckIcon } from "#/components/AnimatedIcons/Check";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "#/components/DropdownMenu/DropdownMenu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useClipboard } from "#/hooks/useClipboard";
import { supportsCoderDesktop } from "#/utils/platform";
import { SupportIcon } from "../SupportIcon";

const CODER_DESKTOP_DOCS_URL = "https://coder.com/docs/user-guides/desktop";

const CodernautsSVG = () => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M7,10 L5,15 L19,15 L17,10 Z" />
		<path d="M8,10 L9,7 L11,5 L13,5 L15,7 L16,10" />
		<line x1="6" y1="15" x2="4" y2="19" />
		<line x1="2" y1="19" x2="6" y2="19" />
		<line x1="18" y1="15" x2="20" y2="19" />
		<line x1="18" y1="19" x2="22" y2="19" />
		<path d="M10,15 L10.5,18 L13.5,18 L14,15" />
	</svg>
);

interface UserDropdownContentProps {
	user: TypesGen.User;
	buildInfo?: TypesGen.BuildInfoResponse;
	/** Extra content for the profile area, rendered below the profile link
	 * (e.g. AI spend). The consumer supplies its own separator if needed. */
	profileExtra?: ReactNode;
	supportLinks: readonly TypesGen.LinkConfig[];
	codernautsEnabled?: boolean;
	onSignOut: () => void;
}

export const UserDropdownContent: FC<UserDropdownContentProps> = ({
	user,
	buildInfo,
	profileExtra,
	supportLinks,
	codernautsEnabled = true,
	onSignOut,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	const { showCopiedSuccess, copyToClipboard } = useClipboard();

	return (
		<>
			<DropdownMenuItem className="flex items-center gap-3" asChild>
				<Link to="/settings/account">
					<div className="flex flex-col">
						<span className="text-content-primary">{user.username}</span>
						<span className="text-xs font-semibold">{user.email}</span>
					</div>
				</Link>
			</DropdownMenuItem>
			{profileExtra}
			<DropdownMenuSeparator />
			{supportsCoderDesktop() && (
				<DropdownMenuItem asChild>
					<a href={CODER_DESKTOP_DOCS_URL} target="_blank" rel="noreferrer">
						<MonitorIcon />
						<span>
							{tI18n(
								"dashboard.Navbar.UserDropdown.UserDropdownContent.install_coder_desktop_ca1c606f",
							)}
						</span>
					</a>
				</DropdownMenuItem>
			)}
			<DropdownMenuItem asChild>
				<Link to="/install">
					<TerminalIcon />
					<span>
						{tI18n(
							"dashboard.Navbar.UserDropdown.UserDropdownContent.install_cli_d7ca5fdd",
						)}
					</span>
				</Link>
			</DropdownMenuItem>
			<DropdownMenuItem asChild>
				<Link to="/settings/account">
					<CircleUserIcon />
					<span>
						{tI18n(
							"dashboard.Navbar.UserDropdown.UserDropdownContent.account_7e1b0d56",
						)}
					</span>
				</Link>
			</DropdownMenuItem>
			<DropdownMenuItem onClick={onSignOut}>
				<LogOutIcon />
				<span>
					{tI18n(
						"dashboard.Navbar.UserDropdown.UserDropdownContent.sign_out_0b184bc5",
					)}
				</span>
			</DropdownMenuItem>
			{supportLinks && supportLinks.length > 0 && (
				<>
					<DropdownMenuSeparator />
					{supportLinks.map((link) => (
						<DropdownMenuItem key={link.name} asChild>
							<a href={link.target} target="_blank" rel="noreferrer">
								{link.icon && <SupportIcon icon={link.icon} />}
								<span>{link.name}</span>
							</a>
						</DropdownMenuItem>
					))}
				</>
			)}
			{codernautsEnabled && (
				<DropdownMenuItem asChild>
					<Link to="/coder-cup">
						<CodernautsSVG />
						<span>
							{tI18n(
								"dashboard.Navbar.UserDropdown.UserDropdownContent.codernauts_99dc05b5",
							)}
						</span>
					</Link>
				</DropdownMenuItem>
			)}
			<DropdownMenuSeparator />
			<Tooltip disableHoverableContent>
				<TooltipTrigger asChild>
					<DropdownMenuItem className="text-xs" asChild>
						<a
							href={buildInfo?.external_url}
							className="flex items-center gap-2"
							target="_blank"
							rel="noreferrer"
						>
							<span className="flex-1">{buildInfo?.version}</span>
							<SquareArrowOutUpRightIcon className="size-icon-xs!" />
						</a>
					</DropdownMenuItem>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					{tI18n(
						"dashboard.Navbar.UserDropdown.UserDropdownContent.browse_the_source_code_b765c028",
					)}
				</TooltipContent>
			</Tooltip>
			{buildInfo?.deployment_id && (
				<Tooltip disableHoverableContent>
					<TooltipTrigger asChild>
						<DropdownMenuItem
							className="text-xs"
							onSelect={(e) => {
								e.preventDefault();
								copyToClipboard(buildInfo.deployment_id);
							}}
						>
							<span className="truncate flex-1">{buildInfo.deployment_id}</span>
							{showCopiedSuccess ? (
								<CheckIcon className="size-icon-xs! ml-auto" />
							) : (
								<CopyIcon className="size-icon-xs! ml-auto" />
							)}
						</DropdownMenuItem>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{showCopiedSuccess
							? tI18n(
									"dashboard.Navbar.UserDropdown.UserDropdownContent.copied_ea61bc15",
								)
							: tI18n(
									"dashboard.Navbar.UserDropdown.UserDropdownContent.copy_deployment_id_c69dbc76",
								)}
					</TooltipContent>
				</Tooltip>
			)}
			<DropdownMenuItem className="text-xs" disabled>
				<span>
					&copy; {new Date().getFullYear()}
					{tI18n(
						"dashboard.Navbar.UserDropdown.UserDropdownContent.coder_technologies_inc_6f4648e4",
					)}
				</span>
			</DropdownMenuItem>
		</>
	);
};
