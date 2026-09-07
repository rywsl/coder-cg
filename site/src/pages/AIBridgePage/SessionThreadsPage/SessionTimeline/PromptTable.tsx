import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { AIBridgeModelIcon } from "#/pages/AIBridgePage/icons/AIBridgeModelIcon";
import { formatDate } from "#/utils/time";
import { TokenBadges } from "../../TokenBadges";

interface PromptTableProps {
	timestamp: Date;
	model: string;
	inputTokens: number;
	outputTokens: number;
	tokenUsageMetadata?: Record<string, unknown>;
	className?: string;
}

export const PromptTable: FC<PromptTableProps> = ({
	timestamp,
	model,
	inputTokens,
	outputTokens,
	tokenUsageMetadata,
	className,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<dl
			className={cn(
				"text-sm text-content-secondary font-normal m-0 flex flex-col gap-y-2 py-1",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.PromptTable.timestamp_115a2cc9",
					)}
				</dt>
				<dd
					className="ml-4 min-w-0 truncate font-mono text-xs"
					title={formatDate(timestamp)}
				>
					{formatDate(timestamp)}
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.PromptTable.model_5e2c614c",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate flex justify-end">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge className="gap-1.5 max-w-full min-w-0 overflow-hidden">
									<AIBridgeModelIcon model={model} className="size-icon-xs" />
									<span className="truncate min-w-0 flex-1">{model}</span>
								</Badge>
							</TooltipTrigger>
							<TooltipContent>{model}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</dd>
			</div>
			<div className="flex items-center justify-between">
				<dt className="shrink-0 whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.PromptTable.in_out_tokens_6ffefed3",
					)}
				</dt>
				<dd className="ml-4 min-w-0 truncate flex justify-end">
					<TokenBadges
						inputTokens={inputTokens}
						outputTokens={outputTokens}
						tokenUsageMetadata={tokenUsageMetadata}
					/>
				</dd>
			</div>
		</dl>
	);
};
