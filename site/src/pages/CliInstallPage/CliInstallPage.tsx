import { isPixel } from "@coder/pixel-storybook/storyapi";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { pageTitle } from "#/utils/page";
import { CliInstallPageView } from "./CliInstallPageView";

const CliInstallPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	const origin = isPixel() ? "https://example.com" : location.origin;

	return (
		<>
			<title>
				{pageTitle(
					tI18n("CliInstallPage.CliInstallPage.install_the_coder_cli_e534858e"),
				)}
			</title>
			<CliInstallPageView origin={origin} />
		</>
	);
};

export default CliInstallPage;
