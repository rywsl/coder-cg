import { PlusIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { APIKeyWithOwner } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useTokensData } from "./hooks";
import { TokensPageView } from "./TokensPageView";

const cliCreateCommand = "coder tokens create";

const TokensPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const [tokenToDelete, setTokenToDelete] = useState<
		APIKeyWithOwner | undefined
	>(undefined);

	const {
		data: tokens,
		error: getTokensError,
		isFetching,
		isFetched,
		queryKey,
	} = useTokensData({
		// we currently do not show all tokens in the UI, even if
		// the user has read all permissions
		include_all: false,
		include_expired: false,
	});

	return (
		<>
			<SettingsHeader
				actions={
					<Button asChild variant="outline">
						<RouterLink to="new">
							<PlusIcon />
							{tI18n(
								"UserSettingsPage.TokensPage.TokensPage.create_token_5d8e8e30",
							)}
						</RouterLink>
					</Button>
				}
			>
				<SettingsHeaderTitle>
					{tI18n("UserSettingsPage.TokensPage.TokensPage.tokens_a039dfb9")}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"UserSettingsPage.TokensPage.TokensPage.tokens_are_used_to_authenticate_with_the_coder_a_74508652",
					)}{" "}
					<code className="bg-surface-secondary text-content-primary text-xs px-1 py-0.5 rounded-sm">
						{cliCreateCommand}
					</code>{" "}
					{tI18n("UserSettingsPage.TokensPage.TokensPage.command_4c331678")}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<TokensPageView
				tokens={tokens}
				isLoading={isFetching}
				hasLoaded={isFetched}
				getTokensError={getTokensError}
				onDelete={(token) => {
					setTokenToDelete(token);
				}}
			/>
			<ConfirmDeleteDialog
				queryKey={queryKey}
				token={tokenToDelete}
				setToken={setTokenToDelete}
			/>
		</>
	);
};

export default TokensPage;
