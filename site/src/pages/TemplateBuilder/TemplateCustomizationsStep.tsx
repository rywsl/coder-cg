import { cn } from "cn";
import { useFormik } from "formik";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import * as Yup from "yup";
import {
	permittedOrganizations,
	provisionerDaemons,
} from "#/api/queries/organizations";
import type { Organization } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { Avatar } from "#/components/Avatar/Avatar";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { OrganizationAutocomplete } from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import { Textarea } from "#/components/Textarea/Textarea";
import { i18n } from "#/i18n";
import {
	TemplateBuilderSubtitle,
	TemplateBuilderTitle,
} from "#/pages/TemplateBuilder/TemplateBuilderHeader";
import { docs } from "#/utils/docs";
import {
	displayNameValidator,
	getFormHelpers,
	iconValidator,
	nameValidator,
} from "#/utils/formUtils";
import type {
	CustomizationsFormValues,
	SelectedBaseMeta,
	TemplateBuilderWizardState,
} from "./wizardState";

export const TEMPLATE_CUSTOMIZATIONS_FORM_ID = "template-customizations-form";

const MAX_DESCRIPTION_CHAR_LIMIT = 128;

const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t(
			"templates:TemplateBuilder.TemplateCustomizationsStep.template_id_ef4b6c0a",
		),
	),
	display_name: displayNameValidator(
		i18n.t(
			"templates:TemplateBuilder.TemplateCustomizationsStep.display_name_2b7f6a84",
		),
	),
	description: Yup.string().max(
		MAX_DESCRIPTION_CHAR_LIMIT,
		i18n.t(
			"templates:TemplateBuilder.TemplateCustomizationsStep.please_enter_a_description_that_is_less_than_or__7d20ad93",
		),
	),
	icon: iconValidator,
	// An organization is always required: the page is gated on the create-
	// template permission, so there is always at least one permitted org, and
	// it is auto-selected when only one is available.
	organization_id: Yup.string().required(
		i18n.t(
			"templates:TemplateBuilder.TemplateCustomizationsStep.select_an_organization_to_continue_7664962a",
		),
	),
});

interface TemplateCustomizationsStepProps {
	state: TemplateBuilderWizardState;
	onCreate: (values: CustomizationsFormValues) => void;
	onProvisionerStatusChange: (hasProvisioners: boolean | undefined) => void;
}

export const TemplateCustomizationsStep: FC<
	TemplateCustomizationsStepProps
