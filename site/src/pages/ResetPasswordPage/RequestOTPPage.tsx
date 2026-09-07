import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { Link as RouterLink, useSearchParams } from "react-router";
import * as Yup from "yup";
import { requestOneTimePassword } from "#/api/queries/users";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { ProductLogo } from "#/components/Icons/ProductLogo";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { getApplicationName } from "#/utils/appearance";
import { getFormHelpers, onChangeTrimmed } from "#/utils/formUtils";
import { pageTitle } from "#/utils/page";

const RequestOTPPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	const applicationName = getApplicationName();
	const requestOTPMutation = useMutation(requestOneTimePassword());
	const [searchParams] = useSearchParams();
	const initialEmail = searchParams.get("email") ?? "";

	return (
		<>
			<title>
				{pageTitle(
					tI18n("ResetPasswordPage.RequestOTPPage.reset_password_4e70f1fd"),
					applicationName,
				)}
			</title>
			<main className="p-6 flex items-center justify-center flex-col min-h-full text-center">
				<div>
					<ProductLogo />
				</div>
				{requestOTPMutation.isSuccess ? (
					<RequestOTPSuccess
						email={requestOTPMutation.variables?.email ?? ""}
					/>
				) : (
					<RequestOTP
						error={requestOTPMutation.error}
						isRequesting={requestOTPMutation.isPending}
						initialEmail={initialEmail}
						onRequest={(email) => {
							requestOTPMutation.mutate({ email });
						}}
					/>
				)}
			</main>
		</>
	);
};

type RequestOTPProps = {
	error: unknown;
	onRequest: (email: string) => void;
	isRequesting: boolean;
	initialEmail: string;
};

const validationSchema = Yup.object({
	email: Yup.string()
		.trim()
		.email(
			i18n.t(
				"pages:ResetPasswordPage.RequestOTPPage.please_enter_a_valid_email_address_958e4ccf",
			),
		)
		.required(
			i18n.t(
				"pages:ResetPasswordPage.RequestOTPPage.please_enter_an_email_address_201953c9",
			),
		),
});

const RequestOTP: FC<RequestOTPProps> = ({
	error,
	onRequest,
	isRequesting,
	initialEmail,
}) => {
	const { t: tI18n } = useTranslation("pages");

	const form = useFormik({
		initialValues: { email: initialEmail },
		validationSchema,
		validateOnBlur: false,
		onSubmit: (values) => {
			onRequest(values.email);
		},
	});
	const getFieldHelpers = getFormHelpers(form);
	const emailField = getFieldHelpers("email");

	return (
		<div className="w-full max-w-xs flex flex-col items-center">
			<div>
				<h1 className="m-0 mb-6 text-xl font-semibold leading-7">
					{tI18n(
						"ResetPasswordPage.RequestOTPPage.enter_your_email_to_reset_the_password_52e1bb6c",
					)}
				</h1>
				{error ? <ErrorAlert error={error} className="mb-6" /> : null}
				<form
					className="flex flex-col gap-5 w-full"
					onSubmit={form.handleSubmit}
				>
					<fieldset disabled={isRequesting} className="flex flex-col gap-5">
						<div className="flex flex-col items-start gap-2">
							<Label htmlFor={emailField.id}>
								{tI18n("ResetPasswordPage.RequestOTPPage.email_969ccbd3")}{" "}
								<span className="text-xs text-content-destructive font-bold">
									*
								</span>
							</Label>
							<Input
								id={emailField.id}
								name={emailField.name}
								value={emailField.value}
								onChange={onChangeTrimmed(form)}
								onBlur={emailField.onBlur}
								type="email"
								autoFocus
								aria-invalid={Boolean(emailField.error)}
							/>
							{emailField.error && (
								<span className="text-xs text-content-destructive text-left">
									{emailField.helperText}
								</span>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<Button
								disabled={isRequesting}
								type="submit"
								size="lg"
								className="w-full"
							>
								<Spinner loading={isRequesting} />
								{tI18n(
									"ResetPasswordPage.RequestOTPPage.reset_password_e0edfeb3",
								)}
							</Button>
							<Button asChild size="lg" variant="outline" className="w-full">
								<RouterLink to="/login">
									{tI18n("ResetPasswordPage.RequestOTPPage.cancel_19766ed6")}
								</RouterLink>
							</Button>
						</div>
					</fieldset>
				</form>
			</div>
		</div>
	);
};

const RequestOTPSuccess: FC<{ email: string }> = ({ email }) => {
	const { t: tI18n } = useTranslation("pages");

	return (
		<div className="w-full max-w-[380px] flex flex-col items-center font-medium text-sm leading-6">
			<div>
				<p className="m-0 mb-14">
					{tI18n("ResetPasswordPage.RequestOTPPage.if_the_account_6af800ac")}{" "}
					<span className="font-semibold text-content-secondary">{email}</span>{" "}
					{tI18n(
						"ResetPasswordPage.RequestOTPPage.exists_you_will_get_an_email_with_instructions_o_6734de58",
					)}
				</p>

				<p className="m-0 text-xs leading-4 text-content-secondary mb-12">
					{tI18n(
						"ResetPasswordPage.RequestOTPPage.contact_your_deployment_administrator_if_you_enc_20edca3f",
					)}
				</p>

				<Button asChild variant="default">
					<RouterLink to="/login">
						{tI18n("ResetPasswordPage.RequestOTPPage.back_to_login_3e3806ff")}
					</RouterLink>
				</Button>
			</div>
		</div>
	);
};

export default RequestOTPPage;
