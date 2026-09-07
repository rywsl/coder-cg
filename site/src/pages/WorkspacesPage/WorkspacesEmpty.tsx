import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { Template } from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { linkToTemplate, useLinks } from "#/modules/navigation";

interface WorkspacesEmptyProps {
	isUsingFilter: boolean;
	templates?: Template[];
	canCreateTemplate: boolean;
	canCreateWorkspace: boolean;
}

export const WorkspacesEmpty: FC<WorkspacesEmptyProps> = ({
	isUsingFilter,
	templates,
	canCreateTemplate,
	canCreateWorkspace,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const getLink = useLinks();

	const totalFeaturedTemplates = 6;
	const featuredTemplates = templates?.slice(0, totalFeaturedTemplates);
	const defaultTitle = tI18n(
		"WorkspacesPage.WorkspacesEmpty.create_a_workspace_954bd1fe",
	);
	const defaultMessage = tI18n(
		"WorkspacesPage.WorkspacesEmpty.a_workspace_is_your_personal_customizable_develo_128fbf22",
	);

	if (isUsingFilter) {
		return (
			<EmptyState
				message={tI18n(
					"WorkspacesPage.WorkspacesEmpty.no_results_matched_your_search_c229583b",
				)}
			/>
		);
	}

	if (!canCreateWorkspace) {
		return (
			<EmptyState
				message={tI18n("WorkspacesPage.WorkspacesEmpty.no_workspaces_3e9f82e1")}
				description={tI18n(
					"WorkspacesPage.WorkspacesEmpty.you_don_t_have_permission_to_create_workspaces_c_51983e9c",
				)}
			/>
		);
	}

	if (templates && templates.length === 0 && canCreateTemplate) {
		return (
			<EmptyState
				message={defaultTitle}
				description={tI18n(
					"WorkspacesPage.WorkspacesEmpty.value0_to_create_a_workspace_you_first_need_to_c_6d90c81d",
					{
						value0: defaultMessage,
					},
				)}
				cta={
					<Button asChild>
						<Link to="/templates/new/builder">
							{tI18n(
								"WorkspacesPage.WorkspacesEmpty.create_a_template_39b06be6",
							)}
						</Link>
					</Button>
				}
			/>
		);
	}

	if (templates && templates.length === 0 && !canCreateTemplate) {
		return (
			<EmptyState
				message={defaultTitle}
				description={tI18n(
					"WorkspacesPage.WorkspacesEmpty.value0_there_are_no_templates_available_but_you__52f37992",
					{
						value0: defaultMessage,
					},
				)}
			/>
		);
	}

	return (
		<EmptyState
			message={defaultTitle}
			description={tI18n(
				"WorkspacesPage.WorkspacesEmpty.value0_select_one_template_below_to_start_a336ffb3",
				{
					value0: defaultMessage,
				},
			)}
			cta={
				<div>
					<div className="flex flex-wrap gap-4 mb-6 justify-center max-w-[800px]">
						{featuredTemplates?.map((t) => (
							<Link
								key={t.id}
								to={`${getLink(
									linkToTemplate(t.organization_name, t.name),
								)}/workspace`}
								className="w-[320px] p-4 rounded-md border border-solid border-surface-quaternary text-left flex gap-4 no-underline text-inherit hover:bg-surface-grey"
							>
								<div className="shrink-0 pt-1">
									<Avatar variant="icon" src={t.icon} fallback={t.name} />
								</div>

								<div className="w-full min-w-0">
									<h4 className="text-sm font-semibold m-0 overflow-hidden truncate whitespace-nowrap">
										{t.display_name || t.name}
									</h4>

									<p
										// We've had users plug URLs directly into the
										// descriptions, when those URLS have no hyphens or other
										// easy semantic breakpoints. Need to set this to ensure
										// those URLs don't break outside their containing boxes
										className="text-sm text-gray-400 leading-[1.4] m-0 pt-1 wrap-break-word"
									>
										{t.description}
									</p>
								</div>
							</Link>
						))}
					</div>

					{templates && templates.length > totalFeaturedTemplates && (
						<Button asChild>
							<Link to="/templates">
								{tI18n(
									"WorkspacesPage.WorkspacesEmpty.see_all_templates_b852c331",
								)}
							</Link>
						</Button>
					)}
				</div>
			}
		/>
	);
};
