import { EllipsisVerticalIcon, RefreshCcwIcon } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { externalAuthProvider } from "#/api/queries/externalAuth";
import type {
	ExternalAuthLink,
	ExternalAuthLinkProvider,
	ListUserExternalAuthResponse,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Loader } from "#/components/Loader/Loader";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import type { ExternalAuthPollingState } from "#/hooks/useExternalAuth";

type ExternalAuthPageViewProps = {
	isLoading: boolean;
	getAuthsError?: unknown;
	unlinked: number;
	auths?: ListUserExternalAuthResponse;
	onUnlinkExternalAuth: (provider: ExternalAuthLinkProvider) => void;
	onValidateExternalAuth: (provider: string) => void;
};

export const ExternalAuthPageView: FC<ExternalAuthPageViewProps> = ({
	isLoading,
	getAuthsError,
	auths,
	unlinked,
	onUnlinkExternalAuth,
	onValidateExternalAuth,
}) => {
	const { t: tI18n } = useTranslation("users");

	if (getAuthsError) {
		// Nothing to show if there is an error
		return <ErrorAlert error={getAuthsError} />;
	}

	if (isLoading || !auths) {
		return <Loader />;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						{tI18n(
							"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.application_e7ad522e",
						)}
					</TableHead>
					<TableHead>
						<span aria-hidden className="sr-only">
							{tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.link_to_connect_4c74bc30",
							)}
						</span>
					</TableHead>
					<TableHead className="w-[1%]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{auths.providers === null || auths.providers?.length === 0 ? (
					<TableEmpty
						message={tI18n(
							"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.no_providers_have_been_configured_88893779",
						)}
					/>
				) : (
					auths.providers?.map((app) => (
						<ExternalAuthRow
							key={app.id}
							app={app}
							unlinked={unlinked}
							link={auths.links.find((l) => l.provider_id === app.id)}
							onUnlinkExternalAuth={() => {
								onUnlinkExternalAuth(app);
							}}
							onValidateExternalAuth={() => {
								onValidateExternalAuth(app.id);
							}}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
};

interface ExternalAuthRowProps {
	app: ExternalAuthLinkProvider;
	link?: ExternalAuthLink;
	unlinked: number;
	onUnlinkExternalAuth: () => void;
	onValidateExternalAuth: () => void;
}

const ExternalAuthRow: FC<ExternalAuthRowProps> = ({
	app,
	unlinked,
	link,
	onUnlinkExternalAuth,
	onValidateExternalAuth,
}) => {
	const { t: tI18n } = useTranslation("users");

	const name = app.display_name || app.id || app.type;
	const authURL = `/external-auth/${app.id}`;

	const {
		externalAuth,
		externalAuthPollingState,
		refetch,
		startPollingExternalAuth,
	} = useExternalAuth(app.id, unlinked);

	const authenticated = externalAuth
		? externalAuth.authenticated
		: (link?.authenticated ?? false);

	return (
		<TableRow key={app.id}>
			<TableCell>
				<div className="flex flex-row items-center gap-2">
					<Avatar variant="icon" src={app.display_icon} fallback={name} />
					<span className="font-semibold">{name}</span>
					{/*
					 * If the link is authenticated and has a refresh token, show that it will automatically
					 * attempt to authenticate when the token expires.
					 */}
					{link?.has_refresh_token && authenticated && (
						<Tooltip>
							<TooltipTrigger asChild>
								<RefreshCcwIcon className="size-3" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-xs">
								{tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.authentication_token_will_automatically_refresh__54f02337",
								)}
							</TooltipContent>
						</Tooltip>
					)}
					{link?.validate_error && (
						<span>
							<span className="pl-[1em] text-content-destructive">
								{tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.error_8eecdde0",
								)}
							</span>
							{link?.validate_error}
						</span>
					)}
				</div>
			</TableCell>
			<TableCell className="text-right">
				<Button
					disabled={authenticated || externalAuthPollingState === "polling"}
					onClick={() => {
						window.open(authURL, "_blank", "width=900,height=600");
						startPollingExternalAuth();
					}}
				>
					<Spinner loading={externalAuthPollingState === "polling"} />
					{authenticated
						? tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.authenticated_6ab694cf",
							)
						: tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.click_to_login_edaddeac",
							)}
				</Button>
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="icon-lg"
							variant="subtle"
							aria-label={tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.open_menu_b40b3713",
							)}
						>
							<EllipsisVerticalIcon aria-hidden="true" />
							<span className="sr-only">
								{tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.open_menu_b40b3713",
								)}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={async () => {
								onValidateExternalAuth();
								// This is kinda jank. It does a refetch of the thing
								// it just validated... But we need to refetch to update the
								// login button. And the 'onValidateExternalAuth' does the
								// message display.
								await refetch();
							}}
						>
							{tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.test_validate_1cf3179d",
							)}
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-content-destructive focus:text-content-destructive"
							onClick={async () => {
								onUnlinkExternalAuth();
								await refetch();
							}}
						>
							{tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPageView.unlink_cf3a7ab9",
							)}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
};

// useExternalAuth handles the polling of the auth to update the button.
const useExternalAuth = (providerID: string, unlinked: number) => {
	const [externalAuthPollingState, setExternalAuthPollingState] =
		useState<ExternalAuthPollingState>("idle");

	const startPollingExternalAuth = useCallback(() => {
		setExternalAuthPollingState("polling");
	}, []);

	const { data: externalAuth, refetch } = useQuery({
		...externalAuthProvider(providerID),
		refetchInterval: externalAuthPollingState === "polling" ? 1000 : false,
	});

	const signedIn = externalAuth?.authenticated;

	useEffect(() => {
		if (unlinked > 0) {
			void refetch();
		}
	}, [refetch, unlinked]);

	useEffect(() => {
		if (signedIn) {
			setExternalAuthPollingState("idle");
			return;
		}

		if (externalAuthPollingState !== "polling") {
			return;
		}

		// Poll for a maximum of one minute
		const quitPolling = setTimeout(
			() => setExternalAuthPollingState("abandoned"),
			60_000,
		);
		return () => {
			clearTimeout(quitPolling);
		};
	}, [externalAuthPollingState, signedIn]);

	return {
		startPollingExternalAuth,
		externalAuth,
		externalAuthPollingState,
		refetch,
	};
};
