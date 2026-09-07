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

const DatabasePage = () => {
	const { t: tI18n } = useTranslation("pages");

	const healthStatus = useOutletContext<HealthcheckReport>();
	const database = healthStatus.database;

	return (
		<>
			<title>
				{pageTitle(tI18n("HealthPage.DatabasePage.database_health_45b28a28"))}
			</title>
			<Header>
				<HeaderTitle>
					<HealthyDot severity={database.severity} />
					{tI18n("HealthPage.DatabasePage.database_fa7fe671")}
				</HeaderTitle>
				<MuteWarningsButton healthcheck="Database" />
			</Header>
			<Main>
				{database.warnings.map((warning) => {
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
						{tI18n("HealthPage.DatabasePage.reachable_f94b5f3d")}
					</GridDataLabel>
					<GridDataValue>
						{database.reachable
							? tI18n("HealthPage.DatabasePage.yes_85a39ab3")
							: tI18n("HealthPage.DatabasePage.no_1ea442a1")}
					</GridDataValue>

					<GridDataLabel>
						{tI18n("HealthPage.DatabasePage.latency_e0e7d293")}
					</GridDataLabel>
					<GridDataValue>
						{database.latency_ms}
						{tI18n("HealthPage.DatabasePage.ms_f785c3ce")}
					</GridDataValue>

					<GridDataLabel>
						{tI18n("HealthPage.DatabasePage.threshold_0da627ad")}
					</GridDataLabel>
					<GridDataValue>
						{database.threshold_ms}
						{tI18n("HealthPage.DatabasePage.ms_f785c3ce")}
					</GridDataValue>
				</GridData>
			</Main>
		</>
	);
};

export default DatabasePage;
