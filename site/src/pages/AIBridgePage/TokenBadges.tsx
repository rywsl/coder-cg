import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { currentIntlLocale } from "#/i18n/locale";
import { JsonPrettyPrinter } from "./JsonPrettyPrinter";
import { roundTokenDisplay } from "./utils";

interface TokenBadgesProps {
	inputTokens: number;
	outputTokens: number;
	tokenUsageMetadata?: Record<string, unknown>;
}

export const TokenBadges: FC<TokenBadgesProps> = ({
	inputTokens,
	outputTokens,
	tokenUsageMetadata,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="flex items-center whitespace-nowrap">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<span>
							<Badge className="gap-0.5 rounded-e-none">
								<ArrowDownIcon className="size-icon-xs shrink-0" />
								<span className="truncate min-w-0">
									{roundTokenDisplay(inputTokens)}
								</span>
							</Badge>
							<Badge className="gap-0.5 bg-surface-tertiary rounded-s-none">
								<ArrowUpIcon className="size-icon-xs shrink-0" />
								<span className="truncate min-w-0">
									{roundTokenDisplay(outputTokens)}
								</span>
							</Badge>
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<div className="grid grid-cols-2 gap-8">
							<div>
								<div className="flex items-center gap-1">
									<ArrowDownIcon className="size-icon-sm shrink-0" />
									<span className="text-content-primary text-sm">
										{tI18n("AIBridgePage.TokenBadges.input_tokens_dd856eeb")}
									</span>
								</div>
								<div className="flex items-center justify-between gap-4">
									<div className="text-sm text-content-secondary">
										{tI18n("AIBridgePage.TokenBadges.input_36ecb4f8")}
									</div>
									<div className="text-sm text-content-secondary">
										{inputTokens.toLocaleString(currentIntlLocale())}
									</div>
								</div>
							</div>

							<div>
								<div className="flex items-center gap-1">
									<ArrowUpIcon className="size-icon-sm shrink-0" />
									<span className="text-content-primary text-sm">
										{tI18n("AIBridgePage.TokenBadges.output_tokens_a9b50ea0")}
									</span>
								</div>
								<div className="flex items-center justify-between gap-4">
									<div className="text-sm text-content-secondary">
										{tI18n("AIBridgePage.TokenBadges.output_b2439bcb")}
									</div>
									<div className="text-sm text-content-secondary">
										{outputTokens.toLocaleString(currentIntlLocale())}
									</div>
								</div>
							</div>
						</div>
						{tokenUsageMetadata && (
							<>
								<div className="text-content-primary text-sm mt-4">
									{tI18n(
										"AIBridgePage.TokenBadges.token_usage_metadata_127ec70f",
									)}
								</div>
								<pre className="mt-2 mb-1 p-4 bg-surface-secondary rounded overflow-x-auto">
									<JsonPrettyPrinter
										input={JSON.stringify(tokenUsageMetadata)}
									/>
								</pre>
							</>
						)}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};
