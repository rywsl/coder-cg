import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	AgentsUnsupportedProviderTypes,
	type AIProvider,
} from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { Badge } from "#/components/Badge/Badge";
import { TableCell, TableRow } from "#/components/Table/Table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { useClickableTableRow } from "#/hooks/useClickableTableRow";
import { ProviderIcon } from "./ProviderIcon";
import { getProviderDisplayType } from "./providerFormApiMap";

type ProviderRowProps = {
	provider: AIProvider;
	onClick?: () => void;
};

export const ProviderRow: React.FC<ProviderRowProps> = ({
	provider,
	onClick,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const clickableProps = useClickableTableRow({
		onClick: () => onClick?.(),
	});
	const displayName = provider.display_name || provider.name;
	const disabled = !provider.enabled;

	// Stop activation from bubbling to a parent `useClickableTableRow`
	// row, which navigates on click, Enter (onKeyDown), and Space
	// (onKeyUp). Radix composes its own click handler, so the tooltip
	// still opens.
	const stopPropagation = (event: React.SyntheticEvent) => {
		event.stopPropagation();
	};

	return (
		<TableRow key={provider.name} {...clickableProps}>
			<TableCell className="min-w-0 px-4 py-3">
				<AvatarData
					title={
						<span className="flex items-center gap-2">
							<span
								className={cn("truncate", disabled && "text-content-secondary")}
							>
								{displayName}
							</span>
							{disabled && (
								<Badge asChild size="sm" variant="default">
									<span>
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderRow.disabled_75081b59",
										)}
									</span>
								</Badge>
							)}
						</span>
					}
					avatar={
						<Avatar
							size="lg"
							className={cn(
								"flex shrink-0 items-center justify-center",
								disabled && "opacity-50 grayscale",
							)}
						>
							<ProviderIcon
								provider={getProviderDisplayType(provider)}
								icon={provider.icon}
							/>
						</Avatar>
					}
				/>
			</TableCell>
			<TableCell className="min-w-0">
				<span
					className={cn(
						"block truncate",
						disabled ? "text-content-disabled" : "text-content-secondary",
					)}
					title={provider.base_url}
				>
					{provider.base_url}
				</span>
			</TableCell>
			<TableCell>
				<div className="flex flex-wrap items-center gap-1">
					{AgentsUnsupportedProviderTypes.some((t) => t === provider.type) && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									asChild
									variant="info"
									onClick={stopPropagation}
									onKeyDown={stopPropagation}
									onKeyUp={stopPropagation}
								>
									<button type="button">
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderRow.not_supported_in_agents_95ba4b18",
										)}
									</button>
								</Badge>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								{tI18n(
									"AISettingsPage.ProvidersPage.components.ProviderRow.this_provider_works_with_the_ai_gateway_proxy_bu_9e1b028d",
								)}
							</TooltipContent>
						</Tooltip>
					)}
					{provider.status?.warnings && provider.status.warnings.length > 0 && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									asChild
									variant="warning"
									onClick={stopPropagation}
									onKeyDown={stopPropagation}
									onKeyUp={stopPropagation}
								>
									<button
										type="button"
										aria-label={tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderRow.warning_value0_06f7ca87",
											{
												value0: provider.status.warnings.join("; "),
											},
										)}
									>
										{tI18n(
											"AISettingsPage.ProvidersPage.components.ProviderRow.warning_e981ddae",
										)}
									</button>
								</Badge>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								{provider.status.warnings.map((warning) => (
									<p key={warning} className="break-words">
										{warning}
									</p>
								))}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</TableCell>
			<TableCell className="w-10 text-center">
				<div className="flex justify-end items-center gap-8 pr-4">
					<ChevronRightIcon
						aria-hidden
						className="size-icon-sm text-content-secondary shrink-0"
					/>
				</div>
			</TableCell>
		</TableRow>
	);
};
