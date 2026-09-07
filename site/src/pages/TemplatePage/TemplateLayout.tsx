import {
	createContext,
	type FC,
	type PropsWithChildren,
	Suspense,
	useContext,
} from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { API } from "#/api/api";
import { checkAuthorization } from "#/api/queries/authCheck";
import type { AuthorizationRequest } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { Margins } from "#/components/Margins/Margins";
import { LinkTabs, LinkTabsList, TabLink } from "#/components/Tabs/Tabs";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import {
	type WorkspacePermissions,
	workspacePermissionChecks,
} from "#/modules/permissions/workspaces";
import { TemplatePageHeader } from "./TemplatePageHeader";

const templatePermissions = (
	templateId: string,
): AuthorizationRequest["checks"] => ({
	canUpdateTemplate: {
		object: {
			resource_type: "template",
			resource_id: templateId,
		},
		action: "update",
	},
	canReadInsights: {
		object: {
			resource_type: "template",
			resource_id: templateId,
		},
		action: "view_insights",
	},
});

const fetchTemplate = async (organizationId: string, templateName: string) => {
	const template = await API.getTemplateByName(organizationId, templateName);

	const [activeVersion, permissions] = await Promise.all([
		API.getTemplateVersion(template.active_version_id),
		API.checkAuthorization({
			checks: templatePermissions(template.id),
		}),
	]);

	return {
		template,
		activeVersion,
		permissions,
	};
};

type TemplateLayoutContextValue = Awaited<ReturnType<typeof fetchTemplate>>;

const TemplateLayoutContext = createContext<
	TemplateLayoutContextValue | undefined
>(undefined);

export const useTemplateLayoutContext = (): TemplateLayoutContextValue => {
	const context = useContext(TemplateLayoutContext);
	if (!context) {
		throw new Error(
			"useTemplateLayoutContext only can be used inside of TemplateLayout",
		);
	}
	return context;
};

export const TemplateLayout: FC<PropsWithChildren> = ({
	children = <Outlet />,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const navigate = useNavigate();
	const { user: me } = useAuthenticated();
	const { organization: organizationName = "default", template: templateName } =
		useParams() as { organization?: string; template: string };
	const { data, error, isLoading } = useQuery({
		queryKey: ["template", templateName],
		queryFn: () => fetchTemplate(organizationName, templateName),
	});
	const workspacePermissionsQuery = useQuery({
		...checkAuthorization({
			checks: workspacePermissionChecks(
				data?.template.organization_id ?? "",
				me.id,
			),
		}),
		enabled: Boolean(data),
	});

	const location = useLocation();
	const paths = location.pathname.split("/");
	const templateNamePath = paths.at(-1);
	const activeTab =
		templateNamePath === templateName
			? "summary"
			: (templateNamePath as string);
	// Auditors should also be able to view insights, but do not automatically
	// have permission to update templates. Need both checks.
	const shouldShowInsights =
		data?.permissions?.canUpdateTemplate || data?.permissions?.canReadInsights;
	const { workspace_prebuilds: isWorkspacePrebuildsEnabled } =
		useFeatureVisibility();

	if (error || workspacePermissionsQuery.error) {
		return (
			<div className="p-4">
				<ErrorAlert error={error} />
			</div>
		);
	}

	if (isLoading || !data || !workspacePermissionsQuery.data) {
		return <Loader />;
	}

	return (
		<div className="pb-12">
			<TemplatePageHeader
				template={data.template}
				activeVersion={data.activeVersion}
				permissions={data.permissions}
				workspacePermissions={
					workspacePermissionsQuery.data as WorkspacePermissions
				}
				onDeleteTemplate={() => {
					navigate("/templates");
				}}
			/>
			<LinkTabs active={activeTab} className="mb-10 -mt-3">
				<Margins>
					<LinkTabsList>
						<TabLink to="docs" value="docs">
							{tI18n("TemplatePage.TemplateLayout.docs_7af023c4")}
						</TabLink>
						{data.permissions.canUpdateTemplate && (
							<TabLink to="files" value="files">
								{tI18n("TemplatePage.TemplateLayout.source_code_bc47da66")}
							</TabLink>
						)}
						<TabLink to="resources" value="resources">
							{tI18n("TemplatePage.TemplateLayout.resources_e89b30aa")}
						</TabLink>
						<TabLink to="versions" value="versions">
							{tI18n("TemplatePage.TemplateLayout.versions_f89ea270")}
						</TabLink>
						<TabLink to="embed" value="embed">
							{tI18n("TemplatePage.TemplateLayout.embed_7512561d")}
						</TabLink>
						{shouldShowInsights && (
							<TabLink to="insights" value="insights">
								{tI18n("TemplatePage.TemplateLayout.insights_2a932f90")}
							</TabLink>
						)}
						{isWorkspacePrebuildsEnabled &&
							data.permissions.canUpdateTemplate && (
								<TabLink to="prebuilds" value="prebuilds">
									{tI18n("TemplatePage.TemplateLayout.prebuilds_0fbe5564")}
								</TabLink>
							)}
					</LinkTabsList>
				</Margins>
			</LinkTabs>
			<Margins>
				<TemplateLayoutContext.Provider value={data}>
					<Suspense fallback={<Loader />}>{children}</Suspense>
				</TemplateLayoutContext.Provider>
			</Margins>
		</div>
	);
};
