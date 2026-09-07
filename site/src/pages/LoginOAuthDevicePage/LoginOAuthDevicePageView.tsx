import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ApiErrorResponse } from "#/api/errors";
import type { ExternalAuthDevice } from "#/api/typesGenerated";
import { GitDeviceAuth } from "#/components/GitDeviceAuth/GitDeviceAuth";
import { SignInLayout } from "#/components/SignInLayout/SignInLayout";
import { Welcome } from "#/components/Welcome/Welcome";

interface LoginOAuthDevicePageViewProps {
	authenticated: boolean;
	redirectUrl: string;
	externalAuthDevice?: ExternalAuthDevice;
	deviceExchangeError?: ApiErrorResponse;
}

const LoginOAuthDevicePageView: FC<LoginOAuthDevicePageViewProps> = ({
	authenticated,
	redirectUrl,
	deviceExchangeError,
	externalAuthDevice,
}) => {
	const { t: tI18n } = useTranslation("auth");

	if (!authenticated) {
		return (
			<SignInLayout>
				<Welcome>
					{tI18n(
						"LoginOAuthDevicePage.LoginOAuthDevicePageView.authenticate_with_github_48cd4b06",
					)}
				</Welcome>
				<GitDeviceAuth
					deviceExchangeError={deviceExchangeError}
					externalAuthDevice={externalAuthDevice}
				/>
			</SignInLayout>
		);
	}

	return (
		<SignInLayout>
			<Welcome>
				{tI18n(
					"LoginOAuthDevicePage.LoginOAuthDevicePageView.you_ve_authenticated_with_github_a54f5c43",
				)}
			</Welcome>
			<p className="m-0 text-center text-base leading-relaxed text-content-secondary">
				{tI18n(
					"LoginOAuthDevicePage.LoginOAuthDevicePageView.if_you_re_not_redirected_automatically_b37a163a",
				)}{" "}
				<a
					href={redirectUrl}
					aria-label={tI18n(
						"LoginOAuthDevicePage.LoginOAuthDevicePageView.continue_to_coder_ba1d88fe",
					)}
				>
					{tI18n(
						"LoginOAuthDevicePage.LoginOAuthDevicePageView.click_here_9e1e4d61",
					)}
				</a>
				.
			</p>
		</SignInLayout>
	);
};

export default LoginOAuthDevicePageView;
