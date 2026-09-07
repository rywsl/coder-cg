import { CheckIcon, CopyIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { Button } from "#/components/Button/Button";
import { SignInLayout } from "#/components/SignInLayout/SignInLayout";
import { Spinner } from "#/components/Spinner/Spinner";
import { Welcome } from "#/components/Welcome/Welcome";
import { useClipboard } from "#/hooks/useClipboard";

interface CliAuthPageViewProps {
	sessionToken?: string;
}

export const CliAuthPageView: FC<CliAuthPageViewProps> = ({ sessionToken }) => {
	const { t: tI18n } = useTranslation("auth");

	const clipboardState = useClipboard();
	return (
		<SignInLayout>
			<Welcome>
				{tI18n("CliAuthPage.CliAuthPageView.session_token_65fdc7ba")}
			</Welcome>
			<p className="m-0 text-center text-sm text-content-secondary leading-normal">
				{tI18n(
					"CliAuthPage.CliAuthPageView.copy_the_session_token_below_and_d055ea69",
				)}{" "}
				<strong className="block">
					{tI18n(
						"CliAuthPage.CliAuthPageView.paste_it_in_your_terminal_bd724733",
					)}
				</strong>
			</p>
			<div className="flex flex-col items-center gap-1 w-full mt-4">
				<Button
					className="w-full"
					size="lg"
					disabled={!sessionToken}
					onClick={() => {
						if (sessionToken) {
							clipboardState.copyToClipboard(sessionToken);
						}
					}}
				>
					{clipboardState.showCopiedSuccess ? (
						<CheckIcon />
					) : (
						<Spinner loading={!sessionToken}>
							<CopyIcon />
						</Spinner>
					)}
					{clipboardState.showCopiedSuccess
						? tI18n("CliAuthPage.CliAuthPageView.session_token_copied_eb1a9718")
						: tI18n("CliAuthPage.CliAuthPageView.copy_session_token_50342d72")}
				</Button>

				<Button className="w-full" variant="subtle" asChild>
					<RouterLink to="/workspaces">
						{tI18n("CliAuthPage.CliAuthPageView.go_to_workspaces_38ce977a")}
					</RouterLink>
				</Button>
			</div>
		</SignInLayout>
	);
};
