import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { getApps, revokeApp } from "#/api/queries/oauth2";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import {
	SettingsHeader,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import OAuth2ProviderPageView from "./OAuth2ProviderPageView";

const OAuth2ProviderPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { user: me } = useAuthenticated();
	const queryClient = useQueryClient();
	const userOAuth2AppsQuery = useQuery(getApps(me.id));
	const revokeAppMutation = useMutation(revokeApp(queryClient, me.id));
	const [appIdToRevoke, setAppIdToRevoke] = useState<string>();
	const appToRevoke = userOAuth2AppsQuery.data?.find(
		(app) => app.id === appIdToRevoke,
	);

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.oauth2_applications_e740eaa0",
					)}
				</SettingsHeaderTitle>
			</SettingsHeader>
			<OAuth2ProviderPageView
				isLoading={userOAuth2AppsQuery.isLoading}
				error={userOAuth2AppsQuery.error}
				apps={userOAuth2AppsQuery.data}
				revoke={(app) => {
					setAppIdToRevoke(app.id);
				}}
			/>
			{appToRevoke !== undefined && (
				<DeleteDialog
					title={tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.revoke_application_0a5cbf44",
					)}
					verb={tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.revoking_8414d097",
					)}
					info={tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.this_will_invalidate_any_tokens_created_by_the_o_f0821577",
						{
							value0: appToRevoke.name,
						},
					)}
					label={tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.name_of_the_application_to_revoke_e0f5f64a",
					)}
					isOpen
					confirmLoading={revokeAppMutation.isPending}
					name={appToRevoke.name}
					entity={tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.application_1fe28920",
					)}
					onCancel={() => setAppIdToRevoke(undefined)}
					onConfirm={async () => {
						try {
							await revokeAppMutation.mutateAsync(appToRevoke.id);
							toast.success(
								tI18n(
									"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.oauth2_application_value0_revoked_successfully_8bd17c84",
									{
										value0: appToRevoke.name,
									},
								),
							);
							setAppIdToRevoke(undefined);
						} catch (error) {
							toast.error(
								getErrorMessage(
									error,
									tI18n(
										"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPage.failed_to_revoke_application_b0ed597d",
									),
								),
								{
									description: getErrorDetail(error),
								},
							);
						}
					}}
				/>
			)}
		</>
	);
};

export default OAuth2ProviderPage;
