import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { addableProviders } from "../components/addableProviderTypes";
import AddProviderPageView from "./AddProviderPageView";

const AddProviderPage: React.FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { permissions } = useAuthenticated();
	const hasPermission = permissions.viewAnyAIProvider;
	const [searchParams] = useSearchParams();
	const typeParam = searchParams.get("type");

	const provider = addableProviders.find((p) => p.value === typeParam);
	if (!provider) {
		return (
			<div className="flex flex-col items-start gap-4 pt-4 px-6">
				<Link to="/ai/settings/providers">
					<Button variant="subtle">
						<ArrowLeftIcon />
						<span>
							{tI18n(
								"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPage.back_to_providers_efe5419c",
							)}
						</span>
					</Button>
				</Link>
				<Alert severity="warning">
					<AlertTitle>
						{tI18n(
							"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPage.provider_type_not_found_75d44e99",
						)}
					</AlertTitle>
					<AlertDescription>
						{tI18n(
							"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPage.the_provider_type_you_are_trying_to_add_is_not_v_9715c781",
						)}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<RequirePermission isFeatureVisible={hasPermission}>
			<title>
				{pageTitle(
					tI18n(
						"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPage.new_value0_provider_f0680e7d",
						{
							value0: provider.label,
						},
					),
					tI18n(
						"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPage.ai_providers_5aef60a9",
					),
				)}
			</title>
			<AddProviderPageView provider={provider} />
		</RequirePermission>
	);
};

export default AddProviderPage;
