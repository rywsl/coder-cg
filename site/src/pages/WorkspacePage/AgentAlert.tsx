import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";

interface AgentAlertProps {
	title: string;
	detail: ReactNode;
	severity: "info" | "warning";
	prominent: boolean;
	troubleshootingURL?: string;
}

export const AgentAlert: FC<AgentAlertProps> = ({
	title,
	detail,
	severity,
	prominent,
	troubleshootingURL,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Alert severity={severity} prominent={prominent}>
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>
				<div className="mb-2">{detail}</div>
				{troubleshootingURL && (
					<Button size="sm" asChild>
						<a href={troubleshootingURL} target="_blank" rel="noreferrer">
							{tI18n(
								"WorkspacePage.AgentAlert.view_docs_to_troubleshoot_403f4928",
							)}
						</a>
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
};
