import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	createUserSecret,
	deleteUserSecret,
	importUserSecrets,
	updateUserSecret,
	userSecrets,
} from "#/api/queries/userSecrets";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { SecretsPageView } from "./SecretsPageView";
import { buildImportSuccessMessage } from "./secretForm";

const SecretsPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { user: me } = useAuthenticated();
	const queryClient = useQueryClient();
	const secretsQueryOptions = userSecrets(me.id);
	const secretsQuery = useQuery(secretsQueryOptions);
	const createSecretMutation = useMutation(
		createUserSecret(queryClient, me.id),
	);
	const updateSecretMutation = useMutation(
		updateUserSecret(queryClient, me.id),
	);
	const deleteSecretMutation = useMutation(
		deleteUserSecret(queryClient, me.id),
	);
	const importSecretsMutation = useMutation(
		importUserSecrets(queryClient, me.id),
	);

	return (
		<SecretsPageView
			secrets={secretsQuery.data}
			isLoading={!secretsQuery.isFetched && secretsQuery.isFetching}
			hasLoaded={secretsQuery.isSuccess}
			isCreating={createSecretMutation.isPending}
			isUpdating={updateSecretMutation.isPending}
			isDeleting={deleteSecretMutation.isPending}
			getSecretsError={secretsQuery.error}
			onCreateSecret={async (request) => {
				const secret = await createSecretMutation.mutateAsync(request);
				toast.success(
					tI18n(
						"UserSettingsPage.SecretsPage.SecretsPage.created_secret_value0_successfully_0730f247",
						{
							value0: secret.name,
						},
					),
				);
				return secret;
			}}
			onUpdateSecret={async (name, request) => {
				const secret = await updateSecretMutation.mutateAsync({
					name,
					request,
				});
				toast.success(
					tI18n(
						"UserSettingsPage.SecretsPage.SecretsPage.updated_secret_value0_successfully_186f0548",
						{
							value0: secret.name,
						},
					),
				);
				return secret;
			}}
			onImportSecrets={async (request) => {
				const secrets = await importSecretsMutation.mutateAsync(request);
				toast.success(buildImportSuccessMessage(secrets));
				return secrets;
			}}
			onDeleteSecret={async (secret) => {
				try {
					await deleteSecretMutation.mutateAsync(secret.name);
					toast.success(
						tI18n(
							"UserSettingsPage.SecretsPage.SecretsPage.deleted_secret_value0_successfully_481fde61",
							{
								value0: secret.name,
							},
						),
					);
				} catch (error) {
					toast.error(
						getErrorMessage(
							error,
							tI18n(
								"UserSettingsPage.SecretsPage.SecretsPage.failed_to_delete_secret_9b3671d3",
							),
						),
						{
							description: getErrorDetail(error),
						},
					);
					throw error;
				}
			}}
			onToggleSecretEnabled={async (secret, enabled) => {
				try {
					await updateSecretMutation.mutateAsync({
						name: secret.name,
						request: { enabled },
					});
					toast.success(
						tI18n(
							"UserSettingsPage.SecretsPage.SecretsPage.value0_secret_value1_57fb8387",
							{
								value0: enabled ? "Enabled" : "Disabled",
								value1: secret.name,
							},
						),
					);
				} catch (error) {
					toast.error(
						getErrorMessage(
							error,
							tI18n(
								"UserSettingsPage.SecretsPage.SecretsPage.failed_to_value0_secret_204f1091",
								{
									value0: enabled ? "enable" : "disable",
								},
							),
						),
						{ description: getErrorDetail(error) },
					);
					throw error;
				}
			}}
		/>
	);
};

export default SecretsPage;
