import { cn } from "cn";
import { useFormik } from "formik";
import camelCase from "lodash/camelCase";
import capitalize from "lodash/capitalize";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router";
import * as Yup from "yup";
import {
	permittedOrganizations,
	provisionerDaemons,
} from "#/api/queries/organizations";
import type {
	CreateTemplateVersionRequest,
	Organization,
	ProvisionerJobLog,
	ProvisionerType,
	Template,
	TemplateExample,
	TemplateVersionVariable,
	VariableValue,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import {
	FormFields,
	FormFooter,
	FormSection,
	HorizontalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { OrganizationAutocomplete } from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import { Spinner } from "#/components/Spinner/Spinner";
import { Textarea } from "#/components/Textarea/Textarea";
import { i18n } from "#/i18n";
import { ProvisionerTagsField } from "#/modules/provisioners/ProvisionerTagsField";
import { SelectedTemplate } from "#/pages/CreateWorkspacePage/SelectedTemplate";
import { docs } from "#/utils/docs";
import {
	displayNameValidator,
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";
import {
	sortedDays,
	type TemplateAutostartRequirementDaysValue,
	type TemplateAutostopRequirementDaysValue,
} from "#/utils/schedule";
import { TemplateUpload, type TemplateUploadProps } from "./TemplateUpload";
import { VariableInput } from "./VariableInput";

const MAX_DESCRIPTION_CHAR_LIMIT = 128;

export interface CreateTemplateFormData {
	name: string;
	display_name: string;
	description: string;
	icon: string;
	default_ttl_hours: number;
	autostart_requirement_days_of_week: TemplateAutostartRequirementDaysValue[];
	autostop_requirement_days_of_week: TemplateAutostopRequirementDaysValue;
	autostop_requirement_weeks: number;
	allow_user_autostart: boolean;
	allow_user_autostop: boolean;
	allow_user_cancel_workspace_jobs: boolean;
	parameter_values_by_name?: Record<string, string>;
	user_variable_values?: VariableValue[];
	allow_everyone_group_access: boolean;
	provisioner_type: ProvisionerType;
	organization: string;
	tags: CreateTemplateVersionRequest["tags"];
}

const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t("templates:CreateTemplatePage.CreateTemplateForm.name_dcd1d522"),
	),
	display_name: displayNameValidator(
		i18n.t(
			"templates:CreateTemplatePage.CreateTemplateForm.display_name_2b7f6a84",
		),
	),
	description: Yup.string().max(
		MAX_DESCRIPTION_CHAR_LIMIT,
		i18n.t(
			"templates:CreateTemplatePage.CreateTemplateForm.please_enter_a_description_that_is_less_than_or__7d20ad93",
		),
	),
	icon: Yup.string().optional(),
});

const defaultInitialValues: CreateTemplateFormData = {
	name: "",
	display_name: "",
	description: "",
	icon: "",
	default_ttl_hours: 24,
	// autostop_requirement is an enterprise-only feature, and the server ignores
	// the value if you are not licensed. We hide the form value based on
	// entitlements.
	//
	// Default to requiring restart every Sunday in the user's quiet hours in the
	// user's timezone.
	autostop_requirement_days_of_week: "sunday",
	autostop_requirement_weeks: 1,
	autostart_requirement_days_of_week: sortedDays,
	allow_user_cancel_workspace_jobs: false,
	allow_user_autostart: false,
	allow_user_autostop: false,
	allow_everyone_group_access: true,
	provisioner_type: "terraform",
	organization: "default",
	tags: {},
};

type GetInitialValuesParams = {
	fromExample?: TemplateExample;
	fromCopy?: Template;
	variables?: TemplateVersionVariable[];
	allowAdvancedScheduling: boolean;
	searchParams: URLSearchParams;
};

