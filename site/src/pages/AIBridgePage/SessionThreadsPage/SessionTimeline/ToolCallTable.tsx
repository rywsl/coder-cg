import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import { formatDate } from "#/utils/time";
import { TokenBadges } from "../../TokenBadges";

interface ToolCallTableProps {
	timestamp: Date;
	serverURL: string;
	inputTokens: number;
	outputTokens: number;
	tokenUsageMetadata?: Record<string, unknown>;
	className?: string;
}

export const ToolCallTable: FC<ToolCallTableProps> = ({
	timestamp,
	serverURL,
	inputTokens,
	outputTokens,
	tokenUsageMetadata,
	className,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div
			className={cn(
				className,
				"flex flex-col gap-2 text-sm text-content-secondary font-normal",
			)}
		>
			<div className="flex items-center justify-between whitespace-nowrap">
				<span className="pr-4 whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.ToolCallTable.in_out_tokens_6ffefed3",
					)}
				</span>
				<TokenBadges
					inputTokens={inputTokens}
					outputTokens={outputTokens}
					tokenUsageMetadata={tokenUsageMetadata}
				/>
			</div>
			<div className="flex items-center justify-between">
				<span className="pr-4 whitespace-nowrap">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.ToolCallTable.started_at_fe752875",
					)}
				</span>
				<span
					className="font-mono text-xs whitespace-nowrap truncate"
					title={formatDate(timestamp)}
				>
					{formatDate(timestamp)}
				</span>
			</div>
			{serverURL && (
				<div className="flex items-center justify-between">
					<span className="pr-4 whitespace-nowrap">
						{tI18n(
							"AIBridgePage.SessionThreadsPage.SessionTimeline.ToolCallTable.mcp_server_d938c816",
						)}
					</span>
					<span className="font-mono truncate">{serverURL}</span>
					<CopyButton
						text={serverURL}
						label={tI18n(
							"AIBridgePage.SessionThreadsPage.SessionTimeline.ToolCallTable.copy_mcp_server_url_bd08f2eb",
						)}
					/>
				</div>
			)}
		</div>
	);
};
