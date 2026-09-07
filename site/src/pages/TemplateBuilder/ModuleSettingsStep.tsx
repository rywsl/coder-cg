import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { templateBuilderModules } from "#/api/queries/templateBuilder";
import type {
	TemplateBuilderModule,
	TemplateBuilderModulesResponse,
	TemplateBuilderModuleVariable,
} from "#/api/typesGenerated";
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
import { ModuleConfiguration } from "./ModuleConfiguration";

interface ModuleSettingsStepProps {
	baseId: string;
	selectedModuleIds: string[];
	moduleVariables: Record<string, Record<string, string>>;
	onChangeModuleVariables: (
		moduleId: string,
		variables: Record<string, string>,
	) => void;
	onRemoveModule: (moduleId: string) => void;
	registerModuleRef: (moduleId: string, node: HTMLDivElement | null) => void;
}

function variableToField(
	moduleId: string,
	variable: TemplateBuilderModuleVariable,
	value: string,
	onChange: (name: string, value: string) => void,
): ConfigurationFieldDefinition {
	const id = `mod-${moduleId}-${variable.name}`;
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
						"templates:TemplateBuilder.ModuleSettingsStep.required_4850b174",
					)
				: i18n.t(
						"templates:TemplateBuilder.ModuleSettingsStep.optional_59be7133",
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

function moduleDetailsUrl(moduleId: string): string {
	return `https://registry.coder.com/modules/${moduleId}`;
}

/**
 * Returns true when all required, non-sensitive variables across all
 * selected modules have non-empty values.
 */
export function moduleSettingsComplete(
	modulesData: TemplateBuilderModulesResponse | undefined,
	selectedModuleIds: string[],
	moduleVariables: Record<string, Record<string, string>>,
): boolean {
	if (!modulesData) {
		return true;
	}
	const modulesById = new Map(modulesData.modules.map((m) => [m.id, m]));
	for (const moduleId of selectedModuleIds) {
		const mod = modulesById.get(moduleId);
		if (!mod) continue;
		const vars = moduleVariables[moduleId] ?? {};
		const required = mod.variables.filter((v) => v.required && !v.sensitive);
		for (const v of required) {
			const val = vars[v.name];
			if (val === undefined || val === "") {
				return false;
			}
		}
	}
	return true;
}

export const ModuleSettingsStep: FC<ModuleSettingsStepProps> = ({
	baseId,
	selectedModuleIds,
	moduleVariables,
	onChangeModuleVariables,
	onRemoveModule,
	registerModuleRef,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const { data } = useQuery(templateBuilderModules(baseId));
	const modules = data?.modules ?? [];

	const selectedModules = selectedModuleIds
		.map((id) => modules.find((m) => m.id === id))
		.filter((m): m is TemplateBuilderModule => m != null);

	const handleChange = (moduleId: string, varName: string, value: string) => {
		const current = moduleVariables[moduleId] ?? {};
		onChangeModuleVariables(moduleId, { ...current, [varName]: value });
	};

	return (
		<>
			<TemplateBuilderTitle>
				{tI18n("TemplateBuilder.ModuleSettingsStep.configure_modules_f495d2d0")}
			</TemplateBuilderTitle>
			<TemplateBuilderSubtitle>
				{tI18n(
					"TemplateBuilder.ModuleSettingsStep.set_values_for_module_variables_802eec58",
				)}
			</TemplateBuilderSubtitle>
			<div className="flex flex-col gap-6">
				{selectedModules.map((mod) => {
					const configurableVars = mod.variables.filter((v) => !v.sensitive);
					const sensitiveVars = mod.variables.filter((v) => v.sensitive);
					const vars = moduleVariables[mod.id] ?? {};

					const toField = (v: TemplateBuilderModuleVariable) =>
						variableToField(
							mod.id,
							v,
							vars[v.name] ?? defaultPlaceholder(v.default) ?? "",
							(name, val) => handleChange(mod.id, name, val),
						);

					const requiredVars = configurableVars.filter((v) => v.required);
					const optionalVars = configurableVars.filter((v) => !v.required);

					const requiredFields = requiredVars.map(toField);
					const optionalFields = optionalVars.map(toField);

					return (
						<div
							key={mod.id}
							ref={(node) => registerModuleRef(mod.id, node)}
							className="scroll-mt-24"
						>
							<ModuleConfiguration
								name={mod.display_name}
								description={mod.description}
								iconUrl={mod.icon}
								detailsUrl={moduleDetailsUrl(mod.id)}
								fields={requiredFields}
								optionalFields={optionalFields}
								sensitiveVariables={sensitiveVars}
								onRemove={() => onRemoveModule(mod.id)}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
};
