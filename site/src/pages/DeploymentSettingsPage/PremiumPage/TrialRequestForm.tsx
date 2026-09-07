import { useFormik } from "formik";
import { type FC, useId } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { countries } from "#/api/countriesGenerated";
import type * as TypesGen from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { FormField } from "#/components/FormField/FormField";
import { SelectItem } from "#/components/Select/Select";
import { SelectField } from "#/components/SelectField/SelectField";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { PrivacyPolicyNotice } from "#/modules/licenses/PrivacyPolicyNotice";
import {
	DATABASE_DOCS_LINK,
	MAX_COMPANY_NAME_LENGTH,
	MAX_EMAIL_LENGTH,
	MAX_JOB_TITLE_LENGTH,
	MAX_NAME_LENGTH,
	numberOfDevelopersOptions,
	trialInfoValidationSchema,
} from "#/modules/licenses/trialLicense";
import { docs } from "#/utils/docs";
import { getFormHelpers, onChangeTrimmed } from "#/utils/formUtils";

type TrialFormValues = TypesGen.CreateTrialLicenseRequest & {
	// client-side gate only
	acknowledged: boolean;
};

const validationSchema = trialInfoValidationSchema.shape({
	email: Yup.string()
		.trim()
		.email(
			i18n.t(
				"administration:DeploymentSettingsPage.PremiumPage.TrialRequestForm.please_enter_a_valid_email_address_958e4ccf",
			),
		)
		.max(
			MAX_EMAIL_LENGTH,
			i18n.t(
				"administration:DeploymentSettingsPage.PremiumPage.TrialRequestForm.email_address_should_be_no_longer_than_value0_ch_169a4eea",
				{
					value0: MAX_EMAIL_LENGTH,
				},
			),
		)
		.required(
			i18n.t(
				"administration:DeploymentSettingsPage.PremiumPage.TrialRequestForm.please_enter_an_email_address_201953c9",
			),
		),
	acknowledged: Yup.bool().oneOf(
		[true],
		i18n.t(
			"administration:DeploymentSettingsPage.PremiumPage.TrialRequestForm.please_acknowledge_the_database_requirements_9c38eb56",
		),
	),
});

const initialValues: TrialFormValues = {
	email: "",
	first_name: "",
	last_name: "",
	phone_number: "",
	job_title: "",
	company_name: "",
	country: "",
	developers: "",
	acknowledged: false,
};

interface TrialRequestFormProps {
	onSubmit: (request: TypesGen.CreateTrialLicenseRequest) => void;
	isSubmitting: boolean;
	error?: unknown;
}

