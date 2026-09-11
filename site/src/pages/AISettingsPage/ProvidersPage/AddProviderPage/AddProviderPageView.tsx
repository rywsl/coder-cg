import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { getErrorMessage } from "#/api/errors";
import { createAIProviderMutation } from "#/api/queries/aiProviders";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import type { AddableProvider } from "../components/addableProviderTypes";
import { ProviderForm } from "../components/ProviderForm";
import { getProviderIcon } from "../components/ProviderIcon";
import { providerFormValuesToCreate } from "../components/providerFormApiMap";

interface AddProviderPageViewProps {
	provider: AddableProvider;
}

const indefiniteArticle = (word: string): string =>
	/^[aeiou]/i.test(word) ? "an" : "a";

const AddProviderPageView: React.FC<AddProviderPageViewProps> = ({
	provider,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const createMutation = useMutation(createAIProviderMutation(queryClient));
	const defaultIcon = getProviderIcon(provider.value) ?? "";
	const [icon, setIcon] = useState(defaultIcon);

	return (
		<>
			<Link to="/ai/settings/providers" className="-ml-3">
				<Button variant="subtle">
					<ArrowLeftIcon />
					<span>
						{tI18n(
							"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPageView.back_to_providers_efe5419c",
						)}
					</span>
				</Button>
			</Link>
			<div className="flex flex-col gap-6 pt-6">
				<div className="flex items-center gap-4 min-w-0">
					<Avatar variant="icon" size="lg" src={icon || defaultIcon} />
					<SettingsHeaderTitle>
						{provider.value === "openai-compat"
							? tI18n(
									"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPageView.add_an_openai_compatible_provider_5d50c1f2",
								)
							: indefiniteArticle(provider.label) === "an"
								? tI18n(
										"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPageView.add_an_value0_provider_52cc66ed",
										{ value0: provider.label },
									)
								: tI18n(
										"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPageView.add_a_value0_provider_5af7e95b",
										{ value0: provider.label },
									)}
					</SettingsHeaderTitle>
				</div>
				<p className="text-sm text-content-secondary m-0">
					{tI18n(
						"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPageView.configure_connection_details_and_credentials_9a3956c2",
					)}
				</p>
				<div className="border border-solid p-6 rounded-lg">
					<ProviderForm
						editing={false}
						initialValues={{ type: provider.value, icon: defaultIcon }}
						onIconChange={setIcon}
						isLoading={createMutation.isPending}
						submitError={createMutation.error}
						onSubmit={async (values) => {
							const request = providerFormValuesToCreate(values);
							try {
								const res = await createMutation.mutateAsync(request);
								toast.success(
									tI18n(
										"AISettingsPage.ProvidersPage.AddProviderPage.AddProviderPageView.provider_value0_added_0573a800",
										{
											value0: res.display_name || res.name,
										},
									),
								);
								// Awaited so the form's submitting state stays true through
								// navigation, keeping the unsaved-changes prompt suppressed.
								await navigate(`/ai/settings/providers/${res.name}`);
							} catch (error) {
								const name = values.name.trim();
								toast.error(
									getErrorMessage(
										error,
										name
											? `Failed to add provider "${name}".`
											: "Failed to add provider.",
									),
								);
							}
						}}
					/>
				</div>
			</div>
		</>
	);
};

export default AddProviderPageView;
