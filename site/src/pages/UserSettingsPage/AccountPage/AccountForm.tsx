import { type FormikTouched, useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type { UpdateUserProfileRequest } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { Form, FormFields } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import {
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const validationSchema = Yup.object({
	username: nameValidator(
		i18n.t("users:UserSettingsPage.AccountPage.AccountForm.username_e3b89e9d"),
	),
	name: Yup.string(),
});

interface AccountFormProps {
	editable: boolean;
	email: string;
	isLoading: boolean;
	initialValues: UpdateUserProfileRequest;
	onSubmit: (values: UpdateUserProfileRequest) => void;
	updateProfileError?: unknown;
	// initialTouched is only used for testing the error state of the form.
	initialTouched?: FormikTouched<UpdateUserProfileRequest>;
}

export const AccountForm: FC<AccountFormProps> = ({
	editable,
	email,
	isLoading,
	onSubmit,
	initialValues,
	updateProfileError,
	initialTouched,
}) => {
	const { t: tI18n } = useTranslation("users");

	const form = useFormik({
		initialValues,
		validationSchema,
		onSubmit,
		initialTouched,
	});
	const getFieldHelpers = getFormHelpers(form, updateProfileError);

	return (
		<Form onSubmit={form.handleSubmit}>
			<FormFields>
				{Boolean(updateProfileError) && (
					<ErrorAlert error={updateProfileError} />
				)}

				<FormField
					field={getFieldHelpers("email")}
					label={tI18n(
						"UserSettingsPage.AccountPage.AccountForm.email_969ccbd3",
					)}
					value={email}
					disabled
				/>
				<FormField
					field={getFieldHelpers("username")}
					onChange={onChangeTrimmed(form)}
					aria-disabled={!editable}
					autoComplete="username"
					disabled={!editable}
					className="w-full"
					label={tI18n(
						"UserSettingsPage.AccountPage.AccountForm.username_e3b89e9d",
					)}
				/>
				<FormField
					field={{
						...getFieldHelpers("name"),
						helperText: tI18n(
							"UserSettingsPage.AccountPage.AccountForm.the_human_readable_name_is_optional_and_can_be_a_34bf86a1",
						),
					}}
					autoComplete="name"
					className="w-full"
					label={tI18n(
						"UserSettingsPage.AccountPage.AccountForm.name_dcd1d522",
					)}
					onBlur={(event) => {
						event.target.value = event.target.value.trim();
						form.handleChange(event);
					}}
				/>
				<div>
					<Button disabled={isLoading} type="submit">
						<Spinner loading={isLoading} />
						{tI18n(
							"UserSettingsPage.AccountPage.AccountForm.update_account_79bd50e1",
						)}
					</Button>
				</div>
			</FormFields>
		</Form>
	);
};
