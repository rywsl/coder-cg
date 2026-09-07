import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { apiKey } from "#/api/queries/users";
import { pageTitle } from "#/utils/page";
import { CliAuthPageView } from "./CliAuthPageView";

const CliAuthenticationPage: FC = () => {
	const { t: tI18n } = useTranslation("auth");

	const { data } = useQuery(apiKey());

	return (
		<>
			<title>
				{pageTitle(tI18n("CliAuthPage.CliAuthPage.cli_auth_6a0fb934"))}
			</title>
			<CliAuthPageView sessionToken={data?.key} />
		</>
	);
};

export default CliAuthenticationPage;
