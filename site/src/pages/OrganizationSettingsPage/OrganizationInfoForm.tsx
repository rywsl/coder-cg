import { cn } from "cn";
import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { isApiValidationError } from "#/api/errors";
import type {
	Organization,
	UpdateOrganizationRequest,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	FormFields,
	FormFooter,
	FormSection,
	VerticalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import { Label } from "#/components/Label/Label";
import { Spinner } from "#/components/Spinner/Spinner";
import { Textarea } from "#/components/Textarea/Textarea";
import { i18n } from "#/i18n";
import {
	displayNameValidator,
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const MAX_DESCRIPTION_CHAR_LIMIT = 128;
const MAX_DESCRIPTION_MESSAGE = i18n.t(
	"administration:OrganizationSettingsPage.OrganizationInfoForm.please_enter_a_description_that_is_no_longer_tha_41a269dc",
	{
		value0: MAX_DESCRIPTION_CHAR_LIMIT,
	},
);

const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t(
			"administration:OrganizationSettingsPage.OrganizationInfoForm.name_dcd1d522",
		),
	),
	display_name: displayNameValidator(
		i18n.t(
			"administration:OrganizationSettingsPage.OrganizationInfoForm.display_name_2b7f6a84",
		),
	),
	description: Yup.string().max(
		MAX_DESCRIPTION_CHAR_LIMIT,
		MAX_DESCRIPTION_MESSAGE,
	),
});

type OrganizationInfoFormProps = {
	organization: Organization;
	error: unknown;
	onSubmit: (values: UpdateOrganizationRequest) => Promise<void>;
};

export const OrganizationInfoForm: FC<OrganizationInfoFormProps> = ({
	organization,
	error,
	onSubmit,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<UpdateOrganizationRequest>({
		initialValues: {
			name: organization.name,
			display_name: organization.display_name,
			description: organization.description,
			icon: organization.icon,
		},
		validationSchema,
		onSubmit,
		enableReinitialize: true,
	});
	const getFieldHelpers = getFormHelpers(form, error);
	const descriptionField = getFieldHelpers("description", {
		maxLength: MAX_DESCRIPTION_CHAR_LIMIT,
	});
	const descriptionErrorId = `${descriptionField.id}-error`;
	const descriptionHelperId = `${descriptionField.id}-helper`;

	return (
		<>
			{Boolean(error) && !isApiValidationError(error) && (
				<div className="mb-8">
					<ErrorAlert error={error} />
				</div>
			)}
			<VerticalForm
				onSubmit={form.handleSubmit}
				aria-label={tI18n(
					"OrganizationSettingsPage.OrganizationInfoForm.organization_settings_form_c66805d0",
				)}
			>
				<FormSection
					title={tI18n(
						"OrganizationSettingsPage.OrganizationInfoForm.info_170322a3",
					)}
					description={tI18n(
						"OrganizationSettingsPage.OrganizationInfoForm.the_name_and_description_of_the_organization_5a9809f4",
					)}
				>
					<fieldset
						disabled={form.isSubmitting}
						className="border-0 p-0 m-0 w-full"
					>
						<FormFields>
							<FormField
								field={getFieldHelpers("name")}
								label={tI18n(
									"OrganizationSettingsPage.OrganizationInfoForm.slug_d15387ec",
								)}
								onChange={onChangeTrimmed(form)}
								autoFocus
							/>
							<FormField
								field={getFieldHelpers("display_name")}
								label={tI18n(
									"OrganizationSettingsPage.OrganizationInfoForm.display_name_2b7f6a84",
								)}
							/>
							<div className="flex flex-col gap-2">
								<Label htmlFor={descriptionField.id}>
									{tI18n(
										"OrganizationSettingsPage.OrganizationInfoForm.description_526e0087",
									)}
								</Label>
								<Textarea
									id={descriptionField.id}
									name={descriptionField.name}
									value={descriptionField.value}
									onChange={descriptionField.onChange}
									onBlur={descriptionField.onBlur}
									rows={2}
									aria-invalid={descriptionField.error}
									aria-describedby={
										descriptionField.error
											? descriptionErrorId
											: descriptionField.helperText
												? descriptionHelperId
												: undefined
									}
									className={cn(
										descriptionField.error && "border-border-destructive",
									)}
								/>
								{descriptionField.error ? (
									<span
										id={descriptionErrorId}
										className="text-xs text-content-destructive"
									>
										{descriptionField.helperText}
									</span>
								) : (
									descriptionField.helperText && (
										<span
											id={descriptionHelperId}
											className="text-xs text-content-secondary"
										>
											{descriptionField.helperText}
										</span>
									)
								)}
							</div>
							<IconField
								{...getFieldHelpers("icon")}
								onChange={onChangeTrimmed(form)}
								fullWidth
								onPickEmoji={(value) => form.setFieldValue("icon", value)}
							/>
						</FormFields>
					</fieldset>
				</FormSection>

				<FormFooter>
					<Button type="submit" disabled={form.isSubmitting}>
						<Spinner loading={form.isSubmitting} />
						{tI18n(
							"OrganizationSettingsPage.OrganizationInfoForm.save_1509f561",
						)}
					</Button>
				</FormFooter>
			</VerticalForm>
		</>
	);
};
