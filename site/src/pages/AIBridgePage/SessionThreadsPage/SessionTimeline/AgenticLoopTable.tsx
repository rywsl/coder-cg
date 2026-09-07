import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { roundDurationDisplay } from "../../utils";

interface AgenticLoopTableProps {
	duration: number; // in seconds
	toolCalls: number;
	className?: string;
}

export const AgenticLoopTable: FC<AgenticLoopTableProps> = ({
	duration,
	toolCalls,
	className,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div
			className={cn(
				"text-sm text-content-secondary font-normal flex flex-col gap-1",
				className,
			)}
		>
			<div className="flex items-center justify-between h-6">
				<span className="pr-4">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.AgenticLoopTable.tool_calls_da5122dc",
					)}
				</span>
				<span>{toolCalls}</span>
			</div>
			<div className="flex items-center justify-between h-6">
				<span className="pr-4">
					{tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.AgenticLoopTable.duration_4fc52a3c",
					)}
				</span>
				<span
					title={tI18n(
						"AIBridgePage.SessionThreadsPage.SessionTimeline.AgenticLoopTable.value0_ms_07bfdcc7",
						{
							value0: duration,
						},
					)}
				>
					{roundDurationDisplay(duration)}
				</span>
			</div>
		</div>
	);
};
