import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { hasApiFieldErrors, isApiError } from "#/api/errors";
import type { UpdateUserProfileRequest } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { FormFooter } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { FullPageForm } from "#/components/FullPageForm/FullPageForm";
import { IconField } from "#/components/IconField/IconField";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import {
	displayNameValidator,
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const validationSchema = Yup.object({
	username: nameValidator(
		i18n.t("users:EditUserPage.EditUserForm.username_e3b89e9d"),
	),
	name: displayNameValidator(
		i18n.t("users:EditUserPage.EditUserForm.full_name_f13a64ba"),
	),
	avatar_url: Yup.string(),
});

interface EditUserFormProps {
	error?: unknown;
	isLoading: boolean;
	initialValues: UpdateUserProfileRequest;
	/** Allows hiding the avatar setting when it would be overwritten later by the user's identity provider. */
	canEditAvatar: boolean;
	onSubmit: (values: UpdateUserProfileRequest) => void;
	onCancel: () => void;
}

export const EditUserForm: FC<EditUserFormProps> = ({
	error,
	isLoading,
	initialValues,
	canEditAvatar,
	onSubmit,
	onCancel,
}) => {
	const { t: tI18n } = useTranslation("users");

	const form = useFormik<UpdateUserProfileRequest>({
		initialValues,
		validationSchema,
		onSubmit,
		enableReinitialize: true,
	});

	const getFieldHelpers = getFormHelpers(form, error);

	return (
		<FullPageForm title={tI18n("EditUserPage.EditUserForm.edit_user_05b88d18")}>
			{isApiError(error) && !hasApiFieldErrors(error) && (
				<ErrorAlert error={error} className="mb-8" />
			)}
			<form onSubmit={form.handleSubmit} autoComplete="off">
				<div className="flex flex-col gap-6">
					<FormField
						field={getFieldHelpers("username")}
						label={tI18n("EditUserPage.EditUserForm.username_e3b89e9d")}
						id="username"
						name="username"
						value={form.values.username}
						onChange={onChangeTrimmed(form)}
						onBlur={form.handleBlur}
						autoComplete="username"
						autoFocus
					/>

					<FormField
						field={getFieldHelpers("name")}
						label={
							<>
								{tI18n("EditUserPage.EditUserForm.full_name_f13a64ba")}{" "}
								<span className="font-normal text-content-secondary">
									{tI18n("EditUserPage.EditUserForm.optional_0059798b")}
								</span>
							</>
						}
						id="name"
						name="name"
						value={form.values.name}
						onChange={form.handleChange}
						onBlur={form.handleBlur}
						autoComplete="name"
					/>

					{canEditAvatar && (
						<IconField
							{...getFieldHelpers("avatar_url")}
							label={tI18n("EditUserPage.EditUserForm.avatar_url_18a20f99")}
							onChange={onChangeTrimmed(form)}
							onPickEmoji={(value) => form.setFieldValue("avatar_url", value)}
							fullWidth
						/>
					)}
				</div>

				<FormFooter className="mt-8">
					<Button onClick={onCancel} variant="outline">
						{tI18n("EditUserPage.EditUserForm.cancel_19766ed6")}
					</Button>
					<Button type="submit" disabled={isLoading}>
						<Spinner loading={isLoading} />
						{tI18n("EditUserPage.EditUserForm.save_1509f561")}
					</Button>
				</FormFooter>
			</form>
		</FullPageForm>
	);
};
