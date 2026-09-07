import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { TemplateExample } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { Link } from "#/components/Link/Link";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TemplateExampleCard } from "#/modules/templates/TemplateExampleCard/TemplateExampleCard";
import { docs } from "#/utils/docs";

// Those are from https://github.com/coder/coder/tree/main/examples/templates
const featuredExampleIds = [
	"quickstart",
	"docker",
	"kubernetes",
	"aws-linux",
	"gcp-linux",
	"azure-linux",
];

const findFeaturedExamples = (examples: TemplateExample[]) => {
	const featuredExamples: TemplateExample[] = [];

	// We loop the featuredExampleIds first to keep the order
	for (const exampleId of featuredExampleIds) {
		for (const example of examples) {
			if (exampleId === example.id) {
				featuredExamples.push(example);
			}
		}
	}

	return featuredExamples;
};

interface EmptyTemplatesProps {
	canCreateTemplates: boolean;
	templateBuilderEnabled: boolean;
	examples: TemplateExample[];
	isUsingFilter: boolean;
}

export const EmptyTemplates: FC<EmptyTemplatesProps> = ({
	canCreateTemplates,
	templateBuilderEnabled,
	examples,
	isUsingFilter,
}) => {
	const { t: tI18n } = useTranslation("templates");

	if (isUsingFilter) {
		return (
			<TableEmpty
				message={tI18n(
					"TemplatesPage.EmptyTemplates.no_results_matched_your_search_c229583b",
				)}
			/>
		);
	}

	const featuredExamples = findFeaturedExamples(examples);

	if (canCreateTemplates) {
		return (
			<TableEmpty
				message={tI18n(
					"TemplatesPage.EmptyTemplates.create_your_first_template_805e8f3e",
				)}
				description={
					<>
						{tI18n(
							"TemplatesPage.EmptyTemplates.templates_are_written_in_terraform_and_describe__e7622c26",
						)}{" "}
						<Link
							href={docs("/admin/templates/creating-templates")}
							target="_blank"
							rel="noreferrer"
							showExternalIcon={false}
							className="p-0 text-xs"
						>
							{tI18n("TemplatesPage.EmptyTemplates.create_your_own_e1fa9c04")}
						</Link>
						.
					</>
				}
				cta={
					<div className="flex flex-col gap-8 items-center">
						<div className="flex flex-wrap justify-center gap-4">
							{featuredExamples.map((example) => (
								<TemplateExampleCard
									example={example}
									key={example.id}
									templateBuilderEnabled={templateBuilderEnabled}
								/>
							))}
						</div>
						<Button size="sm" asChild className="rounded-full">
							<RouterLink
								to={
									templateBuilderEnabled
										? "/templates/new/builder"
										: "/starter-templates"
								}
							>
								{tI18n(
									"TemplatesPage.EmptyTemplates.view_all_starter_templates_fc3ad991",
								)}
							</RouterLink>
						</Button>
					</div>
				}
			/>
		);
	}

	return (
		<TableEmpty
			message={tI18n("TemplatesPage.EmptyTemplates.create_a_template_c0794aff")}
			description={tI18n(
				"TemplatesPage.EmptyTemplates.contact_your_coder_administrator_to_create_a_tem_45f484f3",
			)}
			cta={<CodeExample secret={false} code="coder templates init" />}
		/>
	);
};