const getInitialValues = ({
	fromExample,
	fromCopy,
	allowAdvancedScheduling,
	variables,
	searchParams,
}: GetInitialValuesParams) => {
	let initialValues = defaultInitialValues;

	// Will assume the query param has a valid ProvisionerType, as this query param is only used
	// in testing.
	defaultInitialValues.provisioner_type =
		(searchParams.get("provisioner_type") as ProvisionerType) || "terraform";

	if (!allowAdvancedScheduling) {
		initialValues = {
			...initialValues,
			autostop_requirement_days_of_week: "off",
			autostop_requirement_weeks: 1,
		};
	}

	if (fromExample) {
		initialValues = {
			...initialValues,
			name: fromExample.id,
			display_name: fromExample.name,
			icon: fromExample.icon,
			description: fromExample.description,
		};
	}

	if (fromCopy) {
		initialValues = {
			...initialValues,
			...fromCopy,
			name: `${fromCopy.name}-copy`,
			display_name: fromCopy.display_name
				? `Copy of ${fromCopy.display_name}`
				: "",
		};
	}

	if (variables) {
		for (const variable of variables) {
			if (!initialValues.user_variable_values) {
				initialValues.user_variable_values = [];
			}
			initialValues.user_variable_values.push({
				name: variable.name,
				value: variable.sensitive ? "" : variable.value,
			});
		}
	}

	return initialValues;
};

type CopiedTemplateForm = { copiedTemplate: Template };
type StarterTemplateForm = { starterTemplate: TemplateExample };
type UploadTemplateForm = { upload: TemplateUploadProps };

type CreateTemplateFormProps = (
	| CopiedTemplateForm
	| StarterTemplateForm
	| UploadTemplateForm
) & {
	onCancel: () => void;
	onSubmit: (data: CreateTemplateFormData) => void;
	onOpenBuildLogsDrawer: () => void;
	isSubmitting: boolean;
	variables?: TemplateVersionVariable[];
	error?: unknown;
	jobError?: string;
	logs?: ProvisionerJobLog[];
	allowAdvancedScheduling: boolean;
	variablesSectionRef: React.RefObject<HTMLDivElement | null>;
	showOrganizationPicker?: boolean;
};

// Stable reference for empty org options to avoid re-render loops
// in the render-time state adjustment pattern.
const emptyOrgs: Organization[] = [];

