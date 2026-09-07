import { isAxiosError } from "axios";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getErrorMessage } from "#/api/errors";
import {
	chatModel,
	chatModels,
	deleteChatModel,
	updateChatModel,
} from "#/api/queries/chats";
import { Loader } from "#/components/Loader/Loader";
import { deriveProviderStates } from "#/modules/aiModels/providerStates";
import { pageTitle } from "#/utils/page";
import {
	organizationAddModelPath,
	splitModelQueryErrors,
	useOrganizationModels,
	useOrganizationModelsPath,
} from "../organizationModels";
import UpdateModelPageView from "./UpdateModelPageView";

const UpdateModelPage: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { modelId } = useParams<{ modelId: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { organization, permissions } = useOrganizationModels();
	const modelsPath = useOrganizationModelsPath();

	const modelQuery = useQuery(chatModel(organization.id, modelId ?? ""));
	const organizationModelsQuery = useQuery(chatModels(organization.id));
	const updateMutation = useMutation(updateChatModel(queryClient));
	const deleteMutation = useMutation(deleteChatModel(queryClient));
	const models = organizationModelsQuery.data?.models ?? [];
	const providerStates = deriveProviderStates(
		models,
		organizationModelsQuery.data?.providers ?? [],
	);
	const { loadError, refetchError } = splitModelQueryErrors(
		modelQuery,
		organizationModelsQuery,
	);
	const model = modelQuery.data;
	const currentDefaultModel = models.find((model) => model.is_default);

	const [providerKeyOverride, setProviderKeyOverride] = useState<string | null>(
		null,
	);
	const selectedProviderState =
		(providerKeyOverride
			? providerStates.find((ps) => ps.key === providerKeyOverride)
			: undefined) ??
		providerStates.find((ps) => ps.models.some((m) => m.id === modelId)) ??
		null;

	if (!modelId) {
		return <Navigate to={modelsPath} replace />;
	}

	if (modelQuery.isLoading || organizationModelsQuery.isLoading) {
		return (
			<>
				<title>
					{pageTitle(
						tI18n(
							"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.loading_47d2a515",
						),
						tI18n(
							"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.ai_settings_a8e5e2c6",
						),
					)}
				</title>
				<Loader fullscreen />
			</>
		);
	}

	if (
		modelQuery.error &&
		isAxiosError(modelQuery.error) &&
		(modelQuery.error.response?.status === 403 ||
			modelQuery.error.response?.status === 404)
	) {
		return <UpdateModelPageView state="notFound" />;
	}

	if (loadError) {
		return <UpdateModelPageView state="error" error={loadError} />;
	}

	if (!model) {
		return <UpdateModelPageView state="notFound" />;
	}

	return (
		<UpdateModelPageView
			state="loaded"
			model={model}
			refetchError={refetchError}
			currentDefaultModel={currentDefaultModel}
			providerStates={providerStates}
			selectedProviderState={selectedProviderState}
			onProviderChange={setProviderKeyOverride}
			isSaving={updateMutation.isPending}
			isDeleting={deleteMutation.isPending}
			canCreateModel={permissions?.createChatModelConfigs ?? false}
			canUpdateModel={permissions?.editChatModelConfigs ?? false}
			canShareModel={permissions?.shareChatModelConfigs ?? false}
			canDeleteModel={permissions?.deleteChatModelConfigs ?? false}
			onUpdateModel={async (id, req) => {
				try {
					const updated = await updateMutation.mutateAsync({
						organizationId: organization.id,
						modelId: id,
						req,
					});
					toast.success(
						tI18n(
							"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.model_value0_updated_b0962b04",
							{
								value0: updated.display_name || updated.model,
							},
						),
					);
					await navigate(modelsPath);
				} catch (error) {
					toast.error(
						getErrorMessage(
							error,
							tI18n(
								"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.failed_to_update_model_a446bfbd",
							),
						),
					);
				}
			}}
			onDeleteModel={async (id) => {
				try {
					await deleteMutation.mutateAsync({
						organizationId: organization.id,
						modelId: id,
					});
					toast.success(
						tI18n(
							"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.model_value0_deleted_e2e36cb6",
							{
								value0: model.display_name || model.model,
							},
						),
					);
					await navigate(modelsPath, { replace: true });
				} catch (error) {
					toast.error(
						getErrorMessage(
							error,
							tI18n(
								"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.failed_to_delete_model_c724a9e6",
							),
						),
					);
				}
			}}
			onDuplicate={() => {
				if (!selectedProviderState) return;
				void navigate(
					organizationAddModelPath(
						organization,
						new URLSearchParams({
							provider: selectedProviderState.key,
							duplicate: model.id,
						}),
					),
				);
			}}
			onToggleEnabled={(enabled) => {
				updateMutation.mutate(
					{
						organizationId: organization.id,
						modelId: model.id,
						req: { enabled },
					},
					{
						onSuccess: () => {
							toast.success(
								tI18n(
									"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.model_value0_value1_e15159f2",
									{
										value0: model.display_name || model.model,
										value1: enabled ? "enabled" : "disabled",
									},
								),
							);
						},
						onError: (error) => {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"AISettingsPage.ModelsPage.UpdateModelPage.UpdateModelPage.failed_to_update_model_a446bfbd",
									),
								),
							);
						},
					},
				);
			}}
		/>
	);
};

export default UpdateModelPage;
