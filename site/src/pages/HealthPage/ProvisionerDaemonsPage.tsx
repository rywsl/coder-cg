import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import type { HealthcheckReport } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Provisioner } from "#/modules/provisioners/Provisioner";
import { pageTitle } from "#/utils/page";
import {
	Header,
	HeaderTitle,
	HealthMessageDocsLink,
	HealthyDot,
	Main,
} from "./Content";
import { MuteWarningsButton } from "./MuteWarningsButton";

const ProvisionerDaemonsPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	const healthStatus = useOutletContext<HealthcheckReport>();
	const { provisioner_daemons: daemons } = healthStatus;

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"HealthPage.ProvisionerDaemonsPage.provisioner_daemons_health_370fe6ce",
					),
				)}
			</title>
			<Header>
				<HeaderTitle>
					<HealthyDot severity={daemons.severity} />
					{tI18n(
						"HealthPage.ProvisionerDaemonsPage.provisioner_daemons_c0fe9f1e",
					)}
				</HeaderTitle>
				<MuteWarningsButton healthcheck="ProvisionerDaemons" />
			</Header>
			<Main>
				{daemons.error && (
					<Alert severity="error" prominent>
						{daemons.error}
					</Alert>
				)}
				{daemons.warnings.map((warning) => {
					return (
						<Alert
							actions={<HealthMessageDocsLink {...warning} />}
							key={warning.code}
							severity="warning"
							prominent
							dismissible
						>
							{warning.message}
						</Alert>
					);
				})}

				{daemons.items.map(({ provisioner_daemon, warnings }) => (
					<Provisioner
						key={provisioner_daemon.id}
						provisioner={provisioner_daemon}
						warnings={warnings}
					/>
				))}
			</Main>
		</>
	);
};

export default ProvisionerDaemonsPage;
