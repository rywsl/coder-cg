import { isAxiosError } from "axios";
import { type FormikContextType, useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { countries } from "#/api/countriesGenerated";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { FormField } from "#/components/FormField/FormField";
import { ProductLogo } from "#/components/Icons/ProductLogo";
import { LanguageMenu } from "#/components/LanguageMenu/LanguageMenu";
import { PasswordField } from "#/components/PasswordField/PasswordField";
import { SelectItem } from "#/components/Select/Select";
import { SelectField } from "#/components/SelectField/SelectField";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { PrivacyPolicyNotice } from "#/modules/licenses/PrivacyPolicyNotice";
import {
	CONTACT_SALES_LINK,
	numberOfDevelopersOptions,
	trialInfoValidationSchema,
} from "#/modules/licenses/trialLicense";
import {
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const usernameValidator = nameValidator(
	i18n.t("auth:SetupPage.SetupPageView.username_e3b89e9d"),
);
const usernameFromEmail = (email: string): string => {
	try {
		const emailPrefix = email.split("@")[0];
		const username = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, "-");
		usernameValidator.validateSync(username);
		return username;
	} catch (error) {
		console.warn(
			"failed to automatically generate username, defaulting to 'admin'",
			error,
		);
		return "admin";
	}
};

const validationSchema = Yup.object({
	email: Yup.string()
		.trim()
		.email(
			i18n.t(
				"auth:SetupPage.SetupPageView.please_enter_a_valid_email_address_958e4ccf",
			),
		)
		.required(
			i18n.t(
				"auth:SetupPage.SetupPageView.please_enter_an_email_address_201953c9",
			),
		),
	password: Yup.string().required(
		i18n.t("auth:SetupPage.SetupPageView.please_enter_a_password_6c1a47f3"),
	),
	username: usernameValidator,
	trial: Yup.bool(),
	trial_info: Yup.object().when("trial", {
		is: true,
		then: () => trialInfoValidationSchema,
	}),
	onboarding_info: Yup.object().shape({
		newsletter_marketing: Yup.bool(),
		newsletter_releases: Yup.bool(),
	}),
});

interface SetupPageViewProps {
	onSubmit: (firstUser: TypesGen.CreateFirstUserRequest) => void;
	error?: unknown;
	isLoading?: boolean;
	authMethods: TypesGen.AuthMethods | undefined;
}

export const SetupPageView: FC<SetupPageViewProps> = ({
	onSubmit,
	error,
	isLoading,
	authMethods,
}) => {
	const { t: tI18n } = useTranslation("auth");

	const form: FormikContextType<TypesGen.CreateFirstUserRequest> =
		useFormik<TypesGen.CreateFirstUserRequest>({
			initialValues: {
				email: "",
				password: "",
				username: "",
				name: "",
				trial: false,
				trial_info: {
					first_name: "",
					last_name: "",
					phone_number: "",
					job_title: "",
					company_name: "",
					country: "",
					developers: "",
				},
				onboarding_info: {
					newsletter_marketing: false,
					newsletter_releases: false,
				},
			},
			validationSchema,
			onSubmit,
			validateOnBlur: false,
			validateOnMount: true,
		});
	const getFieldHelpers = getFormHelpers<TypesGen.CreateFirstUserRequest>(
		form,
		error,
	);

	return (
		<div className="relative grow basis-0 min-h-screen flex justify-center items-center py-12">
			<div className="absolute right-4 top-4">
				<LanguageMenu />
			</div>
			<div className="flex flex-col w-full max-w-[500px] px-4">
				<header className="mb-8">
					<ProductLogo />
					<h1 className="text-2xl font-semibold mt-4 mb-0">
						{tI18n("SetupPage.SetupPageView.welcome_to_coder_2518b393")}
					</h1>
					<p className="mt-3 mb-0 text-sm text-content-secondary font-normal">
						{tI18n(
							"SetupPage.SetupPageView.set_up_your_admin_account_and_start_building_sec_9261cb8c",
						)}
					</p>
				</header>

				<form onSubmit={form.handleSubmit} className="flex flex-col gap-6">
					{authMethods?.github.enabled && (
						<>
							<Button className="w-full" asChild type="submit" size="lg">
								<a
									href={`/api/v2/users/oauth2/github/callback?redirect=${encodeURIComponent(
										"/templates/new/builder",
									)}`}
								>
									<ExternalImage src="/icon/github.svg?blackWithColor" />
									{tI18n("SetupPage.SetupPageView.github_f911e414")}
								</a>
							</Button>
							<div className="flex items-center gap-4">
								<div className="h-px w-full bg-border" />
								<div className="shrink-0 text-xs uppercase text-content-secondary tracking-wider">
									{tI18n("SetupPage.SetupPageView.or_7175517a")}
								</div>
								<div className="h-px w-full bg-border" />
							</div>
						</>
					)}

					{/* Email */}
					<FormField
						label={tI18n("SetupPage.SetupPageView.email_969ccbd3")}
						field={getFieldHelpers("email")}
						autoComplete="email"
						onChange={onChangeTrimmed(form, (email) => {
							form.setFieldValue("username", usernameFromEmail(email));
						})}
						disabled={isLoading}
					/>

					{/* Password */}
					<PasswordField
						label={tI18n("SetupPage.SetupPageView.password_e7cf3ef4")}
						field={getFieldHelpers("password")}
						autoComplete="new-password"
						disabled={isLoading}
					/>

					{/* Premium trial toggle */}
					<label
						htmlFor="trial"
						className="flex cursor-pointer gap-2 items-start"
					>
						<Checkbox
							id="trial"
							name="trial"
							checked={form.values.trial}
							onCheckedChange={(checked) =>
								form.setFieldValue("trial", checked === true)
							}
							data-testid="trial"
							className="mt-0.5"
							disabled={isLoading}
						/>
						<div className="flex flex-col items-start gap-0.5">
							<span className="text-sm font-semibold">
								{tI18n(
									"SetupPage.SetupPageView.start_an_unlimited_30_day_coder_trial_27c16ec9",
								)}
							</span>
							<span className="text-xs text-content-secondary leading-relaxed">
								{tI18n(
									"SetupPage.SetupPageView.get_access_to_high_availability_template_rbac_au_d3e0fa76",
								)}
							</span>
							<a
								href="https://coder.com/pricing"
								target="_blank"
								rel="noreferrer"
								className="text-xs text-content-link hover:underline mt-0.5"
								aria-label={tI18n(
									"SetupPage.SetupPageView.learn_more_about_coder_premium_pricing_5ca4ba54",
								)}
							>
								{tI18n("SetupPage.SetupPageView.learn_more_1445799c")}
							</a>
						</div>
					</label>

					{/* Conditional trial info fields */}
					{form.values.trial && (
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<FormField
									label={tI18n("SetupPage.SetupPageView.first_name_702ef921")}
									field={getFieldHelpers("trial_info.first_name")}
									disabled={isLoading}
								/>
								<FormField
									label={tI18n("SetupPage.SetupPageView.last_name_7b488804")}
									field={getFieldHelpers("trial_info.last_name")}
									disabled={isLoading}
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<FormField
									label={tI18n("SetupPage.SetupPageView.company_de4743c8")}
									field={getFieldHelpers("trial_info.company_name")}
									disabled={isLoading}
								/>
								<SelectField
									label={tI18n(
										"SetupPage.SetupPageView.number_of_developers_adc0f6fb",
									)}
									field={getFieldHelpers("trial_info.developers")}
									onValueChange={(value) =>
										form.setFieldValue("trial_info.developers", value)
									}
									placeholder={tI18n("SetupPage.SetupPageView.select_1339bddc")}
									disabled={isLoading}
								>
									{numberOfDevelopersOptions.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectField>
							</div>
							<FormField
								label={tI18n("SetupPage.SetupPageView.job_title_86db80a8")}
								field={getFieldHelpers("trial_info.job_title")}
								disabled={isLoading}
							/>

							<div className="grid grid-cols-2 gap-3">
								<FormField
									label={tI18n("SetupPage.SetupPageView.phone_number_306f1bb2")}
									field={getFieldHelpers("trial_info.phone_number")}
									disabled={isLoading}
								/>
								<SelectField
									label={tI18n("SetupPage.SetupPageView.country_701d021d")}
									field={getFieldHelpers("trial_info.country")}
									onValueChange={(value) =>
										form.setFieldValue("trial_info.country", value)
									}
									placeholder={tI18n("SetupPage.SetupPageView.select_1339bddc")}
									disabled={isLoading}
								>
									{countries.map((c) => (
										<SelectItem key={c.name} value={c.name}>
											{c.flag} {c.name}
										</SelectItem>
									))}
								</SelectField>
							</div>
						</div>
					)}

					{/* Sign up for updates */}
					<div className="flex flex-col gap-3">
						<span className="text-sm font-semibold">
							{tI18n("SetupPage.SetupPageView.sign_up_for_updates_3a0d6e88")}
						</span>

						<label
							htmlFor="onboarding_info.newsletter_releases"
							className="flex cursor-pointer gap-2 items-start"
						>
							<Checkbox
								id="onboarding_info.newsletter_releases"
								checked={
									form.values.onboarding_info?.newsletter_releases ?? false
								}
								onCheckedChange={(checked) =>
									form.setFieldValue(
										"onboarding_info.newsletter_releases",
										checked === true,
									)
								}
								data-testid="onboarding_info.newsletter_releases"
								disabled={isLoading}
							/>
							<div className="flex flex-col text-sm">
								<span className="font-medium">
									{tI18n(
										"SetupPage.SetupPageView.release_notes_updates_a8a962e0",
									)}
								</span>
								<span className="text-content-secondary">
									{tI18n(
										"SetupPage.SetupPageView.monthly_changelog_and_security_notices_ed318132",
									)}
								</span>
							</div>
						</label>

						<label
							htmlFor="onboarding_info.newsletter_marketing"
							className="flex cursor-pointer gap-2 items-start"
						>
							<Checkbox
								id="onboarding_info.newsletter_marketing"
								checked={
									form.values.onboarding_info?.newsletter_marketing ?? false
								}
								onCheckedChange={(checked) =>
									form.setFieldValue(
										"onboarding_info.newsletter_marketing",
										checked === true,
									)
								}
								data-testid="onboarding_info.newsletter_marketing"
								disabled={isLoading}
							/>
							<div className="flex flex-col text-sm">
								<span className="font-medium">
									{tI18n(
										"SetupPage.SetupPageView.monthly_coder_newsletter_a9a7adeb",
									)}
								</span>
								<span className="text-content-secondary">
									{tI18n(
										"SetupPage.SetupPageView.latest_articles_workshops_events_and_announcemen_65ddeb69",
									)}
								</span>
							</div>
						</label>

						{/* Privacy policy notice */}
						<p className="text-xs text-content-secondary leading-relaxed">
							{tI18n(
								"SetupPage.SetupPageView.subscribe_for_the_latest_product_and_news_update_f8610129",
							)}{" "}
							<PrivacyPolicyNotice />
							{tI18n("SetupPage.SetupPageView.opt_out_at_any_time_a349523d")}
						</p>
					</div>

					{/* Error alert */}
					{isAxiosError(error) && error.response?.data?.message && (
						<Alert severity="error" prominent>
							<AlertTitle>{error.response.data.message}</AlertTitle>
							{error.response.data.detail && (
								<AlertDescription>
									{error.response.data.detail}
									<br />
									<a
										target="_blank"
										rel="noreferrer"
										href={CONTACT_SALES_LINK}
										className="text-content-link hover:underline"
									>
										{tI18n("SetupPage.SetupPageView.contact_sales_484aa053")}
									</a>
								</AlertDescription>
							)}
						</Alert>
					)}

					<div className="flex justify-end">
						<Button disabled={isLoading} type="submit" data-testid="create">
							<Spinner loading={isLoading} />
							{tI18n("SetupPage.SetupPageView.continue_31fbef16")}
						</Button>
					</div>
				</form>

				<div className="text-xs text-content-secondary pt-6">
					&copy; {new Date().getFullYear()}
					{tI18n("SetupPage.SetupPageView.coder_technologies_inc_6f4648e4")}
				</div>
			</div>
		</div>
	);
};
