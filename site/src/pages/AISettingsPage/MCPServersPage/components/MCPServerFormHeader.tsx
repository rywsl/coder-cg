import { cn } from "cn";
import { ArrowLeftIcon, Share2Icon } from "lucide-react";
import { type FC, useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import { Switch } from "#/components/Switch/Switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { MCPServerIcon } from "./MCPServerIcon";

const MCPServerFormBackLink: FC<{ to: string }> = ({ to }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<Link to={to} className="-ml-3">
			<Button variant="subtle" type="button">
				<ArrowLeftIcon />
				<span>
					{tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.back_to_mcp_servers_fedbfb01",
					)}
				</span>
			</Button>
		</Link>
	);
};

interface MCPServerFormHeaderProps {
	server?: TypesGen.MCPServerConfig;
	title: string;
	iconUrl: string;
	listPath?: string;
	isEditing: boolean;
	isDisabled: boolean;
	onRequestDelete?: () => void;
	onShareServer?: () => void;
	onToggleEnabled?: (enabled: boolean) => void;
}

export const MCPServerFormHeader: FC<MCPServerFormHeaderProps> = ({
	server,
	title,
	iconUrl,
	listPath,
	isEditing,
	isDisabled,
	onRequestDelete,
	onShareServer,
	onToggleEnabled,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const disabledReasonId = useId();
	const lacksUpdatePermission = isEditing && server && !onToggleEnabled;

	return (
		<>
			<div className="flex items-center justify-between">
				{listPath && <MCPServerFormBackLink to={listPath} />}
				{isEditing && server && (onShareServer || onRequestDelete) && (
					<div className="flex items-center gap-2">
						{onShareServer && (
							<Button
								type="button"
								variant="outline"
								disabled={isDisabled}
								onClick={onShareServer}
							>
								<Share2Icon />
								<span>
									{tI18n(
										"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.manage_permissions_2630ba4d",
									)}
								</span>
							</Button>
						)}
						{onRequestDelete && (
							<Button
								type="button"
								variant="destructive"
								disabled={isDisabled}
								onClick={onRequestDelete}
							>
								<span>
									{tI18n(
										"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.delete_e2d0a549",
									)}
								</span>
							</Button>
						)}
					</div>
				)}
			</div>
			<div className="flex items-center gap-4 pt-6 min-w-0">
				{isEditing && (
					<MCPServerIcon iconUrl={iconUrl} name={title} className="size-12" />
				)}
				<SettingsHeaderTitle>
					<span
						className={cn(
							"block min-w-0 truncate",
							server?.enabled === false && "text-content-secondary",
						)}
					>
						{title}
					</span>
				</SettingsHeaderTitle>
				{isEditing && server && !server.enabled && (
					<Badge variant="default">
						{tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.disabled_75081b59",
						)}
					</Badge>
				)}
			</div>
			{isEditing && server && (
				<div className="flex items-center justify-between w-full pt-6">
					<p className="text-sm text-content-secondary m-0">
						{tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.disabled_servers_are_hidden_from_agents_8c281def",
						)}
					</p>
					<div className="flex shrink-0 items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex">
									<Switch
										checked={server.enabled}
										onCheckedChange={(checked) => {
											onToggleEnabled?.(checked);
										}}
										disabled={isDisabled}
										aria-disabled={lacksUpdatePermission}
										aria-label={tI18n(
											"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.server_enabled_641f0e75",
										)}
										aria-describedby={
											lacksUpdatePermission ? disabledReasonId : undefined
										}
										className="aria-disabled:cursor-not-allowed aria-disabled:data-[state=checked]:bg-surface-tertiary aria-disabled:data-[state=unchecked]:bg-surface-tertiary"
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{lacksUpdatePermission
									? tI18n(
											"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.you_do_not_have_permission_to_update_this_server_90fa7d7a",
										)
									: server.enabled
										? tI18n(
												"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.disable_this_server_it_will_be_hidden_from_agent_6f45e565",
											)
										: tI18n(
												"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.enable_this_server_it_will_be_visible_to_agents_bc06d4d3",
											)}
							</TooltipContent>
						</Tooltip>
						{lacksUpdatePermission && (
							<span id={disabledReasonId} className="sr-only">
								{tI18n(
									"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.you_do_not_have_permission_to_update_this_server_90fa7d7a",
								)}
							</span>
						)}
						<span className="text-sm">
							{tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormHeader.enable_5342e09f",
							)}
						</span>
					</div>
				</div>
			)}
		</>
	);
};
