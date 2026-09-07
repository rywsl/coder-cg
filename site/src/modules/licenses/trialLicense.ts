import * as Yup from "yup";
import { i18n } from "#/i18n";

// Keep in sync with cli/login.go. The values are forwarded to the Coder licensor,
// so changing them requires coordinating with the licensor service.
export const numberOfDevelopersOptions = [
	"1 - 50",
	"51 - 100",
	"101 - 200",
	"201 - 500",
	"501 - 1000",
	"1001 - 2500",
	"2500+",
];

export const DATABASE_DOCS_LINK =
	"/admin/infrastructure/architecture#postgresql-recommended";

export const CONTACT_SALES_LINK = "https://coder.com/contact/sales";

// REMARK: Keep these consts in sync with codersdk.CreateTrialLicenseRequest.
export const MAX_EMAIL_LENGTH = 254;
export const MAX_NAME_LENGTH = 60;
const MIN_JOB_TITLE_LENGTH = 2;
export const MAX_JOB_TITLE_LENGTH = 100;
const MIN_COMPANY_NAME_LENGTH = 2;
export const MAX_COMPANY_NAME_LENGTH = 100;
const PHONE_NUMBER_RE = /^\+?[\d\s\-.()]{7,20}$/;

export const trialInfoValidationSchema = Yup.object({
	first_name: Yup.string()
		.max(
			MAX_NAME_LENGTH,
			i18n.t(
				"components:licenses.trialLicense.first_name_should_be_no_longer_than_value0_chara_b0b62e67",
				{
					value0: MAX_NAME_LENGTH,
				},
			),
		)
		.required(
			i18n.t(
				"components:licenses.trialLicense.please_enter_your_first_name_815c131f",
			),
		),
	last_name: Yup.string()
		.max(
			MAX_NAME_LENGTH,
			i18n.t(
				"components:licenses.trialLicense.last_name_should_be_no_longer_than_value0_charac_b56a3ac5",
				{
					value0: MAX_NAME_LENGTH,
				},
			),
		)
		.required(
			i18n.t(
				"components:licenses.trialLicense.please_enter_your_last_name_06cee31d",
			),
		),
	phone_number: Yup.string()
		.matches(PHONE_NUMBER_RE, {
			message: i18n.t(
				"components:licenses.trialLicense.phone_number_should_be_in_international_format_e_0c777683",
			),
			excludeEmptyString: true,
		})
		.required(
			i18n.t(
				"components:licenses.trialLicense.please_enter_your_phone_number_0ec2b7d6",
			),
		),
	job_title: Yup.string()
		.min(
			MIN_JOB_TITLE_LENGTH,
			i18n.t(
				"components:licenses.trialLicense.job_title_should_be_at_least_value0_characters_149a12be",
				{
					value0: MIN_JOB_TITLE_LENGTH,
				},
			),
		)
		.max(
			MAX_JOB_TITLE_LENGTH,
			i18n.t(
				"components:licenses.trialLicense.job_title_should_be_no_longer_than_value0_charac_663434a7",
				{
					value0: MAX_JOB_TITLE_LENGTH,
				},
			),
		)
		.required(
			i18n.t(
				"components:licenses.trialLicense.please_enter_your_job_title_b3e9323a",
			),
		),
	company_name: Yup.string()
		.min(
			MIN_COMPANY_NAME_LENGTH,
			i18n.t(
				"components:licenses.trialLicense.company_name_should_be_at_least_value0_character_eec21f3b",
				{
					value0: MIN_COMPANY_NAME_LENGTH,
				},
			),
		)
		.max(
			MAX_COMPANY_NAME_LENGTH,
			i18n.t(
				"components:licenses.trialLicense.company_name_should_be_no_longer_than_value0_cha_7073bad7",
				{
					value0: MAX_COMPANY_NAME_LENGTH,
				},
			),
		)
		.required(
			i18n.t(
				"components:licenses.trialLicense.please_enter_your_company_name_141a108d",
			),
		),
	country: Yup.string().required(
		i18n.t(
			"components:licenses.trialLicense.please_select_your_country_08442f26",
		),
	),
	developers: Yup.string().required(
		i18n.t(
			"components:licenses.trialLicense.please_select_the_number_of_developers_in_your_c_aa7bee7c",
		),
	),
});
