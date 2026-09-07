import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { templateByNameKey } from "#/api/queries/templates";
import type { UpdateTemplateMeta } from "#/api/typesGenerated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import { pageTitle } from "#/utils/page";
import { useTemplateSettings } from "../TemplateSettingsLayout";
import { TemplateSchedulePageView } from "./TemplateSchedulePageView";

const TemplateSchedulePage: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	const getLink = useLinks();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { template } = useTemplateSettings();
	const { entitlements } = useDashboard();
	const { organization: organizationName = "default", template: templateName } =
		useParams() as { organization?: string; template: string };
	const allowAdvancedScheduling =
		entitlements.features.advanced_template_scheduling.enabled;

	const {
		mutate: updateTemplate,
		isPending: isSubmitting,
		error: submitError,
	} = useMutation({
		mutationFn: (data: UpdateTemplateMeta) =>
			API.updateTemplateMeta(template.id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: templateByNameKey(organizationName, templateName),
			});
			toast.success(
				tI18n(
					"TemplateSettingsPage.TemplateSchedulePage.TemplateSchedulePage.template_value0_schedule_updated_successfully_f7e3a81a",
					{
						value0: template.name,
					},
				),
			);
			// clear browser storage of workspaces impending deletion
			localStorage.removeItem("dismissedWorkspaceList"); // workspaces page
			localStorage.removeItem("dismissedWorkspace"); // workspace page
		},
	});

	return (
		<>
			<title>
				{pageTitle(
					template.name,
					tI18n(
						"TemplateSettingsPage.TemplateSchedulePage.TemplateSchedulePage.schedule_f4830a1d",
					),
				)}
			</title>
			<TemplateSchedulePageView
				allowAdvancedScheduling={allowAdvancedScheduling}
				isSubmitting={isSubmitting}
				template={template}
				submitError={submitError}
				onCancel={() => {
					navigate(getLink(linkToTemplate(organizationName, templateName)));
				}}
				onSubmit={updateTemplate}
			/>
		</>
	);
};

export default TemplateSchedulePage;
