import { SquareArrowOutUpRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { Button } from "#/components/Button/Button";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { docs } from "#/utils/docs";

export const WorkspaceWildcardWarning = () => {
	const { t: tI18n } = useTranslation("workspaces");

	const { permissions } = useAuthenticated();

	return (
		<div className="text-center max-w-md">
			<h3 className="font-medium text-content-primary text-base mb-3">
				{tI18n("apps.WorkspaceWildcardWarning.error_54a0e8c1")}
			</h3>
			<div className="text-content-secondary text-sm flex flex-col gap-3 items-center">
				<div className="px-4">
					{tI18n("apps.WorkspaceWildcardWarning.this_application_has_3b4aa8c5")}{" "}
					<code className="py-px px-1 bg-surface-tertiary rounded-sm text-content-primary">
						subdomain = true
					</code>
					{permissions.editDeploymentConfig ? (
						<>
							{tI18n(
								"apps.WorkspaceWildcardWarning.but_subdomain_applications_are_not_configured_th_249e979c",
							)}{" "}
							<code className="py-px px-1 bg-surface-tertiary rounded-sm text-content-primary whitespace-nowrap">
								--wildcard-access-url
							</code>{" "}
							{tI18n(
								"apps.WorkspaceWildcardWarning.flag_when_starting_the_coder_server_cb2c744c",
							)}
						</>
					) : (
						tI18n(
							"apps.WorkspaceWildcardWarning.which_requires_a_coder_deployment_with_a_wildcar_871d6cb6",
						)
					)}
				</div>
				<Button size="sm" variant="outline" asChild>
					<RouterLink to={docs("/admin/networking/wildcard-access-url")}>
						<SquareArrowOutUpRightIcon />
						{tI18n(
							"apps.WorkspaceWildcardWarning.learn_more_about_wildcard_access_url_7114e668",
						)}
					</RouterLink>
				</Button>
			</div>
		</div>
	);
};