export const CreateTemplateForm: FC<CreateTemplateFormProps> = (props) => {
	const { t: tI18n } = useTranslation("templates");

	const [searchParams] = useSearchParams();
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const {
		onCancel,
		onSubmit,
		onOpenBuildLogsDrawer,
		variables,
		isSubmitting,
		error,
		jobError,
		logs,
		allowAdvancedScheduling,
		variablesSectionRef,
		showOrganizationPicker,
	} = props;

	const form = useFormik<CreateTemplateFormData>({
		initialValues: getInitialValues({
			allowAdvancedScheduling,
			fromExample:
				"starterTemplate" in props ? props.starterTemplate : undefined,
			fromCopy: "copiedTemplate" in props ? props.copiedTemplate : undefined,
			variables,
			searchParams,
		}),
		validationSchema,
		onSubmit,
	});
	const getFieldHelpers = getFormHelpers<CreateTemplateFormData>(form, error);
	const descriptionField = getFieldHelpers("description", {
		maxLength: MAX_DESCRIPTION_CHAR_LIMIT,
	});
	const descriptionHelperId = `${descriptionField.id}-helper`;

	const permittedOrgsQuery = useQuery({
		...permittedOrganizations({
			object: { resource_type: "template" },
			action: "create",
		}),
		enabled: Boolean(showOrganizationPicker),
	});
	const orgOptions = permittedOrgsQuery.data ?? emptyOrgs;

	// Clear invalid selections when permission filtering removes the
	// selected org. Uses the React render-time adjustment pattern.
	const [prevOrgOptions, setPrevOrgOptions] = useState(orgOptions);
	if (orgOptions !== prevOrgOptions) {
		setPrevOrgOptions(orgOptions);
		if (selectedOrg && !orgOptions.some((o) => o.id === selectedOrg.id)) {
			setSelectedOrg(null);
			void form.setFieldValue("organization", "");
		}
	}

	// Auto-select when exactly one org is available and nothing is
	// selected. Runs every render (not gated on options change) so it
	// works when mock data is available synchronously on first render.
	if (orgOptions.length === 1 && selectedOrg === null) {
		setSelectedOrg(orgOptions[0]);
		void form.setFieldValue("organization", orgOptions[0].name || "");
	}

	const { data: provisioners } = useQuery({
		...provisionerDaemons(selectedOrg?.id ?? ""),
		enabled: Boolean(showOrganizationPicker) && Boolean(selectedOrg),
	});

	// TODO: Ideally, we would have a backend endpoint that could notify the
	// frontend that a provisioner has been connected, so that we could hide
	// this warning. In the meantime, **do not use this variable to disable
	// form submission**!! A user could easily see this warning, connect a
	// provisioner, and then not refresh the page. Even if they submit without
	// a provisioner, it'll just sit in the job queue until they connect one.
	const showProvisionerWarning = provisioners ? provisioners.length < 1 : false;

	return (
		<HorizontalForm onSubmit={form.handleSubmit} className="pb-12">
			{/* General info */}
			<FormSection
				title={tI18n("CreateTemplatePage.CreateTemplateForm.general_c910d474")}
				description={tI18n(
					"CreateTemplatePage.CreateTemplateForm.the_name_is_used_to_identify_the_template_in_url_0035a189",
				)}
			>
				<FormFields>
					{"starterTemplate" in props && (
						<SelectedTemplate template={props.starterTemplate} />
					)}
					{"upload" in props && (
						<TemplateUpload
							{...props.upload}
							onUpload={async (file) => {
								await fillNameAndDisplayWithFilename(file.name, form);
								props.upload.onUpload(file);
							}}
						/>
					)}

					{showOrganizationPicker && (
						<>
							{showProvisionerWarning && <ProvisionerWarning />}

							<div className="flex flex-col gap-2">
								<Label htmlFor="organization">
									{tI18n(
										"CreateTemplatePage.CreateTemplateForm.organization_d764d425",
									)}
								</Label>
								<OrganizationAutocomplete
									id="organization"
									required
									value={selectedOrg}
									options={orgOptions}
									onChange={(newValue) => {
										setSelectedOrg(newValue);
										void form.setFieldValue(
											"organization",
											newValue?.name || "",
										);
									}}
								/>
							</div>
						</>
					)}

					{"copiedTemplate" in props && (
						<SelectedTemplate template={props.copiedTemplate} />
					)}

					<FormField
						field={getFieldHelpers("name")}
						label={tI18n("CreateTemplatePage.CreateTemplateForm.name_dcd1d522")}
						disabled={isSubmitting}
						onChange={onChangeTrimmed(form)}
						required
						className="w-full"
					/>
				</FormFields>
			</FormSection>
			{/* Display info  */}
			<FormSection
				title={tI18n("CreateTemplatePage.CreateTemplateForm.display_34e108c0")}
				description={tI18n(
					"CreateTemplatePage.CreateTemplateForm.a_friendly_name_description_and_icon_to_help_dev_7a9cbfe1",
				)}
			>
				<FormFields>
					<FormField
						field={getFieldHelpers("display_name")}
						label={tI18n(
							"CreateTemplatePage.CreateTemplateForm.display_name_2b7f6a84",
						)}
						disabled={isSubmitting}
						className="w-full"
					/>

					<div className="flex flex-col gap-2">
						<Label htmlFor={descriptionField.id}>
							{tI18n(
								"CreateTemplatePage.CreateTemplateForm.description_526e0087",
							)}
						</Label>
						<Textarea
							id={descriptionField.id}
							name={descriptionField.name}
							value={descriptionField.value ?? ""}
							onChange={descriptionField.onChange}
							onBlur={descriptionField.onBlur}
							disabled={isSubmitting}
							rows={5}
							aria-invalid={descriptionField.error}
							aria-describedby={
								descriptionField.helperText ? descriptionHelperId : undefined
							}
							className={cn(
								descriptionField.error && "border-border-destructive",
							)}
						/>
						{descriptionField.helperText && (
							<span
								id={descriptionHelperId}
								className={cn(
									"text-xs",
									descriptionField.error
										? "text-content-destructive"
										: "text-content-secondary",
								)}
							>
								{descriptionField.helperText}
							</span>
						)}
					</div>

					<IconField
						{...getFieldHelpers("icon")}
						disabled={isSubmitting}
						onChange={onChangeTrimmed(form)}
						fullWidth
						onPickEmoji={(value) => form.setFieldValue("icon", value)}
					/>
				</FormFields>
			</FormSection>
			{provisioners && provisioners.length > 0 && (
				<FormSection
					title={tI18n(
						"CreateTemplatePage.CreateTemplateForm.provisioner_tags_f9b9e2e7",
					)}
					description={
						<>
							{tI18n(
								"CreateTemplatePage.CreateTemplateForm.tags_are_a_way_to_control_which_provisioner_daem_8b7d64ff",
							)}{" "}
							<Link
								href={docs("/admin/provisioners")}
								target="_blank"
								rel="noreferrer"
							>
								{tI18n(
									"CreateTemplatePage.CreateTemplateForm.learn_more_0bfa7ffe",
								)}
							</Link>
						</>
					}
				>
					<FormFields>
						<ProvisionerTagsField
							value={form.values.tags}
							onChange={(tags) => form.setFieldValue("tags", tags)}
						/>
					</FormFields>
				</FormSection>
			)}
			{/* Variables */}
			{variables && variables.length > 0 && (
				<FormSection
					ref={variablesSectionRef}
					title={tI18n(
						"CreateTemplatePage.CreateTemplateForm.variables_02db55ba",
					)}
					description={tI18n(
						"CreateTemplatePage.CreateTemplateForm.input_variables_allow_you_to_customize_templates_c9db4de8",
					)}
				>
					<FormFields>
						{variables.map((variable, index) => (
							<VariableInput
								defaultValue={variable.value}
								variable={variable}
								disabled={isSubmitting}
								key={variable.name}
								onChange={async (value) => {
									await form.setFieldValue(`user_variable_values.${index}`, {
										name: variable.name,
										value,
									});
								}}
							/>
						))}
					</FormFields>
				</FormSection>
			)}
			<FormFooter>
				<Button onClick={onCancel} variant="outline">
					{tI18n("CreateTemplatePage.CreateTemplateForm.cancel_19766ed6")}
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					<Spinner loading={isSubmitting} />
					{jobError
						? tI18n("CreateTemplatePage.CreateTemplateForm.retry_942087cc")
						: tI18n("CreateTemplatePage.CreateTemplateForm.save_1509f561")}
				</Button>
				{logs && (
					<button
						type="button"
						onClick={onOpenBuildLogsDrawer}
						className="cursor-pointer border-0 bg-transparent text-sm font-medium text-content-secondary hover:text-content-primary hover:underline hover:underline-offset-4"
					>
						{tI18n(
							"CreateTemplatePage.CreateTemplateForm.show_build_logs_94b3249a",
						)}
					</button>
				)}
			</FormFooter>
		</HorizontalForm>
	);
};

const fillNameAndDisplayWithFilename = async (
	filename: string,
	form: ReturnType<typeof useFormik<CreateTemplateFormData>>,
) => {
	const [name, _extension] = filename.split(".");
	await Promise.all([
		form.setFieldValue(
			"name",
			// Camel case will remove special chars and spaces
			camelCase(name).toLowerCase(),
		),
		form.setFieldValue("display_name", capitalize(name)),
	]);
};

const ProvisionerWarning: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<Alert severity="warning" className="mb-4" prominent>
			{tI18n(
				"CreateTemplatePage.CreateTemplateForm.this_organization_does_not_have_any_provisioners_21515c68",
			)}{" "}
			<Link href={docs("/admin/provisioners#organization-scoped-provisioners")}>
				{tI18n(
					"CreateTemplatePage.CreateTemplateForm.see_our_documentation_ff74e6ec",
				)}
			</Link>
		</Alert>
	);
};
