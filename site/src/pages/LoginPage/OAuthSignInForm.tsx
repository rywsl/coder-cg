import { KeyIcon } from "lucide-react";
import { type FC, useId } from "react";
import { useTranslation } from "react-i18next";
import type { AuthMethods } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";

type OAuthSignInFormProps = {
	isSigningIn: boolean;
	redirectTo: string;
	authMethods?: AuthMethods;
};

export const OAuthSignInForm: FC<OAuthSignInFormProps> = ({
	isSigningIn,
	redirectTo,
	authMethods,
}) => {
	const { t: tI18n } = useTranslation("auth");

	return (
		<div className="grid gap-4">
			{authMethods?.github.enabled && (
				<Button
					variant="outline"
					asChild
					disabled={isSigningIn}
					className="w-full"
					type="submit"
					size="lg"
				>
					<a
						href={`/api/v2/users/oauth2/github/callback?redirect=${encodeURIComponent(
							redirectTo,
						)}`}
					>
						<ExternalImage src="/icon/github.svg" />
						{tI18n("LoginPage.OAuthSignInForm.github_f911e414")}
					</a>
				</Button>
			)}
			{authMethods?.oidc.enabled && (
				<Button
					variant="outline"
					asChild
					className="w-full"
					size="lg"
					disabled={isSigningIn}
					type="submit"
				>
					<a
						href={`/api/v2/users/oidc/callback?redirect=${encodeURIComponent(
							redirectTo,
						)}`}
					>
						{authMethods.oidc.iconUrl ? (
							<OidcIcon iconUrl={authMethods.oidc.iconUrl} />
						) : (
							<KeyIcon />
						)}
						{authMethods.oidc.signInText ||
							tI18n("LoginPage.OAuthSignInForm.openid_connect_50a8a027")}
					</a>
				</Button>
			)}
		</div>
	);
};

type OidcIconProps = {
	iconUrl: string;
};

const OidcIcon: FC<OidcIconProps> = ({ iconUrl }) => {
	const { t: tI18n } = useTranslation("auth");

	const hookId = useId();
	const oidcId = `${hookId}-oidc`;

	// Even if the URL is defined, there is a chance that the request for the
	// image fails. Have to use blank alt text to avoid button from getting ugly
	// if that happens, but also still need a way to inject accessible text
	return (
		<>
			<ExternalImage alt="" src={iconUrl} aria-labelledby={oidcId} />
			<div id={oidcId} className="sr-only">
				{tI18n("LoginPage.OAuthSignInForm.open_id_connect_0677e36a")}
			</div>
		</>
	);
};
