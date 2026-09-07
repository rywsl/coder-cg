import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { templateBuilderBases } from "#/api/queries/templateBuilder";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import {
	TemplateBuilderSubtitle,
	TemplateBuilderTitle,
} from "#/pages/TemplateBuilder/TemplateBuilderHeader";
import { sortByPriority } from "./sortByPriority";
import { TemplateCard } from "./TemplateCard";
import { type SelectedBaseMeta, toSelectedBaseMeta } from "./wizardState";

interface BaseInfraSelectStepProps {
	selectedBaseId: string | null;
	onSelectBase: (base: SelectedBaseMeta) => void;
}

function detailsUrl(baseId: string): string {
	return `https://registry.coder.com/templates/${baseId}`;
}

// Preferred display order for base templates. Bases listed here appear first, in
// this order; unlisted bases follow in the order the API returns them (sorted by
// display name). Quickstart and Docker are the featured Docker-based starters,
// mirroring the client-side module prioritization in ModuleSelectStep.
const BASE_PRIORITY: readonly string[] = ["quickstart", "docker"];

export const BaseInfraSelectStep: FC<BaseInfraSelectStepProps> = ({
	selectedBaseId,
	onSelectBase,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const { data, error, isLoading } = useQuery(templateBuilderBases());

	if (isLoading) {
		return <Loader />;
	}

	if (error) {
		return <ErrorAlert error={error} />;
	}

	const bases = sortByPriority(data?.bases ?? [], BASE_PRIORITY);

	return (
		<div
			role="radiogroup"
			aria-label={tI18n(
				"TemplateBuilder.BaseInfraSelectStep.base_infrastructure_templates_213855e0",
			)}
		>
			<TemplateBuilderTitle>
				{tI18n(
					"TemplateBuilder.BaseInfraSelectStep.pick_a_base_template_8b0c22af",
				)}
			</TemplateBuilderTitle>
			<TemplateBuilderSubtitle>
				{tI18n(
					"TemplateBuilder.BaseInfraSelectStep.select_your_infrastructure_foundation_9c27e199",
				)}
			</TemplateBuilderSubtitle>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{bases.map((base) => (
					<TemplateCard
						key={base.id}
						name={base.name}
						description={base.description}
						iconUrl={base.icon}
						detailsUrl={detailsUrl(base.id)}
						selected={base.id === selectedBaseId}
						onSelect={() => onSelectBase(toSelectedBaseMeta(base))}
					/>
				))}
			</div>
		</div>
	);
};