> = ({ state, onCreate, onProvisionerStatusChange }) => {
	const { t: tI18n } = useTranslation("templates");

	const permittedOrgsQuery = useQuery(
		permittedOrganizations({
			object: { resource_type: "template" },
			action: "create",
		}),
	);
	const orgOptions = permittedOrgsQuery.data ?? [];

	const form = useFormik<CustomizationsFormValues>({
		initialValues: {
			organization_id: "",
			name: state.name,
			display_name: state.displayName,
			description: state.description,
			icon: state.icon,
		},
		validationSchema,
		onSubmit: (values) => onCreate(values),
	});
	const getFieldHelpers = getFormHelpers(form);
	const descriptionField = getFieldHelpers("description");
	const iconField = getFieldHelpers("icon");
	const organizationField = getFieldHelpers("organization_id");

	// Display object for the autocomplete; the Formik field only stores the id.
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

	const { data: provisioners } = useQuery({
		...provisionerDaemons(selectedOrg?.id ?? ""),
		enabled: Boolean(selectedOrg),
	});
	const hasProvisioners = provisioners ? provisioners.length > 0 : undefined;
	const showProvisionerWarning = hasProvisioners === false;

	// Notify parent when provisioner status changes so the wizard can
	// disable the create button when no provisioners are available.
	useEffect(() => {
		onProvisionerStatusChange(hasProvisioners);
	}, [hasProvisioners, onProvisionerStatusChange]);

	// Auto-select when exactly one org is available.
	useEffect(() => {
		if (orgOptions.length === 1 && !selectedOrg) {
			setSelectedOrg(orgOptions[0]);
			void form.setFieldValue("organization_id", orgOptions[0].id);
		}
	}, [orgOptions, selectedOrg, form]);

	const handleOrgChange = (org: Organization | null) => {
		setSelectedOrg(org);
		void form.setFieldValue("organization_id", org?.id ?? "");
	};

	return (
		<form
			id={TEMPLATE_CUSTOMIZATIONS_FORM_ID}
			onSubmit={form.handleSubmit}
			noValidate
			className="min-w-[654px]"
		>
			<TemplateBuilderTitle>
				{tI18n(
					"TemplateBuilder.TemplateCustomizationsStep.customizations_2213674d",
				)}
			</TemplateBuilderTitle>
			<TemplateBuilderSubtitle>
				{tI18n(
					"TemplateBuilder.TemplateCustomizationsStep.add_additional_configurations_5f7aeaca",
				)}
			</TemplateBuilderSubtitle>
			{showProvisionerWarning && <ProvisionerWarning />}
			<div className="flex gap-8">
				{/* Base template card */}
				{state.selectedBase && <BaseTemplateCard base={state.selectedBase} />}

				{/* Two-column form grid */}
				<div className="grid grid-cols-2 gap-x-6 gap-y-6 content-start">
					{/* Left column */}
					<FormField
						field={getFieldHelpers("display_name")}
						label={tI18n(
							"TemplateBuilder.TemplateCustomizationsStep.display_name_2b7f6a84",
						)}
						id="template-display-name"
						placeholder={tI18n(
							"TemplateBuilder.TemplateCustomizationsStep.my_template_0870055b",
						)}
					/>

					{/* Right column */}
					{orgOptions.length > 0 && (
						<div className="flex flex-col gap-2">
							<Label htmlFor="organization">
								{tI18n(
									"TemplateBuilder.TemplateCustomizationsStep.organization_d764d425",
								)}
								<span className="text-xs font-bold text-content-destructive ml-1">
									*
								</span>
							</Label>
							<OrganizationAutocomplete
								id="organization"
								required
								value={selectedOrg}
								onChange={handleOrgChange}
								options={orgOptions}
							/>
							{organizationField.error && (
								<span className="text-xs text-content-destructive">
									{organizationField.helperText}
								</span>
							)}
						</div>
					)}

					{/* Left column */}
					<div className="flex flex-col gap-2">
						<Label htmlFor="template-description">
							{tI18n(
								"TemplateBuilder.TemplateCustomizationsStep.description_526e0087",
							)}
						</Label>
						<Textarea
							{...form.getFieldProps("description")}
							id="template-description"
							placeholder={tI18n(
								"TemplateBuilder.TemplateCustomizationsStep.describe_what_this_template_is_for_16834a9a",
							)}
							rows={3}
							aria-invalid={descriptionField.error}
							className={cn(
								descriptionField.error && "border-border-destructive",
							)}
						/>
						{descriptionField.error && (
							<span className="text-xs text-content-destructive">
								{descriptionField.helperText}
							</span>
						)}
						<p className="text-xs text-content-secondary">
							{tI18n(
								"TemplateBuilder.TemplateCustomizationsStep.used_by_both_humans_and_agents_to_identify_templ_ba0d23c6",
							)}
						</p>

						<IconField
							value={form.values.icon}
							error={iconField.error}
							helperText={iconField.helperText}
							onChange={(e) => {
								const target = e.target as HTMLInputElement;
								void form.setFieldValue("icon", target.value);
							}}
							onPickEmoji={(value) => {
								void form.setFieldValue("icon", value);
							}}
						/>
					</div>

					{/* Right column */}
					<FormField
						field={getFieldHelpers("name", {
							helperText: tI18n(
								"TemplateBuilder.TemplateCustomizationsStep.used_to_identify_the_template_in_urls_and_the_ap_6d941fd5",
							),
						})}
						label={tI18n(
							"TemplateBuilder.TemplateCustomizationsStep.id_3843971d",
						)}
						required
						id="template-name"
						placeholder={tI18n(
							"TemplateBuilder.TemplateCustomizationsStep.my_template_79f2d122",
						)}
					/>
				</div>
			</div>
		</form>
	);
};

const ProvisionerWarning: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<Alert severity="error" prominent className="my-4">
			{tI18n(
				"TemplateBuilder.TemplateCustomizationsStep.this_organization_does_not_have_any_provisioners_21515c68",
			)}{" "}
			<Link href={docs("/admin/provisioners#organization-scoped-provisioners")}>
				{tI18n(
					"TemplateBuilder.TemplateCustomizationsStep.see_our_documentation_cb5a6292",
				)}
			</Link>
		</Alert>
	);
};

const BaseTemplateCard: FC<{ base: SelectedBaseMeta }> = ({ base }) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<div className="w-56 shrink-0 rounded-lg bg-surface-secondary p-4 self-start">
			{base.iconUrl && <Avatar src={base.iconUrl} size="lg" variant="icon" />}
			<p className="text-sm font-bold text-content-primary">{base.name}</p>
			<p className="text-xs text-content-secondary mt-1">
				{tI18n(
					"TemplateBuilder.TemplateCustomizationsStep.preset_based_on_base_template_10fbd60c",
				)}
			</p>
		</div>
	);
};
