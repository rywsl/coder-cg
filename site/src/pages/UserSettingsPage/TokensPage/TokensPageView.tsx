import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { TrashIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { APIKeyWithOwner } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";

dayjs.extend(relativeTime);

const lastUsedOrNever = (lastUsed: string) => {
	const t = dayjs(lastUsed);
	return t.valueOf() > 0 ? t.fromNow() : "Never";
};

interface TokensPageViewProps {
	tokens?: APIKeyWithOwner[];
	getTokensError?: unknown;
	isLoading: boolean;
	hasLoaded: boolean;
	onDelete: (token: APIKeyWithOwner) => void;
	deleteTokenError?: unknown;
	children?: ReactNode;
}

export const TokensPageView: FC<TokensPageViewProps> = ({
	tokens,
	getTokensError,
	isLoading,
	hasLoaded,
	onDelete,
	deleteTokenError,
}) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<div className="flex flex-col gap-4">
			{Boolean(getTokensError) && <ErrorAlert error={getTokensError} />}
			{Boolean(deleteTokenError) && <ErrorAlert error={deleteTokenError} />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/5">
							{tI18n("UserSettingsPage.TokensPage.TokensPageView.id_3843971d")}
						</TableHead>
						<TableHead className="w-1/5">
							{tI18n(
								"UserSettingsPage.TokensPage.TokensPageView.name_dcd1d522",
							)}
						</TableHead>
						<TableHead className="w-1/5">
							{tI18n(
								"UserSettingsPage.TokensPage.TokensPageView.last_used_9f1b4073",
							)}
						</TableHead>
						<TableHead className="w-1/5">
							{tI18n(
								"UserSettingsPage.TokensPage.TokensPageView.expires_at_884da2ad",
							)}
						</TableHead>
						<TableHead className="w-1/5">
							{tI18n(
								"UserSettingsPage.TokensPage.TokensPageView.created_at_3d443370",
							)}
						</TableHead>
						<TableHead className="w-[1%]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					<TokensTableBody
						tokens={tokens}
						isLoading={isLoading}
						hasLoaded={hasLoaded}
						onDelete={onDelete}
					/>
				</TableBody>
			</Table>
		</div>
	);
};

interface TokensTableBodyProps {
	tokens?: APIKeyWithOwner[];
	isLoading: boolean;
	hasLoaded: boolean;
	onDelete: (token: APIKeyWithOwner) => void;
}

const TokensTableBody: FC<TokensTableBodyProps> = ({
	tokens,
	isLoading,
	hasLoaded,
	onDelete,
}) => {
	const { t: tI18n } = useTranslation("users");

	if (isLoading) {
		return <TableLoader />;
	}
	if (hasLoaded && (!tokens || tokens.length === 0)) {
		return (
			<TableEmpty
				message={tI18n(
					"UserSettingsPage.TokensPage.TokensPageView.no_tokens_found_6cd980a3",
				)}
			/>
		);
	}
	return tokens?.map((token) => (
		<TableRow key={token.id} data-testid={`token-${token.id}`} tabIndex={0}>
			<TableCell>
				<span className="text-content-secondary">{token.id}</span>
			</TableCell>

			<TableCell>
				<span className="text-content-secondary">{token.token_name}</span>
			</TableCell>

			<TableCell>{lastUsedOrNever(token.last_used)}</TableCell>

			<TableCell>
				<span className="text-content-secondary" data-pixel="ignore">
					{dayjs(token.expires_at).fromNow()}
				</span>
			</TableCell>

			<TableCell>
				<span className="text-content-secondary">
					{dayjs(token.created_at).fromNow()}
				</span>
			</TableCell>

			<TableCell>
				<span className="text-content-secondary">
					<Button
						onClick={() => {
							onDelete(token);
						}}
						size="icon"
						variant="destructive"
						aria-label={tI18n(
							"UserSettingsPage.TokensPage.TokensPageView.delete_token_8cb21e2a",
						)}
					>
						<TrashIcon className="size-icon-sm" />
					</Button>
				</span>
			</TableCell>
		</TableRow>
	));
};
