import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { Welcome } from "#/components/Welcome/Welcome";

type CliInstallPageViewProps = {
	origin: string;
};

export const CliInstallPageView: FC<CliInstallPageViewProps> = ({ origin }) => {
	const { t: tI18n } = useTranslation("pages");

	return (
		<div
			className={cn(
				"mx-auto h-screen w-[600px] max-w-full px-4",
				"flex flex-1 flex-col items-center justify-center",
			)}
		>
			<Welcome>
				{tI18n(
					"CliInstallPage.CliInstallPageView.install_the_coder_cli_b07a20ac",
				)}
			</Welcome>
			<p className="pb-2 text-center text-base leading-[1.4] text-content-secondary">
				{tI18n(
					"CliInstallPage.CliInstallPageView.copy_the_command_below_and_e5c1ea05",
				)}{" "}
				<strong className="block">
					{tI18n(
						"CliInstallPage.CliInstallPageView.paste_it_in_your_terminal_bd724733",
					)}
				</strong>
			</p>
			<CodeExample
				className="max-w-full [&>code]:overflow-x-hidden [&>code]:text-ellipsis [&>code]:whitespace-nowrap"
				code={`curl -fsSL ${origin}/install.sh | sh`}
				secret={false}
			/>
			<div className="pt-4">
				<RouterLink
					to="/workspaces"
					className="block py-4 text-center text-content-primary underline decoration-[hsla(0,0%,100%,0.7)] underline-offset-[3px] hover:no-underline"
				>
					{tI18n("CliInstallPage.CliInstallPageView.go_to_workspaces_38ce977a")}
				</RouterLink>
			</div>
			<div className="mt-6 text-xs text-content-secondary">
				&copy; {new Date().getFullYear()}
				{tI18n(
					"CliInstallPage.CliInstallPageView.coder_technologies_inc_6f4648e4",
				)}
			</div>
		</div>
	);
};
