import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { aiProvidersList } from "#/api/queries/aiProviders";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import ProvidersPageView from "#/pages/AISettingsPage/ProvidersPage/ProvidersPageView";
import { pageTitle } from "#/utils/page";

const ProvidersPage: React.FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { permissions } = useAuthenticated();
	const hasPermission = permissions.viewAnyAIProvider;

	const providersQuery = useQuery(aiProvidersList());

	return (
		<RequirePermission isFeatureVisible={hasPermission}>
			<title>
				{pageTitle(
					tI18n(
						"AISettingsPage.ProvidersPage.ProvidersPage.ai_providers_5aef60a9",
					),
				)}
			</title>
			<ProvidersPageView
				isLoading={providersQuery.isLoading}
				isFetching={providersQuery.isFetching}
				error={providersQuery.error}
				providers={providersQuery.data ?? []}
			/>
		</RequirePermission>
	);
};

export default ProvidersPage;
