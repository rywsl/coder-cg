import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceResource } from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Link } from "#/components/Link/Link";
import { useProxy } from "#/contexts/ProxyContext";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { docs } from "#/utils/docs";

interface WildcardHostnameWarningProps {
	// If resources are provided, show template-focused warning
	resources?: WorkspaceResource[];
}

export const WildcardHostnameWarning: FC<WildcardHostnameWarningProps> = ({
	resources,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const { proxy } = useProxy();
	const { permissions } = useAuthenticated();

	const hasResources = Boolean(resources);
	const canEditDeploymentConfig = Boolean(permissions.editDeploymentConfig);

	if (proxy.proxy?.wildcard_hostname) {
		return null;
	}

	if (hasResources) {
		const hasSubdomainCoderApp = resources!.some((resource) => {
			return resource.agents?.some((agent) =>
				agent.apps?.some((app) => app.subdomain),
			);
		});

		if (!hasSubdomainCoderApp) {
			return null;
		}
	}

	return (
		<Alert
			severity="warning"
			prominent
			className={
				hasResources
					? "rounded-none border-0 border-l-2 border-l-warning border-b-divider"
					: undefined
			}
		>
			<AlertTitle>
				{tI18n(
					"resources.WildcardHostnameWarning.some_workspace_applications_will_not_work_764fe964",
				)}
			</AlertTitle>
			<AlertDescription>
				<div>
					{hasResources
						? tI18n(
								"resources.WildcardHostnameWarning.this_template_contains_coder_app_resources_with_5128716b",
							)
						: tI18n(
								"resources.WildcardHostnameWarning.one_or_more_apps_in_this_workspace_have_fd711f21",
							)}{" "}
					<code className="py-px px-1 bg-surface-tertiary rounded-sm text-content-primary">
						subdomain = true
					</code>
					{canEditDeploymentConfig ? (
						<>
							{tI18n(
								"resources.WildcardHostnameWarning.but_subdomain_applications_are_not_configured_us_3cc93122",
							)}{" "}
							<code className="py-px px-1 bg-surface-tertiary rounded-sm text-content-primary">
								--wildcard-access-url
							</code>{" "}
							{tI18n(
								"resources.WildcardHostnameWarning.flag_when_starting_the_coder_server_cb2c744c",
							)}
						</>
					) : (
						tI18n(
							"resources.WildcardHostnameWarning.which_requires_a_coder_deployment_with_a_wildcar_871d6cb6",
						)
					)}
				</div>
				<div className="pt-2">
					<Link
						href={docs("/admin/networking/wildcard-access-url")}
						target="_blank"
					>
						<span className="font-semibold">
							{tI18n(
								"resources.WildcardHostnameWarning.learn_more_about_wildcard_access_url_7114e668",
							)}
						</span>
					</Link>
				</div>
			</AlertDescription>
		</Alert>
	);
};
