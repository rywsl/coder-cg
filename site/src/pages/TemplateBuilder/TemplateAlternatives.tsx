import { ExternalLinkIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "#/components/Button/Button";
import { i18n } from "#/i18n";

interface AlternativeLink {
	label: string;
	href: string;
	external: boolean;
}

const alternatives: readonly AlternativeLink[] = [
	{
		label: i18n.t(
			"templates:TemplateBuilder.TemplateAlternatives.start_from_scratch_a4822ffe",
		),
		href: "https://coder.com/docs/tutorials/template-from-scratch",
		external: true,
	},
	{
		label: i18n.t(
			"templates:TemplateBuilder.TemplateAlternatives.upload_an_existing_template_2458de77",
		),
		href: "/templates/new",
		external: false,
	},
	{
		label: i18n.t(
			"templates:TemplateBuilder.TemplateAlternatives.browse_community_templates_4ffb46ad",
		),
		href: "https://registry.coder.com/templates",
		external: true,
	},
	{
		label: i18n.t(
			"templates:TemplateBuilder.TemplateAlternatives.use_template_agent_skill_d1945632",
		),
		href: "https://registry.coder.com/skills",
		external: true,
	},
];

export const TemplateAlternatives: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<div className="p-6 border border-solid rounded-lg mt-6">
			<p className="text-sm text-content-secondary mb-4 mt-0">
				{tI18n(
					"TemplateBuilder.TemplateAlternatives.alternatives_to_create_a_template_e25d2987",
				)}
			</p>
			<div className="flex flex-wrap gap-2">
				{alternatives.map((alt) =>
					alt.external ? (
						<Button key={alt.label} variant="outline" size="sm" asChild>
							<a href={alt.href} target="_blank" rel="noreferrer">
								{alt.label}
								<ExternalLinkIcon />
							</a>
						</Button>
					) : (
						<Button key={alt.label} variant="outline" size="sm" asChild>
							<Link to={alt.href}>{alt.label}</Link>
						</Button>
					),
				)}
			</div>
		</div>
	);
};
