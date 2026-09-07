import { isAxiosError } from "axios";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getErrorMessage } from "#/api/errors";
import {
	aiProvider,
	aiProviderKeyFor,
	deleteAIProviderMutation,
	updateAIProviderMutation,
} from "#/api/queries/aiProviders";
import { Avatar } from "#/components/Avatar/Avatar";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import { Loader } from "#/components/Loader/Loader";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import { Switch } from "#/components/Switch/Switch";
import { pageTitle } from "#/utils/page";
import { ProviderForm } from "../components/ProviderForm";
import { getProviderIcon } from "../components/ProviderIcon";
import {
	aiProviderToFormValues,
	bedrockExternalId,
	getProviderDisplayType,
	hasBedrockStoredCredentials,
	isBedrockProvider,
	providerFormValuesToUpdate,
} from "../components/providerFormApiMap";

const BACK_HREF = "/ai/settings/providers";

const UpdateProviderPageView: React.FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { providerId } = useParams<{ providerId: string }>();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const providerQuery = useQuery({
		...aiProvider(providerId ?? ""),
		enabled: Boolean(providerId),
	});

	const provider = providerQuery.data;
	// Copilot has no stored credential, and Bedrock keeps its secrets in
	// settings, so only the remaining types surface the api_keys UI.
	const providerUsesApiKeys =
		provider !== undefined &&
		!isBedrockProvider(provider) &&
		provider.type !== "copilot";

	const updateMutation = useMutation(
		updateAIProviderMutation(queryClient, providerId ?? ""),
	);

	const deleteMutation = useMutation(
		deleteAIProviderMutation(queryClient, providerId ?? ""),
	);

	// Rendered into every non-redirect return so the document title reflects
	// the provider as soon as we know it; falls back to a placeholder while
	// the query is in flight.
	const title = (
		<title>
			{pageTitle(
				(provider?.display_name || provider?.name) ??
					tI18n(
						"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.loading_47d2a515",
					),
				tI18n(
					"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.ai_providers_5aef60a9",
				),
			)}
		</title>
	);

	if (!providerId) {
		return <Navigate to={BACK_HREF} replace />;
	}

	if (providerQuery.isLoading) {
		return (
			<>
				{title}
				<Loader fullscreen />
			</>
		);
	}

	if (providerQuery.isError) {
		const status = isAxiosError(providerQuery.error)
			? providerQuery.error.response?.status
			: undefined;
		if (status === 404) {
			return <Navigate to={BACK_HREF} replace />;
		}
		return (
			<>
				{title}
				<div className="flex flex-col gap-4">
					<p className="text-content-secondary">
						{getErrorMessage(
							providerQuery.error,
							tI18n(
								"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.failed_to_load_provider_51e2467a",
							),
						)}
					</p>
					<Link to={BACK_HREF} className="-ml-3">
						<Button variant="subtle">
							<ArrowLeftIcon />
							<span>
								{tI18n(
									"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.back_to_providers_efe5419c",
								)}
							</span>
						</Button>
					</Link>
				</div>
			</>
		);
	}

	if (!provider) {
		return <Navigate to={BACK_HREF} replace />;
	}

	const openAiAnthropicSavedApiKey =
		providerUsesApiKeys && provider.api_keys.length > 0;
	const openAiAnthropicMaskedApiKey = providerUsesApiKeys
		? provider.api_keys[0]?.masked
		: undefined;

	return (
		<>
			{title}
			<div className="flex justify-between items-center">
				<Link to={BACK_HREF} className="-ml-3">
					<Button variant="subtle">
						<ArrowLeftIcon />
						<span>
							{tI18n(
								"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.back_to_providers_efe5419c",
							)}
						</span>
					</Button>
				</Link>
				<Button
					type="button"
					variant="destructive"
					disabled={updateMutation.isPending || deleteMutation.isPending}
					onClick={() => {
						setDeleteDialogOpen(true);
					}}
				>
					<span>
						{tI18n(
							"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.delete_e2d0a549",
						)}
					</span>
				</Button>
			</div>
			<div className="flex flex-col gap-6 pt-6">
				<div className="flex items-center gap-4 min-w-0">
					<Avatar
						variant="icon"
						size="lg"
						src={
							provider.icon || getProviderIcon(getProviderDisplayType(provider))
						}
					/>
					<SettingsHeaderTitle>
						<span className="block min-w-0 truncate">
							{provider.display_name || provider.name}
						</span>
					</SettingsHeaderTitle>
					{!provider.enabled && (
						<Badge variant="default">
							{tI18n(
								"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.disabled_75081b59",
							)}
						</Badge>
					)}
				</div>
				<div className="flex items-center justify-between w-full">
					<p className="text-sm text-content-secondary m-0">
						{tI18n(
							"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.add_or_update_models_for_this_provider_b30d4a8f",
						)}{" "}
						<a
							href="/ai/settings/models"
							className="text-content-link no-underline hover:underline"
						>
							{tI18n(
								"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.model_settings_d2179a7c",
							)}
						</a>
					</p>
					<div className="flex items-center gap-2">
						<Switch
							checked={provider.enabled}
							onCheckedChange={(checked) => {
								updateMutation.mutate(
									{ enabled: checked },
									{
										onSuccess: (updated) => {
											queryClient.setQueryData(
												aiProviderKeyFor(providerId),
												updated,
											);
											toast.success(
												tI18n(
													"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.provider_value0_value1_9a6ab328",
													{
														value0: updated.display_name || updated.name,
														value1: checked ? "enabled" : "disabled",
													},
												),
											);
										},
									},
								);
							}}
							disabled={updateMutation.isPending}
							aria-label={tI18n(
								"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.provider_enabled_88e4dabc",
							)}
						/>
						<span className="text-sm">
							{tI18n(
								"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.enable_5342e09f",
							)}
						</span>
					</div>
				</div>
				<div className="border border-solid p-6 rounded-lg">
					<ProviderForm
						editing
						key={provider.id}
						bedrockSavedAccessCredentials={hasBedrockStoredCredentials(
							provider,
						)}
						bedrockExternalId={bedrockExternalId(provider)}
						openAiAnthropicSavedApiKey={openAiAnthropicSavedApiKey}
						openAiAnthropicMaskedApiKey={openAiAnthropicMaskedApiKey}
						initialValues={aiProviderToFormValues(provider)}
						isLoading={updateMutation.isPending}
						submitError={updateMutation.error}
						onSubmit={async (values) => {
							const request = providerFormValuesToUpdate(values, provider);
							try {
								const updated = await updateMutation.mutateAsync(request);
								queryClient.setQueryData(aiProviderKeyFor(providerId), updated);
								toast.success(
									tI18n(
										"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.provider_value0_updated_f44d23e8",
										{
											value0: updated.display_name || updated.name,
										},
									),
								);
							} catch (error) {
								toast.error(
									getErrorMessage(
										error,
										tI18n(
											"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.failed_to_update_provider_value0_bc2bd4a7",
											{
												value0: provider.display_name || provider.name,
											},
										),
									),
								);
							}
						}}
					/>
				</div>
				<DeleteDialog
					key={provider.name}
					isOpen={deleteDialogOpen}
					title={tI18n(
						"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.delete_provider_89413209",
					)}
					entity={tI18n(
						"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.provider_5c4c1964",
					)}
					name={provider.name}
					confirmLoading={deleteMutation.isPending}
					onCancel={() => {
						setDeleteDialogOpen(false);
					}}
					onConfirm={() => {
						deleteMutation.mutate(undefined, {
							onSuccess: () => {
								toast.success(
									tI18n(
										"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.provider_value0_deleted_8f45c4d0",
										{
											value0: provider.display_name || provider.name,
										},
									),
								);
								setDeleteDialogOpen(false);
								void navigate(BACK_HREF, { replace: true });
							},
							onError: (error) => {
								toast.error(
									getErrorMessage(
										error,
										tI18n(
											"AISettingsPage.ProvidersPage.UpdateProviderPage.UpdateProviderPageView.failed_to_delete_provider_value0_6990862c",
											{
												value0: provider.display_name || provider.name,
											},
										),
									),
								);
							},
						});
					}}
				/>
			</div>
		</>
	);
};

export default UpdateProviderPageView;
