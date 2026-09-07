import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import type { HealthcheckReport } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { pageTitle } from "#/utils/page";
import {
	GridData,
	GridDataLabel,
	GridDataValue,
	Header,
	HeaderTitle,
	HealthMessageDocsLink,
	HealthyDot,
	Main,
} from "./Content";
import { MuteWarningsButton } from "./MuteWarningsButton";

const AccessURLPage = () => {
	const { t: tI18n } = useTranslation("pages");

	const healthStatus = useOutletContext<HealthcheckReport>();
	const accessUrl = healthStatus.access_url;

	return (
		<>
			<title>
				{pageTitle(
					tI18n("HealthPage.AccessURLPage.access_url_health_56417142"),
				)}
			</title>
			<Header>
				<HeaderTitle>
					<HealthyDot severity={accessUrl.severity} />
					{tI18n("HealthPage.AccessURLPage.access_url_27c86782")}
				</HeaderTitle>
				<MuteWarningsButton healthcheck="AccessURL" />
			</Header>
			<Main>
				{accessUrl.error && <Alert severity="error">{accessUrl.error}</Alert>}

				{accessUrl.warnings.map((warning) => {
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

				<GridData>
					<GridDataLabel>
						{tI18n("HealthPage.AccessURLPage.severity_5e9f9812")}
					</GridDataLabel>
					<GridDataValue>{accessUrl.severity}</GridDataValue>

					<GridDataLabel>
						{tI18n("HealthPage.AccessURLPage.access_url_27c86782")}
					</GridDataLabel>
					<GridDataValue>{accessUrl.access_url}</GridDataValue>

					<GridDataLabel>
						{tI18n("HealthPage.AccessURLPage.reachable_f94b5f3d")}
					</GridDataLabel>
					<GridDataValue>
						{accessUrl.reachable
							? tI18n("HealthPage.AccessURLPage.yes_85a39ab3")
							: tI18n("HealthPage.AccessURLPage.no_1ea442a1")}
					</GridDataValue>

					<GridDataLabel>
						{tI18n("HealthPage.AccessURLPage.status_code_6bd59553")}
					</GridDataLabel>
					<GridDataValue>{accessUrl.status_code}</GridDataValue>
				</GridData>
			</Main>
		</>
	);
};

export default AccessURLPage;
