import { isAxiosError } from "axios";
import { ArrowLeftIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	Link,
	Navigate,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import * as oauth2 from "#/api/queries/oauth2";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import { Loader } from "#/components/Loader/Loader";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { createDayString } from "#/utils/createDayString";
import { pageTitle } from "#/utils/page";
import { OAuth2AppForm } from "./OAuth2AppForm";

const BACK_HREF = "/deployment/oauth2-provider/apps";

export const EditOAuth2AppPageView: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { appId } = useParams<{ appId: string }>();
	const { permissions } = useAuthenticated();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [iconOverride, setIconOverride] = useState<string>();
	// When a new secret is created it is returned with the full secret. This is
	// the only time it will be visible. The secret list only returns a truncated
	// version. Once the user acknowledges the secret we clear it from state.
	const [fullNewSecret, setFullNewSecret] =
		useState<TypesGen.OAuth2ProviderAppSecretFull>();

	const appQuery = useQuery({
		...oauth2.getApp(appId ?? ""),
		enabled: Boolean(appId),
	});
	const secretsQuery = useQuery({
		...oauth2.getAppSecrets(appId ?? ""),
		enabled: Boolean(appId) && permissions.viewOAuth2AppSecrets,
	});

	const putAppMutation = useMutation(oauth2.putApp(queryClient));
	const deleteAppMutation = useMutation(oauth2.deleteApp(queryClient));
	const postSecretMutation = useMutation(oauth2.postAppSecret(queryClient));
	const deleteSecretMutation = useMutation(oauth2.deleteAppSecret(queryClient));

	const app = appQuery.data;
	const title = (
		<title>
			{pageTitle(
				app?.name ??
					tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.loading_47d2a515",
					),
				tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.oauth2_applications_5e9425a3",
				),
			)}
		</title>
	);

	if (!appId) {
		return <Navigate to={BACK_HREF} replace />;
	}

	if (appQuery.isLoading) {
		return (
			<>
				{title}
				<Loader fullscreen />
			</>
		);
	}

	if (appQuery.isError) {
		const status = isAxiosError(appQuery.error)
			? appQuery.error.response?.status
			: undefined;
		if (status === 404) {
			return <Navigate to={BACK_HREF} replace />;
		}
		return (
			<>
				{title}
				<div className="flex flex-col gap-4">
					<p className="text-content-secondary m-0">
						{getErrorMessage(
							appQuery.error,
							tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.failed_to_load_oauth2_application_8ba4283e",
							),
						)}
					</p>
					<Button variant="subtle" asChild className="-ml-3">
						<Link to={BACK_HREF}>
							<ArrowLeftIcon />
							<span>
								{tI18n(
									"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.back_to_applications_494219fd",
								)}
							</span>
						</Link>
					</Button>
				</div>
			</>
		);
	}

	if (!app) {
		return <Navigate to={BACK_HREF} replace />;
	}

	const canEditApp = permissions.editOAuth2App;
	const canDeleteApp = permissions.deleteOAuth2App;
	const canViewAppSecrets = permissions.viewOAuth2AppSecrets;
	const isMutating =
		putAppMutation.isPending ||
		deleteAppMutation.isPending ||
		postSecretMutation.isPending ||
		deleteSecretMutation.isPending;

	return (
		<>
			{title}
			<div className="flex justify-between items-center">
				<Button variant="subtle" asChild className="-ml-3">
					<Link to={BACK_HREF}>
						<ArrowLeftIcon />
						<span>
							{tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.back_to_applications_494219fd",
							)}
						</span>
					</Link>
				</Button>
				{canDeleteApp && (
					<Button
						type="button"
						variant="destructive"
						disabled={isMutating}
						onClick={() => setDeleteDialogOpen(true)}
					>
						<span>
							{tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.delete_e2d0a549",
							)}
						</span>
					</Button>
				)}
			</div>
			<div className="flex flex-col gap-6 pt-6">
				<div className="flex items-center gap-4 min-w-0">
					<Avatar
						variant="icon"
						size="lg"
						src={iconOverride ?? app.icon}
						fallback={app.name}
					/>
					<SettingsHeaderTitle>
						<span className="block min-w-0 truncate">{app.name}</span>
					</SettingsHeaderTitle>
				</div>

				<p className="text-sm text-content-secondary m-0">
					{tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.configure_this_application_to_use_coder_as_an_oa_c5ba2a63",
					)}
				</p>

				{searchParams.has("created") && (
					<Alert severity="info" dismissible>
						{tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.your_oauth2_application_has_been_created_generat_1f0b2afb",
						)}
					</Alert>
				)}

				<dl className="m-0 flex flex-col gap-1.5">
					<EndpointField
						label={tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.client_id_8726db01",
						)}
						value={app.id}
					/>
					<EndpointField
						label={tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.authorization_url_c70b5f2b",
						)}
						value={app.endpoints.authorization}
					/>
					<EndpointField
						label={tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.token_url_431e0036",
						)}
						value={app.endpoints.token}
					/>
				</dl>

				{secretsQuery.error ? (
					<ErrorAlert error={secretsQuery.error} />
				) : undefined}

				<div className="border border-solid p-6 rounded-lg flex flex-col gap-4">
					<h2 className="m-0 text-xl font-semibold">
						{tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.settings_74a883a0",
						)}
					</h2>
					<OAuth2AppForm
						key={app.id}
						app={app}
						onSubmit={async (req) => {
							try {
								const updated = await putAppMutation.mutateAsync({
									id: appId,
									req,
								});
								toast.success(
									tI18n(
										"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.successfully_updated_the_oauth2_application_valu_c11a8e6e",
										{
											value0: updated.name,
										},
									),
								);
							} catch (error) {
								toast.error(
									getErrorMessage(
										error,
										tI18n(
											"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.failed_to_update_value0_oauth2_application_1ae1acd5",
											{
												value0: req.name,
											},
										),
									),
									{ description: getErrorDetail(error) },
								);
							}
						}}
						isUpdating={putAppMutation.isPending}
						error={putAppMutation.error}
						disabled={!canEditApp}
						onIconChange={setIconOverride}
					/>
				</div>

				{canViewAppSecrets && (
					<div className="border border-solid p-6 rounded-lg flex flex-col gap-4">
						<div className="flex flex-row gap-4 items-center justify-between">
							<h2 className="m-0 text-xl font-semibold">
								{tI18n(
									"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.client_secrets_422a9c2f",
								)}
							</h2>
							<Button
								disabled={postSecretMutation.isPending || isMutating}
								type="button"
								onClick={() => {
									postSecretMutation.mutate(appId, {
										onSuccess: (secret) => {
											setFullNewSecret(secret);
											toast.success(
												tI18n(
													"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.successfully_generated_oauth2_client_secret_ec910c5d",
												),
											);
										},
										onError: (error) => {
											toast.error(
												getErrorMessage(
													error,
													tI18n(
														"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.failed_to_generate_oauth2_client_secret_264f5ed9",
													),
												),
												{ description: getErrorDetail(error) },
											);
										},
									});
								}}
							>
								<Spinner loading={postSecretMutation.isPending} />
								{tI18n(
									"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.generate_secret_f8450ed3",
								)}
							</Button>
						</div>

						<Table
							aria-label={tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.oauth2_client_secrets_01cdf474",
							)}
						>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[80%]">
										{tI18n(
											"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.secret_7e32a729",
										)}
									</TableHead>
									<TableHead className="w-[20%]">
										{tI18n(
											"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.last_used_830ec7f8",
										)}
									</TableHead>
									<TableHead className="w-[1%]" />
								</TableRow>
							</TableHeader>
							<TableBody size="lg">
								{secretsQuery.isLoading && <TableLoader />}
								{!secretsQuery.isLoading &&
									!secretsQuery.error &&
									(!secretsQuery.data || secretsQuery.data.length === 0) && (
										<TableEmpty
											message={tI18n(
												"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.no_client_secrets_have_been_generated_91a5d15c",
											)}
										/>
									)}
								{!secretsQuery.isLoading &&
									secretsQuery.data?.map((secret) => (
										<OAuth2SecretRow
											key={secret.id}
											secret={secret}
											isDeleting={deleteSecretMutation.isPending}
											onDelete={(secretId) => {
												deleteSecretMutation.mutate(
													{ appId, secretId },
													{
														onSuccess: () => {
															if (fullNewSecret?.id === secretId) {
																setFullNewSecret(undefined);
															}
															toast.success(
																tI18n(
																	"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.successfully_deleted_an_oauth2_client_secret_12f74607",
																),
															);
														},
														onError: (error) => {
															toast.error(
																getErrorMessage(
																	error,
																	tI18n(
																		"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.failed_to_delete_oauth2_client_secret_5f7a1cce",
																	),
																),
																{ description: getErrorDetail(error) },
															);
														},
													},
												);
											}}
										/>
									))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
			{fullNewSecret && (
				<ConfirmDialog
					hideCancel
					open={Boolean(fullNewSecret)}
					onConfirm={() => setFullNewSecret(undefined)}
					onClose={() => setFullNewSecret(undefined)}
					title={tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.oauth2_client_secret_8a7ee191",
					)}
					confirmText={tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.ok_565339bc",
					)}
					description={
						<>
							<p>
								{tI18n(
									"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.your_new_client_secret_is_displayed_below_make_s_170bac03",
								)}
							</p>
							<CodeExample
								code={fullNewSecret.client_secret_full}
								className="min-h-auto select-all w-full mt-6"
							/>
						</>
					}
				/>
			)}
			<DeleteDialog
				key={app.name}
				isOpen={deleteDialogOpen}
				title={tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.delete_oauth2_application_0ad9069d",
				)}
				entity={tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.oauth2_application_d3cbb4c5",
				)}
				name={app.name}
				info={tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.deleting_this_oauth2_application_will_immediatel_50f80c6c",
				)}
				confirmLoading={deleteAppMutation.isPending}
				onCancel={() => setDeleteDialogOpen(false)}
				onConfirm={() => {
					deleteAppMutation.mutate(appId, {
						onSuccess: () => {
							toast.success(
								tI18n(
									"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.you_have_successfully_deleted_the_value0_oauth2__17403654",
									{
										value0: app.name,
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
										"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.failed_to_delete_value0_oauth2_application_1a7fb6fa",
										{
											value0: app.name,
										},
									),
								),
								{ description: getErrorDetail(error) },
							);
						},
					});
				}}
			/>
		</>
	);
};

