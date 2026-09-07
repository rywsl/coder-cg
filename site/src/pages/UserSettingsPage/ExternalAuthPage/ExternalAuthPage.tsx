import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	externalAuths,
	unlinkExternalAuths,
	validateExternalAuth,
} from "#/api/queries/externalAuth";
import type { ExternalAuthLinkProvider } from "#/api/typesGenerated";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import {
	SettingsHeader,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { ExternalAuthPageView } from "./ExternalAuthPageView";

const ExternalAuthPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const queryClient = useQueryClient();
	// This is used to tell the child components something was unlinked and things
	// need to be refetched
	const [unlinked, setUnlinked] = useState(0);

	const externalAuthsQuery = useQuery(externalAuths());
	const [appToUnlink, setAppToUnlink] = useState<ExternalAuthLinkProvider>();
	const unlinkAppMutation = useMutation(unlinkExternalAuths(queryClient));
	const validateAppMutation = useMutation(validateExternalAuth(queryClient));

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.external_authentication_1b308ef4",
					)}
				</SettingsHeaderTitle>
			</SettingsHeader>
			<ExternalAuthPageView
				isLoading={externalAuthsQuery.isLoading}
				getAuthsError={externalAuthsQuery.error}
				auths={externalAuthsQuery.data}
				unlinked={unlinked}
				onUnlinkExternalAuth={(provider) => {
					setAppToUnlink(provider);
				}}
				onValidateExternalAuth={async (providerID: string) => {
					try {
						const data = await validateAppMutation.mutateAsync(providerID);
						if (data.authenticated) {
							toast.success(
								tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.application_link_is_valid_1ef1ab7f",
								),
							);
						} else {
							toast.error(
								tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.application_link_is_not_valid_964953c1",
								),
								{
									description: tI18n(
										"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.please_unlink_the_application_and_reauthenticate_565d3dce",
									),
								},
							);
						}
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.error_validating_application_link_690bcb9b",
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
					}
				}}
			/>
			<DeleteDialog
				key={appToUnlink?.id}
				title={tI18n(
					"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.unlink_application_0b0c1a46",
				)}
				verb={tI18n(
					"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.unlinking_4e9e9576",
				)}
				info={
					appToUnlink?.supports_revocation
						? tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.this_action_will_remove_external_authentication__1badda78",
							)
						: tI18n(
								"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.this_action_will_not_revoke_the_access_token_fro_4da9fda1",
							)
				}
				label={tI18n(
					"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.name_of_the_application_to_unlink_b5a55e62",
				)}
				isOpen={appToUnlink !== undefined}
				confirmLoading={unlinkAppMutation.isPending}
				name={appToUnlink?.id ?? ""}
				entity={tI18n(
					"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.application_1fe28920",
				)}
				onCancel={() => setAppToUnlink(undefined)}
				onConfirm={async () => {
					if (!appToUnlink) {
						return;
					}
					try {
						const unlinkResp = await unlinkAppMutation.mutateAsync(
							appToUnlink.id,
						);
						// setAppToUnlink closes the modal
						setAppToUnlink(undefined);
						// refetch repopulates the external auth data
						await externalAuthsQuery.refetch();
						// this tells our child components to refetch their data
						// as at least 1 provider was unlinked.
						setUnlinked(unlinked + 1);
						toast.success(
							unlinkResp.token_revoked
								? "Successfully deleted external auth link and revoked token from the OAuth2 provider."
								: "Successfully deleted external auth link. Token has NOT been revoked from the OAuth2 provider.",
						);
					} catch (e) {
						toast.error(
							getErrorMessage(
								e,
								tI18n(
									"UserSettingsPage.ExternalAuthPage.ExternalAuthPage.error_unlinking_application_4833462d",
								),
							),
							{
								description: getErrorDetail(e),
							},
						);
					}
				}}
			/>
		</>
	);
};

export default ExternalAuthPage;
