import { cn } from "cn";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { templateBuilderBases } from "#/api/queries/templateBuilder";
import type {
	TemplateBuilderBasesResponse,
	TemplateBuilderModuleVariable,
} from "#/api/typesGenerated";
import { MemoizedMarkdown } from "#/components/Markdown/Markdown";
import { i18n } from "#/i18n";
import {
	TemplateBuilderSubtitle,
	TemplateBuilderTitle,
} from "#/pages/TemplateBuilder/TemplateBuilderHeader";
import {
	type ConfigurationFieldDefinition,
	ConfigurationFieldLabel,
} from "./ConfigurationField";
import { defaultPlaceholder } from "./defaultPlaceholder";
import { TemplateConfiguration } from "./TemplateConfiguration";

interface BaseTemplateParametersStepProps {
	baseId: string;
	values: Record<string, string>;
	onChangeValues: (values: Record<string, string>) => void;
}

function detailsUrl(baseId: string): string {
	return `https://registry.coder.com/templates/${baseId}`;
}

/**
 * Maps a TemplateBuilderModuleVariable to a ConfigurationFieldDefinition,
 * using the controlled values from wizard state.
 */
function variableToField(
	variable: TemplateBuilderModuleVariable,
	value: string,
	onChange: (name: string, value: string) => void,
): ConfigurationFieldDefinition {
	const id = `base-var-${variable.name}`;
	const label = <ConfigurationFieldLabel variable={variable} />;

	if (variable.type === "bool") {
		return {
			type: "switch",
			id,
			label,
			description: variable.description || undefined,
			required: variable.required,
			checked: value === "true",
			onCheckedChange: (checked) =>
				onChange(variable.name, checked ? "true" : "false"),
		};
	}

	return {
		type: "text",
		id,
		label,
		description: variable.description || undefined,
		required: variable.required,
		placeholder:
			defaultPlaceholder(variable.default) ??
			(variable.required
				? i18n.t(
						"templates:TemplateBuilder.BaseTemplateParametersStep.required_4850b174",
					)
				: i18n.t(
						"templates:TemplateBuilder.BaseTemplateParametersStep.optional_59be7133",
					)),
		field: {
			name: variable.name,
			id,
			value,
			onChange: (e) => onChange(variable.name, e.target.value),
			onBlur: () => {},
			error: false,
		},
	};
}

/**
 * Returns true when all required, non-sensitive base variables have
 * a non-empty value. Returns true when no variables need filling.
 */
export function baseParametersComplete(
	bases: TemplateBuilderBasesResponse | undefined,
	baseId: string | null,
	values: Record<string, string>,
): boolean {
	if (!bases || !baseId) {
		return true;
	}
	const base = bases.bases.find((b) => b.id === baseId);
	if (!base) {
		return true;
	}
	const required = base.variables.filter((v) => v.required && !v.sensitive);
	return required.every((v) => {
		const val = values[v.name];
		return val !== undefined && val !== "";
	});
}

export const BaseTemplateParametersStep: FC<
	BaseTemplateParametersStepProps
> = ({ baseId, values, onChangeValues }) => {
	const { t: tI18n } = useTranslation("templates");

	const { data } = useQuery(templateBuilderBases());
	const base = data?.bases.find((b) => b.id === baseId);
	const variables = base?.variables.filter((v) => !v.sensitive) ?? [];
	const prerequisites = base?.prerequisites ?? "";

	const handleChange = (name: string, value: string) => {
		onChangeValues({ ...values, [name]: value });
	};

	const fields: ConfigurationFieldDefinition[] = variables.map((v) =>
		variableToField(
			v,
			values[v.name] ?? defaultPlaceholder(v.default) ?? "",
			handleChange,
		),
	);

	return (
		<>
			<TemplateBuilderTitle>
				{tI18n(
					"TemplateBuilder.BaseTemplateParametersStep.configure_base_template_589526ec",
				)}
			</TemplateBuilderTitle>
			<TemplateBuilderSubtitle>
				{tI18n(
					"TemplateBuilder.BaseTemplateParametersStep.your_base_template_requires_customizations_81ee6aff",
				)}
			</TemplateBuilderSubtitle>
			<TemplateConfiguration
				name={base?.name ?? "Base Template"}
				description={base?.description ?? ""}
				iconUrl={base?.icon}
				detailsUrl={detailsUrl(baseId)}
				fields={fields}
			>
				{prerequisites && (
					<div className="mt-6">
						<MemoizedMarkdown
							className={cn(
								"text-xs font-normal",
								"[&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold",
								"[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold",
								"[&_p]:mb-3 [&_p]:text-content-secondary",
								"[&_li]:text-content-secondary",
								"[&_a]:font-normal",
								"[&_code]:text-[length:inherit]",
							)}
						>
							{prerequisites}
						</MemoizedMarkdown>
					</div>
				)}
			</TemplateConfiguration>
		</>
	);
};
