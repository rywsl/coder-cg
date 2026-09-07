import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import * as Yup from "yup";
import { Button } from "#/components/Button/Button";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { Spinner } from "#/components/Spinner/Spinner";
import { getFormHelpers, onChangeTrimmed } from "#/utils/formUtils";

type PasswordSignInFormProps = {
	onSubmit: (credentials: { email: string; password: string }) => void;
	isSigningIn: boolean;
	autoFocus: boolean;
};

export const PasswordSignInForm: FC<PasswordSignInFormProps> = ({
	onSubmit,
	isSigningIn,
	autoFocus,
}) => {
	const { t: tI18n } = useTranslation("auth");

	const validationSchema = Yup.object({
		email: Yup.string()
			.trim()
			.email(
				tI18n(
					"LoginPage.PasswordSignInForm.please_enter_a_valid_email_address_958e4ccf",
				),
			)
			.required(
				tI18n(
					"LoginPage.PasswordSignInForm.please_enter_an_email_address_201953c9",
				),
			),
		password: Yup.string(),
	});

	const form = useFormik({
		initialValues: {
			email: "",
			password: "",
		},
		validationSchema,
		onSubmit,
		validateOnBlur: false,
	});
	const getFieldHelpers = getFormHelpers(form);
	const emailField = getFieldHelpers("email");
	const passwordField = getFieldHelpers("password");
	const emailErrorId = "signin-email-error";
	const passwordErrorId = "signin-password-error";

	return (
		<form onSubmit={form.handleSubmit} className="flex flex-col gap-5">
			<div className="flex flex-col items-start gap-2">
				<Label htmlFor={emailField.id}>
					{tI18n("LoginPage.PasswordSignInForm.email_969ccbd3")}{" "}
					<span className="text-xs text-content-destructive font-bold">*</span>
				</Label>
				<Input
					id={emailField.id}
					name={emailField.name}
					value={emailField.value}
					onChange={onChangeTrimmed(form)}
					onBlur={emailField.onBlur}
					autoFocus={autoFocus}
					autoComplete="email"
					type="email"
					aria-invalid={Boolean(emailField.error)}
					aria-describedby={emailField.error ? emailErrorId : undefined}
				/>
				{emailField.error && (
					<span
						id={emailErrorId}
						className="text-xs text-content-destructive text-left"
					>
						{emailField.helperText}
					</span>
				)}
			</div>
			<div className="flex flex-col items-start gap-2">
				<Label htmlFor={passwordField.id}>
					{tI18n("LoginPage.PasswordSignInForm.password_e7cf3ef4")}{" "}
					<span className="text-xs text-content-destructive font-bold">*</span>
				</Label>
				<Input
					id={passwordField.id}
					name={passwordField.name}
					value={passwordField.value}
					onChange={passwordField.onChange}
					onBlur={passwordField.onBlur}
					autoComplete="current-password"
					type="password"
					aria-invalid={Boolean(passwordField.error)}
					aria-describedby={passwordField.error ? passwordErrorId : undefined}
				/>
				{passwordField.error && (
					<span
						id={passwordErrorId}
						className="text-xs text-content-destructive text-left"
					>
						{passwordField.helperText}
					</span>
				)}
			</div>
			<Button size="lg" disabled={isSigningIn} className="w-full" type="submit">
				<Spinner loading={isSigningIn} />
				{tI18n("LoginPage.PasswordSignInForm.sign_in_bcc0bcc9")}
			</Button>
			<Link
				asChild
				size="sm"
				showExternalIcon={false}
				className="flex items-center justify-center"
			>
				<RouterLink
					to={
						form.values.email
							? `/reset-password?email=${encodeURIComponent(form.values.email)}`
							: "/reset-password"
					}
					className="mx-auto"
				>
					{tI18n("LoginPage.PasswordSignInForm.forgot_password_30c1d8d3")}
				</RouterLink>
			</Link>
		</form>
	);
};
