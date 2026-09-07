import { cn } from "cn";
import type { FormikContextType } from "formik";
import { type FC, type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { IconField } from "#/components/IconField/IconField";
import { Input } from "#/components/Input/Input";
import {
	InputGroup,
	InputGroupInput,
} from "#/components/InputGroup/InputGroup";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import { MCPServerAuthSection } from "./MCPServerAuthSection";
import { MCPServerBehaviorSection } from "./MCPServerBehaviorSection";
import { CollapsibleSection, Field } from "./MCPServerFormFieldPrimitives";
import {
	type MCPServerFormValues,
	slugify,
	TRANSPORT_OPTIONS,
} from "./mcpServerFormLogic";

interface MCPServerFormFieldsProps {
	form: FormikContextType<MCPServerFormValues>;
	isSaving: boolean;
	isDisabled: boolean;
	canSubmit: boolean;
	isEditing: boolean;
	canSelectUserOIDC: boolean;
	organizationPicker?: ReactNode;
	onCancel?: () => void;
	showDetails: boolean;
	setShowDetails: (open: boolean) => void;
	showAuth: boolean;
	setShowAuth: (open: boolean) => void;
	showBehavior: boolean;
	setShowBehavior: (open: boolean) => void;
}

export const MCPServerFormFields: FC<MCPServerFormFieldsProps> = ({
	form,
	isSaving,
	isDisabled,
	canSubmit,
	isEditing,
	canSelectUserOIDC,
	organizationPicker,
	onCancel,
	showDetails,
	setShowDetails,
	showAuth,
	setShowAuth,
	showBehavior,
	setShowBehavior,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const formId = useId();

	return (
		<div className="border border-solid p-6 rounded-lg">
			<form
				onSubmit={form.handleSubmit}
				spellCheck={false}
				autoComplete="off"
				className="flex flex-col gap-6"
			>
				<div
					className={cn(
						"grid items-start gap-4",
						organizationPicker ? "sm:grid-cols-3" : "sm:grid-cols-2",
					)}
				>
					<Field
						label={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.slug_d15387ec",
						)}
						htmlFor={`${formId}-slug`}
						required
					>
						<Input
							id={`${formId}-slug`}
							className="placeholder:text-content-disabled shadow-none"
							value={form.values.slug}
							onChange={(event) => {
								void form.setFieldValue("slugTouched", true);
								void form.setFieldValue("slug", event.target.value);
							}}
							placeholder={tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormFields.e_g_github_linear_9cd87ba8",
							)}
							disabled={isDisabled}
						/>
					</Field>
					<Field
						label={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.display_name_2b7f6a84",
						)}
						htmlFor={`${formId}-display-name`}
						required
					>
						<Input
							id={`${formId}-display-name`}
							className="placeholder:text-content-disabled shadow-none"
							value={form.values.displayName}
							onChange={(event) => {
								void form.setFieldValue("displayName", event.target.value);
								if (!form.values.slugTouched) {
									void form.setFieldValue("slug", slugify(event.target.value));
								}
							}}
							disabled={isDisabled}
						/>
					</Field>
					{organizationPicker}
					<div
						className={cn(
							"grid items-start gap-4 sm:grid-cols-[1fr_224px]",
							organizationPicker ? "sm:col-span-3" : "sm:col-span-2",
						)}
					>
						<Field
							label={tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormFields.server_url_22f5ebc3",
							)}
							htmlFor={`${formId}-url`}
							required
						>
							<InputGroup>
								<InputGroupInput
									id={`${formId}-url`}
									className="placeholder:text-content-disabled"
									{...form.getFieldProps("url")}
									placeholder="https://"
									disabled={isDisabled}
								/>
							</InputGroup>
						</Field>
						<Field
							label={tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormFields.transport_aaead4ab",
							)}
							htmlFor={`${formId}-transport`}
							required
						>
							<Select
								value={form.values.transport}
								onValueChange={(value) =>
									void form.setFieldValue("transport", value)
								}
								disabled={isDisabled}
							>
								<SelectTrigger
									id={`${formId}-transport`}
									className="shadow-none"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TRANSPORT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-solid border-border">
					<CollapsibleSection
						title={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.details_45989de4",
						)}
						description={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.optional_description_and_icon_shown_to_users_93c4c67f",
						)}
						open={showDetails}
						onOpenChange={setShowDetails}
						contentClassName="grid items-start gap-4 pt-5 pl-6 sm:grid-cols-2"
					>
						<Field
							label={tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormFields.description_526e0087",
							)}
							htmlFor={`${formId}-description`}
						>
							<Input
								id={`${formId}-description`}
								className="placeholder:text-content-disabled shadow-none"
								{...form.getFieldProps("description")}
								disabled={isDisabled}
							/>
						</Field>
						<Field
							label={tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormFields.icon_a35abcd6",
							)}
							htmlFor={`${formId}-icon`}
						>
							<IconField
								id={`${formId}-icon`}
								value={form.values.iconURL}
								placeholder={tI18n(
									"AISettingsPage.MCPServersPage.components.MCPServerFormFields.file_location_2dc40ea2",
								)}
								label={null}
								onChange={(event) =>
									void form.setFieldValue("iconURL", event.target.value)
								}
								onPickEmoji={(value) =>
									void form.setFieldValue("iconURL", value)
								}
								disabled={isDisabled}
							/>
						</Field>
					</CollapsibleSection>

					<CollapsibleSection
						title={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.authentication_66880d2d",
						)}
						description={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.how_users_authenticate_with_this_mcp_server_5470bc01",
						)}
						open={showAuth}
						onOpenChange={setShowAuth}
						className="border-0 border-t border-solid border-border"
						contentClassName="space-y-5 pt-5 pl-6"
					>
						<MCPServerAuthSection
							form={form}
							formId={formId}
							disabled={isDisabled}
							canSelectUserOIDC={canSelectUserOIDC}
						/>
					</CollapsibleSection>

					<CollapsibleSection
						title={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.behavior_edf8d3f1",
						)}
						description={tI18n(
							"AISettingsPage.MCPServersPage.components.MCPServerFormFields.availability_model_intent_identity_headers_and_t_b5f66619",
						)}
						open={showBehavior}
						onOpenChange={setShowBehavior}
						className="border-0 border-t border-solid border-border"
						contentClassName="space-y-6 pt-5 pl-6"
					>
						<MCPServerBehaviorSection
							form={form}
							formId={formId}
							disabled={isDisabled}
						/>
					</CollapsibleSection>
				</div>

				<div className="flex justify-end gap-4">
					{onCancel && (
						<Button
							variant="outline"
							type="button"
							onClick={onCancel}
							disabled={isDisabled}
						>
							{tI18n(
								"AISettingsPage.MCPServersPage.components.MCPServerFormFields.cancel_19766ed6",
							)}
						</Button>
					)}
					<Button disabled={!canSubmit} type="submit">
						<Spinner loading={isSaving} />
						{isEditing
							? tI18n(
									"AISettingsPage.MCPServersPage.components.MCPServerFormFields.update_server_f15b4f3b",
								)
							: tI18n(
									"AISettingsPage.MCPServersPage.components.MCPServerFormFields.add_server_1099b2a9",
								)}
					</Button>
				</div>
			</form>
		</div>
	);
};