type EndpointFieldProps = {
	label: string;
	value: string;
};

const EndpointField: FC<EndpointFieldProps> = ({ label, value }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex items-center gap-2">
			<dt className="text-sm">{label}</dt>
			<dd className="m-0">
				<div className="flex items-center gap-0.5">
					<code className="w-fit rounded-md bg-surface-secondary px-2 py-0.5 font-mono text-xs text-content-secondary">
						{value}
					</code>
					<CopyButton
						text={value}
						label={tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.copy_value0_a9a564b7",
							{
								value0: label,
							},
						)}
						size="icon"
						variant="subtle"
					/>
				</div>
			</dd>
		</div>
	);
};

type OAuth2SecretRowProps = {
	secret: TypesGen.OAuth2ProviderAppSecret;
	onDelete: (id: string) => void;
	isDeleting: boolean;
};

const OAuth2SecretRow: FC<OAuth2SecretRowProps> = ({
	secret,
	onDelete,
	isDeleting,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [showDelete, setShowDelete] = useState(false);

	return (
		<TableRow data-testid={`secret-${secret.id}`}>
			<TableCell>*****{secret.client_secret_truncated}</TableCell>
			<TableCell data-pixel="ignore">
				{secret.last_used_at
					? createDayString(secret.last_used_at)
					: tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.never_6300ef80",
						)}
			</TableCell>
			<TableCell>
				<ConfirmDialog
					type="delete"
					hideCancel={false}
					open={showDelete}
					onConfirm={() => {
						onDelete(secret.id);
						setShowDelete(false);
					}}
					onClose={() => setShowDelete(false)}
					title={tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.delete_oauth2_client_secret_921bd4de",
					)}
					confirmLoading={isDeleting}
					confirmText={tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.delete_e2d0a549",
					)}
					description={
						<>
							{tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.deleting_8c4133b4",
							)}
							<strong>*****{secret.client_secret_truncated}</strong>
							{tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.is_irreversible_and_will_revoke_all_the_tokens_g_b425bd46",
							)}
						</>
					}
				/>
				<Button variant="destructive" onClick={() => setShowDelete(true)}>
					{tI18n(
						"DeploymentSettingsPage.OAuth2AppsSettingsPage.EditOAuth2AppPageView.delete_secret_1a48c8c8",
					)}
				</Button>
			</TableCell>
		</TableRow>
	);
};
