import type { FormikContextType } from "formik";
import { InfoIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "#/components/Input/Input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Switch } from "#/components/Switch/Switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { Field } from "./MCPServerFormFieldPrimitives";
import {
	AVAILABILITY_OPTIONS,
	type MCPServerFormValues,
} from "./mcpServerFormLogic";

interface MCPServerBehaviorSectionProps {
	form: FormikContextType<MCPServerFormValues>;
	formId: string;
	disabled: boolean;
}

export const MCPServerBehaviorSection: FC<MCPServerBehaviorSectionProps> = ({
	form,
	formId,
	disabled,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			<Field
				label={tI18n(
					"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.availability_12f67f85",
				)}
				htmlFor={`${formId}-availability`}
				className="max-w-md"
				description={
					AVAILABILITY_OPTIONS.find(
						(option) => option.value === form.values.availability,
					)?.description
				}
			>
				<Select
					value={form.values.availability}
					onValueChange={(value) =>
						void form.setFieldValue("availability", value)
					}
					disabled={disabled}
				>
					<SelectTrigger id={`${formId}-availability`} className="shadow-none">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{AVAILABILITY_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<div className="flex flex-col gap-4">
				<SwitchField
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.model_intent_cdad59c0",
					)}
					checked={form.values.modelIntent}
					onCheckedChange={(checked) =>
						void form.setFieldValue("modelIntent", checked)
					}
					disabled={disabled}
					tooltip={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.allows_this_server_to_be_used_for_model_intent_t_c3c59254",
					)}
				/>
				<SwitchField
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.allow_all_tools_from_this_mcp_server_in_root_pla_d8f994af",
					)}
					checked={form.values.allowInPlanMode}
					onCheckedChange={(checked) =>
						void form.setFieldValue("allowInPlanMode", checked)
					}
					disabled={disabled}
					tooltip={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.allows_tools_during_planning_workspace_mcp_and_p_2f8e0f21",
					)}
				/>
				<SwitchField
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.forward_coder_identity_headers_611b9c11",
					)}
					checked={form.values.forwardCoderHeaders}
					onCheckedChange={(checked) =>
						void form.setFieldValue("forwardCoderHeaders", checked)
					}
					disabled={disabled}
					tooltip={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.only_enable_for_first_party_or_trusted_mcp_serve_26202b63",
					)}
				/>
			</div>
			<div className="grid items-start gap-4 sm:grid-cols-2">
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.tool_allow_list_c850e118",
					)}
					htmlFor={`${formId}-allow-list`}
					description={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.comma_separated_empty_all_allowed_436208b6",
					)}
				>
					<Input
						id={`${formId}-allow-list`}
						className="placeholder:text-content-disabled shadow-none"
						{...form.getFieldProps("toolAllowList")}
						placeholder={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.tool_1_tool_2_28cae6a1",
						)}
						disabled={disabled}
					/>
				</Field>
				<Field
					label={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.tool_deny_list_cf3b4d71",
					)}
					htmlFor={`${formId}-deny-list`}
					description={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.comma_separated_names_to_block_fe8783d6",
					)}
				>
					<Input
						id={`${formId}-deny-list`}
						className="placeholder:text-content-disabled shadow-none"
						{...form.getFieldProps("toolDenyList")}
						placeholder={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerBehaviorSection.tool_1_tool_2_28cae6a1",
						)}
						disabled={disabled}
					/>
				</Field>
			</div>
		</>
	);
};

const SwitchField: FC<{
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled: boolean;
	tooltip: string;
}> = ({ label, checked, onCheckedChange, disabled, tooltip }) => (
	<div className="flex items-center gap-3">
		<Switch
			checked={checked}
			onCheckedChange={onCheckedChange}
			disabled={disabled}
			aria-label={label}
		/>
		<span className="text-sm text-content-primary">{label}</span>
		<Tooltip>
			<TooltipTrigger asChild>
				<InfoIcon className="size-3 text-content-secondary" />
			</TooltipTrigger>
			<TooltipContent side="top" className="max-w-[260px]">
				{tooltip}
			</TooltipContent>
		</Tooltip>
	</div>
);
