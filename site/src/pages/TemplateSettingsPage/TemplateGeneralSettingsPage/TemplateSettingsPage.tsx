import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	invalidateTemplateListQueries,
	templateByNameKey,
} from "#/api/queries/templates";
import type { UpdateTemplateMeta } from "#/api/typesGenerated";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import { pageTitle } from "#/utils/page";
import { useTemplateSettings } from "../TemplateSettingsLayout";
import { TemplateSettingsPageView } from "./TemplateSettingsPageView";

const TemplateSettingsPage: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	const { template: templateName } = useParams() as { template: string };
	const navigate = useNavigate();
	const getLink = useLinks();
	const { template } = useTemplateSettings();
	const queryClient = useQueryClient();
	const { entitlements } = useDashboard();
	const accessControlEnabled = entitlements.features.access_control.enabled;
	const advancedSchedulingEnabled =
		entitlements.features.advanced_template_scheduling.enabled;
	const sharedPortControlsEnabled =
		entitlements.features.control_shared_ports.enabled;

	const {
		mutate: updateTemplate,
		isPending: isSubmitting,
		error: submitError,
	} = useMutation({
		mutationFn: (data: UpdateTemplateMeta) => {
			return API.updateTemplateMeta(template.id, data);
		},
		onSuccess: async (data) => {
			// This update has a chance to return a 304 which means nothing was updated.
			// In this case, the return payload will be empty and we should use the
			// original template data.
			if (!data) {
				data = template;
			} else {
				// Use data.name because an admin may have renamed the template.
				await Promise.all([
					invalidateTemplateListQueries(queryClient),
					queryClient.invalidateQueries({
						queryKey: templateByNameKey(template.organization_name, data.name),
					}),
				]);
			}
			toast.success(
				tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsPage.template_value0_updated_successfully_0d1a056b",
					{
						value0: data.name,
					},
				),
			);
			navigate(getLink(linkToTemplate(data.organization_name, data.name)));
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(
					error,
					tI18n(
						"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsPage.failed_to_update_template_value0_2b242a34",
						{
							value0: template.name,
						},
					),
				),
				{
					description: getErrorDetail(error),
				},
			);
		},
	});

	return (
		<>
			<title>
				{pageTitle(
					template.name,
					tI18n(
						"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsPage.general_settings_de322f87",
					),
				)}
			</title>
			<TemplateSettingsPageView
				isSubmitting={isSubmitting}
				template={template}
				submitError={submitError}
				onCancel={() => {
					navigate(
						getLink(linkToTemplate(template.organization_name, templateName)),
					);
				}}
				onSubmit={(templateSettings) => {
					updateTemplate({
						...template,
						...templateSettings,
					});
				}}
				accessControlEnabled={accessControlEnabled}
				advancedSchedulingEnabled={advancedSchedulingEnabled}
				sharedPortControlsEnabled={sharedPortControlsEnabled}
			/>
		</>
	);
};

export default TemplateSettingsPage;
