import { type FormikContextType, useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { Form, FormFields } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { PasswordField } from "#/components/PasswordField/PasswordField";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { getFormHelpers } from "#/utils/formUtils";

interface SecurityFormValues {
	old_password: string;
	password: string;
	confirm_password: string;
}

const validationSchema = Yup.object({
	old_password: Yup.string()
		.trim()
		.required(
			i18n.t(
				"users:UserSettingsPage.SecurityPage.SecurityForm.old_password_is_required_b8d66da5",
			),
		),
	password: Yup.string()
		.trim()
		.required(
			i18n.t(
				"users:UserSettingsPage.SecurityPage.SecurityForm.new_password_is_required_757b2947",
			),
		),
	confirm_password: Yup.string()
		.trim()
		.test(
			"passwords-match",
			i18n.t(
				"users:UserSettingsPage.SecurityPage.SecurityForm.password_and_confirmation_must_match_80159cdb",
			),
			function (value) {
				return (this.parent as SecurityFormValues).password === value;
			},
		),
});

interface SecurityFormProps {
	disabled: boolean;
	isLoading: boolean;
	onSubmit: (values: SecurityFormValues) => void;
	error?: unknown;
}

export const SecurityForm: FC<SecurityFormProps> = ({
	disabled,
	isLoading,
	onSubmit,
	error,
}) => {
	const { t: tI18n } = useTranslation("users");

	const form: FormikContextType<SecurityFormValues> =
		useFormik<SecurityFormValues>({
			initialValues: {
				old_password: "",
				password: "",
				confirm_password: "",
			},
			validationSchema,
			onSubmit,
		});
	const getFieldHelpers = getFormHelpers<SecurityFormValues>(form, error);

	if (disabled) {
		return (
			<Alert severity="info">
				{tI18n(
					"UserSettingsPage.SecurityPage.SecurityForm.password_changes_are_only_allowed_for_password_b_9c7afbf2",
				)}
			</Alert>
		);
	}

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle hierarchy="secondary">
					{tI18n(
						"UserSettingsPage.SecurityPage.SecurityForm.password_e7cf3ef4",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"UserSettingsPage.SecurityPage.SecurityForm.update_your_account_password_4fd5b456",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<Form onSubmit={form.handleSubmit}>
				<FormFields>
					{Boolean(error) && <ErrorAlert error={error} />}
					<FormField
						field={getFieldHelpers("old_password")}
						label={tI18n(
							"UserSettingsPage.SecurityPage.SecurityForm.old_password_9d6a9f66",
						)}
						type="password"
						autoComplete="current-password"
					/>
					<PasswordField
						field={getFieldHelpers("password")}
						label={tI18n(
							"UserSettingsPage.SecurityPage.SecurityForm.new_password_7c451e0f",
						)}
						autoComplete="new-password"
					/>
					<FormField
						field={getFieldHelpers("confirm_password")}
						label={tI18n(
							"UserSettingsPage.SecurityPage.SecurityForm.confirm_password_c292210c",
						)}
						type="password"
						autoComplete="new-password"
					/>

					<div>
						<Button disabled={isLoading} type="submit">
							<Spinner loading={isLoading} />
							{tI18n(
								"UserSettingsPage.SecurityPage.SecurityForm.update_password_fe45b401",
							)}
						</Button>
					</div>
				</FormFields>
			</Form>
		</>
	);
};
