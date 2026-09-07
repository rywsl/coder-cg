import frontMatter from "front-matter";
import { useTranslation } from "react-i18next";
import { MemoizedMarkdown } from "#/components/Markdown/Markdown";
import { useTemplateLayoutContext } from "#/pages/TemplatePage/TemplateLayout";
import { pageTitle } from "#/utils/page";

export default function TemplateDocsPage() {
	const { t: tI18n } = useTranslation("templates");

	const { template, activeVersion } = useTemplateLayoutContext();
	const readme = frontMatter(activeVersion.readme);

	return (
		<>
			<title>
				{pageTitle(
					template.name,
					tI18n(
						"TemplatePage.TemplateDocsPage.TemplateDocsPage.documentation_c205924d",
					),
				)}
			</title>
			<div
				className="bg-surface-primary border border-solid border-border rounded-lg"
				id="readme"
			>
				<div className="text-content-secondary font-semibold py-4 px-6 border-b border-border">
					{tI18n(
						"TemplatePage.TemplateDocsPage.TemplateDocsPage.readme_md_b3356305",
					)}
				</div>
				<div className="px-8 pt-2 pb-12 max-w-[860px]">
					<MemoizedMarkdown>{readme.body}</MemoizedMarkdown>
				</div>
			</div>
		</>
	);
}
