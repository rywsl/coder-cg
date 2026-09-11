import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router";
import { buildInfo } from "#/api/queries/buildInfo";
import { provisionerDaemons } from "#/api/queries/organizations";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { useEmbeddedMetadata } from "#/hooks/useEmbeddedMetadata";
import { useOrganizationSettings } from "#/modules/management/OrganizationSettingsLayout";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { OrganizationProvisionersPageView } from "./OrganizationProvisionersPageView";

const OrganizationProvisionersPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const { organization: organizationName } = useParams() as {
		organization: string;
	};
	const [searchParams, setSearchParams] = useSearchParams();
	const queryParams = {
		ids: searchParams.get("ids") ?? "",
		tags: searchParams.get("tags") ?? "",
		offline: searchParams.get("offline") === "true",
	};
	const { organization, organizationPermissions } = useOrganizationSettings();
	const { metadata } = useEmbeddedMetadata();
	const buildInfoQuery = useQuery(buildInfo(metadata["build-info"]));
	const provisionersQuery = useQuery({
		...provisionerDaemons(organizationName, {
			...queryParams,
			limit: 100,
		}),
		enabled: !!organization,
	});

	if (!organization) {
		return (
			<EmptyState
				message={tI18n(
					"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPage.organization_not_found_00c50f7a",
				)}
			/>
		);
	}

	const title = (
		<title>
			{pageTitle(
				tI18n(
					"OrganizationSettingsPage.OrganizationProvisionersPage.OrganizationProvisionersPage.provisioners_82d4a12e",
				),
				organization.display_name || organization.name,
			)}
		</title>
	);

	if (!organizationPermissions?.viewProvisioners) {
		return (
			<>
				{title}
				<RequirePermission isFeatureVisible={false} />
			</>
		);
	}

	return (
		<>
			{title}
			<OrganizationProvisionersPageView
				error={provisionersQuery.error}
				provisioners={provisionersQuery.data}
				buildVersion={buildInfoQuery.data?.version}
				onRetry={provisionersQuery.refetch}
				filter={queryParams}
				onFilterChange={({ ids, offline }) => {
					setSearchParams({
						ids,
						offline: offline.toString(),
					});
				}}
			/>
		</>
	);
};

export default OrganizationProvisionersPage;
