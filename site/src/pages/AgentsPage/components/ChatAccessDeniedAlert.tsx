import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { Link } from "#/components/Link/Link";
import { docs } from "#/utils/docs";

export const ChatAccessDeniedAlert: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const docsLink = docs("/ai-coder/agents/getting-started");

	return (
		<Alert
			severity="info"
			actions={
				<Button size="sm" onClick={() => location.reload()}>
					{tI18n(
						"AgentsPage.components.ChatAccessDeniedAlert.refresh_0e916101",
					)}
				</Button>
			}
		>
			<AlertTitle>
				{tI18n(
					"AgentsPage.components.ChatAccessDeniedAlert.permission_required_dbb6cf81",
				)}
			</AlertTitle>
			<AlertDescription>
				{tI18n(
					"AgentsPage.components.ChatAccessDeniedAlert.you_don_t_have_permission_to_use_coder_agents_co_af751be1",
				)}{" "}
				<Link href={docsLink} target="_blank" rel="noreferrer">
					{tI18n(
						"AgentsPage.components.ChatAccessDeniedAlert.view_docs_02fe3dd7",
					)}
				</Link>
			</AlertDescription>
		</Alert>
	);
};
