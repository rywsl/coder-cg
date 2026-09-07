import { cn } from "cn";
import {
	type FC,
	type FocusEventHandler,
	type ReactNode,
	useId,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { TemplateVersionVariable } from "#/api/typesGenerated";
import { FormField } from "#/components/FormField/FormField";
import { Label } from "#/components/Label/Label";
import { RadioGroup, RadioGroupItem } from "#/components/RadioGroup/RadioGroup";

export const SensitiveVariableHelperText: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<span>
			{tI18n(
				"TemplateSettingsPage.TemplateVariablesPage.TemplateVariableField.this_variable_is_sensitive_the_previous_value_wi_9cb87581",
			)}
		</span>
	);
};

interface TemplateVariableFieldProps {
	templateVersionVariable: TemplateVersionVariable;
	initialValue: string;
	disabled: boolean;
	onChange: (value: string) => void;
	error?: boolean;
	helperText?: ReactNode;
	name?: string;
	onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

export const TemplateVariableField: FC<TemplateVariableFieldProps> = ({
	templateVersionVariable,
	initialValue,
	disabled,
	onChange,
	error = false,
	helperText,
	name,
	onBlur,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const id = useId();
	const [variableValue, setVariableValue] = useState(initialValue);

	if (isBoolean(templateVersionVariable)) {
		const trueId = `${id}-true`;
		const falseId = `${id}-false`;
		const helperId = `${id}-helper`;

		return (
			<div className="flex flex-col gap-2">
				<RadioGroup
					value={variableValue}
					disabled={disabled}
					aria-invalid={error}
					aria-describedby={helperText ? helperId : undefined}
					onValueChange={(value) => {
						setVariableValue(value);
						onChange(value);
					}}
				>
					<div className="flex items-center gap-2">
						<RadioGroupItem id={trueId} value="true" />
						<Label htmlFor={trueId} className="font-normal cursor-pointer">
							{tI18n(
								"TemplateSettingsPage.TemplateVariablesPage.TemplateVariableField.true_3cbc87c7",
							)}
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem id={falseId} value="false" />
						<Label htmlFor={falseId} className="font-normal cursor-pointer">
							{tI18n(
								"TemplateSettingsPage.TemplateVariablesPage.TemplateVariableField.false_60a33e6c",
							)}
						</Label>
					</div>
				</RadioGroup>
				{helperText && (
					<span
						id={helperId}
						className={cn(
							"text-xs",
							error ? "text-content-destructive" : "text-content-secondary",
						)}
					>
						{helperText}
					</span>
				)}
			</div>
		);
	}

	return (
		<FormField
			field={{
				name: name ?? templateVersionVariable.name,
				id,
				value: variableValue,
				onChange: (event) => {
					setVariableValue(event.target.value);
					onChange(event.target.value);
				},
				onBlur: onBlur ?? (() => {}),
				error,
				helperText,
			}}
			label={templateVersionVariable.name}
			type={
				templateVersionVariable.type === "number"
					? "number"
					: templateVersionVariable.sensitive
						? "password"
						: "text"
			}
			disabled={disabled}
			autoFocus
			placeholder={
				templateVersionVariable.sensitive
					? ""
					: templateVersionVariable.default_value
			}
			className="w-full"
		/>
	);
};

const isBoolean = (variable: TemplateVersionVariable) => {
	return variable.type === "bool";
};
