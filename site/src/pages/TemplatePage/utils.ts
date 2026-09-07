import type { Template } from "#/api/typesGenerated";
import { i18n } from "#/i18n";
import { pageTitle } from "#/utils/page";

export const getTemplatePageTitle = (title: string, template: Template) => {
	return pageTitle(
		i18n.t("templates:TemplatePage.utils.value0_value1_11a196e1", {
			value0:
				template.display_name.length > 0
					? template.display_name
					: template.name,
			value1: title,
		}),
	);
};
