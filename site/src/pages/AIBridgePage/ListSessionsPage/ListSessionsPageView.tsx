import { InfoIcon } from "lucide-react";
import type { ComponentProps, FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import type { AIBridgeSession } from "#/api/typesGenerated";
import {
	PaginationContainer,
	type PaginationResult,
} from "#/components/PaginationWidget/PaginationContainer";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { PremiumPaywallAIGovernance } from "#/modules/paywall/PremiumPaywallAIGovernance";
import { DATE_FORMAT, formatDateTime } from "#/utils/time";
import { AIBridgeSetupAlert } from "../AIBridgeSetupAlert";
import { ListSessionsFilter } from "./ListSessionsFilter";
import { ListSessionsRow } from "./ListSessionsRow";

interface ListSessionsPageViewProps {
	isLoading: boolean;
	isFetching: boolean;
	isAISessionsEntitled: boolean;
	isAISessionsEnabled: boolean;
	sessions?: readonly AIBridgeSession[];
	sessionsQuery: PaginationResult;
	filterProps: ComponentProps<typeof ListSessionsFilter>;
	onSessionRowClick?: (sessionId: string) => void;
}

const ThreadTooltip: FC<PropsWithChildren> = ({ children }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent
					side="top"
					align="end"
					className="max-w-xs text-sm font-normal"
				>
					{tI18n(
						"AIBridgePage.ListSessionsPage.ListSessionsPageView.a_thread_is_a_multi_part_interaction_between_hum_a35cc1d8",
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export const ListSessionsPageView: FC<ListSessionsPageViewProps> = ({
	isLoading,
	isFetching,
	isAISessionsEntitled,
	isAISessionsEnabled,
	sessions,
	sessionsQuery,
	filterProps,
	onSessionRowClick,
}) => {
	const { t: tI18n } = useTranslation("agents");

	if (!isAISessionsEntitled) {
		return (
			<PremiumPaywallAIGovernance
				variant="sessions"
				source="aibridge_sessions"
			/>
		);
	}

	if (!isAISessionsEnabled) {
		return <AIBridgeSetupAlert />;
	}

	const utcOffset = formatDateTime(new Date(), DATE_FORMAT.UTC_OFFSET);

	return (
		<>
			<ListSessionsFilter {...filterProps} />
			<PaginationContainer query={sessionsQuery} paginationUnitLabel="sessions">
				<Table className="text-sm font-normal">
					<TableHeader>
						<TableRow>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.last_prompt_2cf8a798",
								)}
							</TableHead>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.user_b512d97e",
								)}
							</TableHead>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.provider_472590ae",
								)}
							</TableHead>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.client_0c77fe09",
								)}
							</TableHead>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.in_out_tokens_ba5f636c",
								)}
							</TableHead>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.network_requests_0b9921c8",
								)}
							</TableHead>
							<TableHead className="flex items-center flex-nowrap gap-1">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.threads_3e42e385",
								)}
								<ThreadTooltip>
									<InfoIcon className="size-icon-xs" />
								</ThreadTooltip>
							</TableHead>
							<TableHead className="text-nowrap">
								{tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.last_prompt_at_utc_e7f08c95",
								)}
								{utcOffset}]
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading || isFetching ? (
							<TableLoader />
						) : sessions?.length === 0 ? (
							<TableEmpty
								message={tI18n(
									"AIBridgePage.ListSessionsPage.ListSessionsPageView.no_session_logs_available_50487da8",
								)}
							/>
						) : (
							sessions?.map((session) => (
								<ListSessionsRow
									session={session}
									key={session.id}
									onClick={() => onSessionRowClick?.(session.id)}
								/>
							))
						)}
					</TableBody>
				</Table>
			</PaginationContainer>
		</>
	);
};
