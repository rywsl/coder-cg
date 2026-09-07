import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { entitlements, refreshEntitlements } from "#/api/queries/entitlements";
import { insightsUserStatusCounts } from "#/api/queries/insights";
import { licenses, licensesKey } from "#/api/queries/licenses";
import { useEmbeddedMetadata } from "#/hooks/useEmbeddedMetadata";
import { pageTitle } from "#/utils/page";
import LicensesSettingsPageView from "./LicensesSettingsPageView";

const LicensesSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const queryClient = useQueryClient();
	const [searchParams, setSearchParams] = useSearchParams();
	const success = searchParams.get("success");
	const [confettiOn, setConfettiOn] = useState(false);

	const { metadata } = useEmbeddedMetadata();
	const entitlementsQuery = useQuery(entitlements(metadata.entitlements));

	const { data: userStatusCount } = useQuery(insightsUserStatusCounts());

	const refreshEntitlementsMutation = useMutation(
		refreshEntitlements(queryClient),
	);

	useEffect(() => {
		if (entitlementsQuery.error) {
			toast.error(
				getErrorMessage(
					entitlementsQuery.error,
					tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPage.failed_to_fetch_entitlements_e415ee6b",
					),
				),
				{
					description: getErrorDetail(entitlementsQuery.error),
				},
			);
		}
	}, [entitlementsQuery.error]);

	const { mutate: removeLicenseApi, isPending: isRemovingLicense } =
		useMutation({
			mutationFn: API.removeLicense,
			onSuccess: () => {
				toast.success(
					tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPage.successfully_removed_license_0bf2f28b",
					),
				);
				void queryClient.invalidateQueries({ queryKey: licensesKey });
			},
			onError: (error) => {
				toast.error(
					tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPage.failed_to_remove_license_b48f8f20",
					),
					{
						description: getErrorDetail(error),
					},
				);
			},
		});

	const { data: licensesList, isLoading } = useQuery(licenses());

	useEffect(() => {
		if (!success) {
			return;
		}

		setConfettiOn(true);
		const timeout = setTimeout(() => {
			setConfettiOn(false);
			setSearchParams();
		}, 2000);

		return () => {
			clearTimeout(timeout);
		};
	}, [setSearchParams, success]);

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPage.license_settings_13bb208a",
					),
				)}
			</title>
			<LicensesSettingsPageView
				showConfetti={confettiOn}
				isLoading={isLoading}
				isRefreshing={refreshEntitlementsMutation.isPending}
				hasUserLimitEntitlementData={
					entitlementsQuery.data?.features.user_limit !== undefined
				}
				userLimitActual={entitlementsQuery.data?.features.user_limit?.actual}
				userLimitLimit={entitlementsQuery.data?.features.user_limit?.limit}
				licenses={licensesList}
				isRemovingLicense={isRemovingLicense}
				removeLicense={(licenseId: number) => removeLicenseApi(licenseId)}
				activeUsers={userStatusCount?.active}
				managedAgentFeature={
					entitlementsQuery.data?.features.managed_agent_limit
				}
				aiGovernanceUserFeature={
					entitlementsQuery.data?.features.ai_governance_user_limit
				}
				agentRuntimeHoursFeature={
					entitlementsQuery.data?.features.agent_runtime_hours
				}
				refreshEntitlements={async () => {
					try {
						await refreshEntitlementsMutation.mutateAsync();
						toast.success(
							tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPage.successfully_removed_license_0bf2f28b",
							),
						);
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"DeploymentSettingsPage.LicensesSettingsPage.LicensesSettingsPage.failed_to_remove_license_b48f8f20",
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
					}
				}}
			/>
		</>
	);
};

export default LicensesSettingsPage;
