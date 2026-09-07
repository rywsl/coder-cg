import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "#/components/Alert/Alert";

interface ModelOverrideAlertsProps {
	isUnavailableSavedModel: boolean;
	unavailableMessage: ReactNode;
	modelsError: unknown;
	children?: ReactNode;
}

export const ModelOverrideAlerts: FC<ModelOverrideAlertsProps> = ({
	isUnavailableSavedModel,
	unavailableMessage,
	modelsError,
	children,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			{isUnavailableSavedModel && (
				<Alert severity="warning">
					<AlertDescription>{unavailableMessage}</AlertDescription>
				</Alert>
			)}
			{children}
			{Boolean(modelsError) && (
				<p className="m-0 text-xs text-content-destructive">
					{tI18n(
						"AgentsPage.components.ModelOverrideAlerts.failed_to_load_models_dc2d723d",
					)}
				</p>
			)}
		</>
	);
};
