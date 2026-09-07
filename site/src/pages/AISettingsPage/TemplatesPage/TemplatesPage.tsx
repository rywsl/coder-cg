import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { organizationsPermissions } from "#/api/queries/organizations";
import { templates, updateTemplateMeta } from "#/api/queries/templates";
import type * as TypesGen from "#/api/typesGenerated";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { useTemplatesFilter } from "#/pages/TemplatesPage/TemplatesFilter";
import { pageTitle } from "#/utils/page";
import { TemplatesPageView } from "./TemplatesPageView";

const TemplatesPage: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const { permissions } = useAuthenticated();
	const { organizations } = useDashboard();
	const queryClient = useQueryClient();
	const canManageTemplates = permissions.updateAnyTemplate;
	const organizationPermissionsQuery = useQuery({
		...organizationsPermissions(
			organizations.map((organization) => organization.id),
		),
		enabled: canManageTemplates,
	});
	const authorizedOrganizationIDs = new Set(
		organizations
			.filter(
				(organization) =>
					organizationPermissionsQuery.data?.[organization.id]?.updateTemplates,
			)
			.map((organization) => organization.id),
	);
	const [searchParams, setSearchParams] = useSearchParams();
	const filterState = useTemplatesFilter({
		searchParams,
		onSearchParamsChange: setSearchParams,
		enabled: canManageTemplates,
	});
	const templatesQuery = useQuery({
		...templates({ q: filterState.filter.query }),
		enabled: canManageTemplates && organizationPermissionsQuery.isSuccess,
	});
	const authorizedTemplates = templatesQuery.data?.filter((template) =>
		authorizedOrganizationIDs.has(template.organization_id),
	);
	const refetch = organizationPermissionsQuery.error
		? organizationPermissionsQuery.refetch
		: templatesQuery.refetch;
	const error = organizationPermissionsQuery.error ?? templatesQuery.error;
	const updateTemplateMutation = useMutation(updateTemplateMeta(queryClient));
	const [pendingTemplateIDs, setPendingTemplateIDs] = useState<
		ReadonlySet<string>
	>(new Set());

	const toggleAgentsAllowed = async (
		template: TypesGen.Template,
		agentsAllowed: boolean,
	) => {
		setPendingTemplateIDs((current) => new Set(current).add(template.id));
		try {
			await updateTemplateMutation.mutateAsync({
				template,
				data: { agents_allowed: agentsAllowed },
			});
		} catch (error) {
			toast.error(
				tI18n(
					"AISettingsPage.TemplatesPage.TemplatesPage.value0_in_value1_value2_3bf30ed9",
					{
						value0: template.display_name || template.name,
						value1:
							template.organization_display_name || template.organization_name,
						value2: getErrorMessage(
							error,
							tI18n(
								"AISettingsPage.TemplatesPage.TemplatesPage.failed_to_update_whether_coder_agents_can_create_7267745e",
							),
						),
					},
				),
				{
					description: getErrorDetail(error),
					duration: Number.POSITIVE_INFINITY,
				},
			);
		} finally {
			setPendingTemplateIDs((current) => {
				const next = new Set(current);
				next.delete(template.id);
				return next;
			});
		}
	};

	return (
		<RequirePermission isFeatureVisible={canManageTemplates}>
			<title>
				{pageTitle(
					"Templates",
					tI18n(
						"AISettingsPage.TemplatesPage.TemplatesPage.ai_settings_a8e5e2c6",
					),
				)}
			</title>
			<TemplatesPageView
				filterState={filterState}
				templates={authorizedTemplates}
				isLoading={
					organizationPermissionsQuery.isLoading || templatesQuery.isLoading
				}
				error={error}
				onRetry={() => void refetch()}
				onToggleAgentsAllowed={toggleAgentsAllowed}
				pendingTemplateIDs={pendingTemplateIDs}
			/>
		</RequirePermission>
	);
};

export default TemplatesPage;