export const TrialRequestForm: FC<TrialRequestFormProps> = ({
	onSubmit,
	isSubmitting,
	error,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const acknowledgementId = useId();
	const form = useFormik<TrialFormValues>({
		initialValues,
		validationSchema,
		onSubmit: (values) => {
			// Built field by field so the acknowledgement cannot reach the licensor.
			onSubmit({
				email: values.email,
				first_name: values.first_name,
				last_name: values.last_name,
				phone_number: values.phone_number,
				job_title: values.job_title,
				company_name: values.company_name,
				country: values.country,
				developers: values.developers,
			});
		},
	});
	const getFieldHelpers = getFormHelpers<TrialFormValues>(form, error);
	const acknowledgedField = getFieldHelpers("acknowledged");

	return (
		<form
			onSubmit={form.handleSubmit}
			className="flex flex-col gap-6"
			noValidate
		>
			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<FormField
						label={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.first_name_702ef921",
						)}
						placeholder={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.jane_4f23798d",
						)}
						required
						field={getFieldHelpers("first_name", {
							maxLength: MAX_NAME_LENGTH,
						})}
						disabled={isSubmitting}
					/>
					<FormField
						label={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.last_name_7b488804",
						)}
						placeholder={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.doe_fd53ef83",
						)}
						required
						field={getFieldHelpers("last_name", { maxLength: MAX_NAME_LENGTH })}
						disabled={isSubmitting}
					/>
				</div>

				<FormField
					label={tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialRequestForm.business_email_e9afc27f",
					)}
					type="email"
					placeholder={tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialRequestForm.you_company_com_652740e1",
					)}
					required
					field={getFieldHelpers("email", { maxLength: MAX_EMAIL_LENGTH })}
					onChange={onChangeTrimmed(form)}
					disabled={isSubmitting}
				/>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<FormField
						label={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.company_de4743c8",
						)}
						placeholder={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.acme_inc_ee60673d",
						)}
						required
						field={getFieldHelpers("company_name", {
							maxLength: MAX_COMPANY_NAME_LENGTH,
						})}
						disabled={isSubmitting}
					/>
					<FormField
						label={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.job_title_86db80a8",
						)}
						placeholder={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.platform_engineer_42ebff43",
						)}
						required
						field={getFieldHelpers("job_title", {
							maxLength: MAX_JOB_TITLE_LENGTH,
						})}
						disabled={isSubmitting}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<FormField
						type="tel"
						label={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.phone_number_306f1bb2",
						)}
						placeholder="+1 415 5552671"
						required
						field={getFieldHelpers("phone_number")}
						disabled={isSubmitting}
					/>
					<SelectField
						label={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.number_of_developers_adc0f6fb",
						)}
						required
						field={getFieldHelpers("developers")}
						onValueChange={(value) => form.setFieldValue("developers", value)}
						placeholder={tI18n(
							"DeploymentSettingsPage.PremiumPage.TrialRequestForm.select_1339bddc",
						)}
						disabled={isSubmitting}
					>
						{numberOfDevelopersOptions.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{opt}
							</SelectItem>
						))}
					</SelectField>
				</div>

				<SelectField
					label={tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialRequestForm.country_701d021d",
					)}
					required
					field={getFieldHelpers("country")}
					onValueChange={(value) => form.setFieldValue("country", value)}
					placeholder={tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialRequestForm.select_1339bddc",
					)}
					disabled={isSubmitting}
				>
					{countries.map((c) => (
						<SelectItem key={c.name} value={c.name}>
							{c.flag} {c.name}
						</SelectItem>
					))}
				</SelectField>
			</div>
			<div className="flex flex-col gap-1">
				<div className="flex gap-2 items-start text-sm text-content-primary">
					<Checkbox
						id={acknowledgementId}
						className="data-[state=unchecked]:bg-transparent"
						checked={form.values.acknowledged}
						onCheckedChange={(checked) =>
							form.setFieldValue("acknowledged", checked === true)
						}
						disabled={isSubmitting}
					/>
					<div>
						<label htmlFor={acknowledgementId} className="cursor-pointer">
							{tI18n(
								"DeploymentSettingsPage.PremiumPage.TrialRequestForm.i_understand_that_coder_trial_features_increase__0d6447c4",
							)}
						</label>{" "}
						<a
							href={docs(DATABASE_DOCS_LINK)}
							target="_blank"
							rel="noreferrer"
							className="text-content-link hover:underline"
							aria-label={tI18n(
								"DeploymentSettingsPage.PremiumPage.TrialRequestForm.learn_more_about_external_postgresql_databases_a5d6fb6e",
							)}
						>
							{tI18n(
								"DeploymentSettingsPage.PremiumPage.TrialRequestForm.learn_more_1445799c",
							)}
						</a>
					</div>
				</div>
				{acknowledgedField.error && (
					<span className="text-xs text-content-destructive">
						{acknowledgedField.helperText}
					</span>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<Button
					type="submit"
					size="lg"
					className="w-full"
					disabled={isSubmitting}
				>
					<Spinner loading={isSubmitting} />
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialRequestForm.start_a_trial_13118f1d",
					)}
				</Button>
				<p className="m-0 text-2xs font-normal text-content-secondary leading-relaxed">
					<PrivacyPolicyNotice />
					{tI18n(
						"DeploymentSettingsPage.PremiumPage.TrialRequestForm.opt_out_at_any_time_a349523d",
					)}
				</p>
			</div>
		</form>
	);
};
