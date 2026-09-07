import { ExternalLinkIcon, RotateCwIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ApiErrorResponse } from "#/api/errors";
import type { ExternalAuth, ExternalAuthDevice } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Avatar } from "#/components/Avatar/Avatar";
import { GitDeviceAuth } from "#/components/GitDeviceAuth/GitDeviceAuth";
import { Link } from "#/components/Link/Link";
import { SignInLayout } from "#/components/SignInLayout/SignInLayout";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { Welcome } from "#/components/Welcome/Welcome";

interface ExternalAuthPageViewProps {
	externalAuth: ExternalAuth;
	viewExternalAuthConfig: boolean;

	externalAuthDevice?: ExternalAuthDevice;
	deviceExchangeError?: ApiErrorResponse;

	onReauthenticate: () => void;
}

const ExternalAuthPageView: FC<ExternalAuthPageViewProps> = ({
	deviceExchangeError,
	externalAuth,
	externalAuthDevice,
	onReauthenticate,
	viewExternalAuthConfig,
}) => {
	const { t: tI18n } = useTranslation("auth");

	if (!externalAuth.authenticated) {
		return (
			<SignInLayout>
				<Welcome>
					{tI18n(
						"ExternalAuthPage.ExternalAuthPageView.authenticate_with_0df9f72b",
					)}
					{externalAuth.display_name}
				</Welcome>
				{externalAuth.device && (
					<GitDeviceAuth
						deviceExchangeError={deviceExchangeError}
						externalAuthDevice={externalAuthDevice}
					/>
				)}
			</SignInLayout>
		);
	}

	const hasInstallations = externalAuth.installations.length > 0;

	// We only want to wrap this with a link if an install URL is available!
	let installTheApp: ReactNode = `install the ${externalAuth.display_name} App`;
	if (externalAuth.app_install_url) {
		installTheApp = (
			<Link
				href={externalAuth.app_install_url}
				target="_blank"
				rel="noreferrer"
				showExternalIcon={false}
				className="p-0 text-sm font-medium"
			>
				{installTheApp}
			</Link>
		);
	}

	return (
		<SignInLayout>
			<Welcome>
				{tI18n(
					"ExternalAuthPage.ExternalAuthPageView.you_ve_authenticated_with_70361ca1",
				)}
				{externalAuth.display_name}!
			</Welcome>
			<p className="m-0 text-center text-base leading-relaxed text-content-secondary">
				{externalAuth.user?.login &&
					tI18n("ExternalAuthPage.ExternalAuthPageView.hey_value0_a68de510", {
						value0: externalAuth.user?.login,
					})}
				{(!externalAuth.app_installable ||
					externalAuth.installations.length > 0) &&
					tI18n(
						"ExternalAuthPage.ExternalAuthPageView.you_are_now_authenticated_feel_free_to_close_thi_b3c58744",
					)}
			</p>
			{externalAuth.installations.length > 0 && (
				<div className="m-8 flex items-center gap-1 text-content-disabled">
					{externalAuth.installations.map((install) => {
						if (!install.account) {
							return;
						}
						return (
							<Tooltip key={install.id}>
								<TooltipTrigger asChild>
									<Link
										href={install.account.profile_url}
										target="_blank"
										rel="noreferrer"
										showExternalIcon={false}
										className="p-0 hover:after:content-none"
									>
										<Avatar
											src={install.account.avatar_url}
											fallback={install.account.login}
										/>
									</Link>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{install.account.login}
								</TooltipContent>
							</Tooltip>
						);
					})}
					&nbsp;
					{externalAuth.installations.length}
					{tI18n("ExternalAuthPage.ExternalAuthPageView.organization_8b3bb8f9")}
					{externalAuth.installations.length !== 1 &&
						tI18n("ExternalAuthPage.ExternalAuthPageView.s_are_9cdade10")}
					{tI18n("ExternalAuthPage.ExternalAuthPageView.authorized_431cc278")}
				</div>
			)}
			<div className="m-4 flex flex-col items-center gap-1">
				{!hasInstallations && externalAuth.app_installable && (
					<Alert severity="warning" className="m-4">
						{tI18n("ExternalAuthPage.ExternalAuthPageView.you_must_897ca8ef")}
						{installTheApp}
						{tI18n(
							"ExternalAuthPage.ExternalAuthPageView.to_clone_private_repositories_accounts_will_appe_7e4c1a5e",
						)}
					</Alert>
				)}

				{viewExternalAuthConfig &&
					externalAuth.app_install_url &&
					externalAuth.app_installable && (
						<Link
							href={externalAuth.app_install_url}
							target="_blank"
							rel="noreferrer"
							showExternalIcon={false}
							className="inline-flex items-center gap-2 p-0 text-base font-medium [&_svg]:size-icon-xs [&_svg]:p-0"
						>
							<ExternalLinkIcon className="size-icon-xs" />
							{externalAuth.installations.length > 0
								? tI18n(
										"ExternalAuthPage.ExternalAuthPageView.configure_6defafa2",
									)
								: tI18n(
										"ExternalAuthPage.ExternalAuthPageView.install_569ca49f",
									)}{" "}
							{tI18n("ExternalAuthPage.ExternalAuthPageView.the_6e5ce6af")}
							{externalAuth.display_name}
							{tI18n("ExternalAuthPage.ExternalAuthPageView.app_c670c8f9")}
						</Link>
					)}
				<Link
					className="inline-flex items-center gap-2 p-0 text-base font-medium [&_svg]:size-icon-xs [&_svg]:p-0"
					href="#"
					showExternalIcon={false}
					onClick={() => {
						onReauthenticate();
					}}
				>
					<RotateCwIcon className="size-icon-xs" />
					{tI18n(
						"ExternalAuthPage.ExternalAuthPageView.reauthenticate_da02430c",
					)}
				</Link>
			</div>
		</SignInLayout>
	);
};

export default ExternalAuthPageView;
