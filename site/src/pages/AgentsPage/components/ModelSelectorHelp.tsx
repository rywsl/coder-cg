import type { ReactNode } from "react";
import { Link } from "react-router";
import { i18n } from "#/i18n";

interface GetModelSelectorHelpOptions {
	isModelCatalogLoading: boolean;
	hasModelOptions: boolean;
	hasConfiguredModels: boolean;
	hasUserFixableModelProviders: boolean;
}

export const getModelSelectorHelp = ({
	isModelCatalogLoading,
	hasModelOptions,
	hasConfiguredModels,
	hasUserFixableModelProviders,
}: GetModelSelectorHelpOptions): ReactNode | undefined => {
	if (
		isModelCatalogLoading ||
		hasModelOptions ||
		!hasConfiguredModels ||
		!hasUserFixableModelProviders
	) {
		return undefined;
	}

	return (
		<>
			{i18n.t(
				"agents:AgentsPage.components.ModelSelectorHelp.configure_your_api_keys_in_9b422302",
			)}{" "}
			<Link
				to="/agents/settings/api-keys"
				className="underline transition-colors hover:text-content-primary"
			>
				{i18n.t(
					"agents:AgentsPage.components.ModelSelectorHelp.settings_74a883a0",
				)}
			</Link>{" "}
			{i18n.t(
				"agents:AgentsPage.components.ModelSelectorHelp.to_enable_models_085b5fe5",
			)}
		</>
	);
};
