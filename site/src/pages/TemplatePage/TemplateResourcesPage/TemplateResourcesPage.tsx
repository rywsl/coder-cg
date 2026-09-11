import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { API } from "#/api/api";
import { useTemplateLayoutContext } from "#/pages/TemplatePage/TemplateLayout";
import { getTemplatePageTitle } from "../utils";
import { TemplateResourcesPageView } from "./TemplateResourcesPageView";

const TemplateResourcesPage: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	const { template, activeVersion } = useTemplateLayoutContext();
	const { data: resources } = useQuery({
		queryKey: ["templates", template.id, "resources"],
		queryFn: () => API.getTemplateVersionResources(activeVersion.id),
	});

	return (
		<>
			<title>
				{getTemplatePageTitle(
					tI18n(
						"TemplatePage.TemplateResourcesPage.TemplateResourcesPage.template_0575f29d",
					),
					template,
				)}
			</title>
			<TemplateResourcesPageView resources={resources} template={template} />
		</>
	);
};

export default TemplateResourcesPage;
