import { type FormikContextType, type FormikErrors, getIn } from "formik";
import type {
	ChangeEvent,
	ChangeEventHandler,
	FocusEventHandler,
	ReactNode,
} from "react";
import * as Yup from "yup";
import { isApiValidationError, mapApiErrorToFieldErrors } from "#/api/errors";
import { i18n } from "#/i18n";

interface GetFormHelperOptions {
	helperText?: ReactNode;
	/**
	 * backendFieldName remaps the name in the form, for when it doesn't match the
	 * name used by the backend
	 */
	backendFieldName?: string;
	/**
	 * maxLength is used for showing helper text on fields that have a limited length,
	 * which will let the user know how much space they have left, or how much they are
	 * over the limit. Zero and negative values will be ignored.
	 */
	maxLength?: number;
}

export interface FormHelpers {
	name: string;
	onBlur: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	id: string;
	value?: string | number;
	error: boolean;
	helperText?: ReactNode;
}

export const getFormHelpers =
	<TFormValues>(form: FormikContextType<TFormValues>, error?: unknown) =>
	(fieldName: string, options: GetFormHelperOptions = {}): FormHelpers => {
		const {
			backendFieldName,
			helperText: defaultHelperText,
			maxLength,
		} = options;
		let helperText = defaultHelperText;
		const apiValidationErrors = isApiValidationError(error)
			? (mapApiErrorToFieldErrors(
					error.response.data,
				) as FormikErrors<TFormValues> & { [key: string]: string })
			: undefined;
		// Since the fieldName can be a path string like parameters[0].value we need to use getIn
		const touched = Boolean(getIn(form.touched, fieldName.toString()));
		const formError = getIn(form.errors, fieldName.toString());
		// Since the field in the form can be different from the backend, we need to
		// check for both when getting the error
		const apiField = backendFieldName ?? fieldName;
		const apiError = apiValidationErrors?.[apiField.toString()];

		const fieldProps = form.getFieldProps(fieldName);
		const value = fieldProps.value;

		let lengthError: ReactNode = null;
		// Show a message if the input is approaching or over the maximum length.
		if (
			maxLength &&
			maxLength > 0 &&
			typeof value === "string" &&
			value.length > maxLength - 30
		) {
			helperText = i18n.t(
				"pages:formUtils.this_cannot_be_longer_than_value0_characters_val_8cc5c122",
				{
					value0: maxLength,
					value1: value.length,
					value2: maxLength,
				},
			);
			// Show it as an error, rather than a hint
			if (value.length > maxLength) {
				lengthError = helperText;
			}
		}

		// API and regular validation errors should wait to be shown, but length errors should
		// be more responsive.
		const errorToDisplay =
			(touched && apiError) || lengthError || (touched && formError);

		return {
			...fieldProps,
			id: fieldName.toString(),
			error: Boolean(errorToDisplay),
			helperText: errorToDisplay || helperText,
		};
	};

export const onChangeTrimmed =
	<T>(form: FormikContextType<T>, callback?: (value: string) => void) =>
	(event: ChangeEvent<HTMLInputElement>): void => {
		event.target.value = event.target.value.trim();
		form.handleChange(event);
		callback?.(event.target.value);
	};

// REMARK: Keep these consts in sync with coderd/httpapi/httpapi.go
const maxLenName = 32;
const displayNameMaxLength = 64;
const usernameRE = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
const displayNameRE = /^[^\s](.*[^\s])?$/;

// REMARK: see #1756 for name/username semantics
export const nameValidator = (name: string): Yup.StringSchema =>
	Yup.string()
		.required(
			i18n.t("pages:formUtils.please_enter_a_value0_074fe8eb", {
				value0: name.toLowerCase(),
			}),
		)
		.matches(
			usernameRE,
			i18n.t(
				"pages:formUtils.special_characters_e_g_are_not_supported_3a1bf84b",
			),
		)
		.max(
			maxLenName,
			i18n.t(
				"pages:formUtils.value0_cannot_be_longer_than_value1_characters_6ef52b09",
				{
					value0: name,
					value1: maxLenName,
				},
			),
		);

export const displayNameValidator = (displayName: string): Yup.StringSchema =>
	Yup.string()
		.matches(
			displayNameRE,
			i18n.t(
				"pages:formUtils.value0_must_start_and_end_with_non_whitespace_ch_25c525ef",
				{
					value0: displayName,
				},
			),
		)
		.max(
			displayNameMaxLength,
			i18n.t(
				"pages:formUtils.value0_cannot_be_longer_than_value1_characters_6ef52b09",
				{
					value0: displayName,
					value1: displayNameMaxLength,
				},
			),
		)
		.optional();

export const iconValidator = Yup.string().label("Icon").max(256);

export const passwordManagerIgnoreProps = {
	autoComplete: "off",
	"data-1p-ignore": true,
	"data-lpignore": "true",
	"data-form-type": "other",
	"data-bwignore": true,
} as const;
