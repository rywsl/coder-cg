import { useFormik } from "formik";
import { ArrowLeftIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import * as Yup from "yup";
import { isApiValidationError } from "#/api/errors";
import type { CreateGroupRequest } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { FormFields, FormFooter } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import {
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t("administration:GroupsPage.CreateGroupPageView.name_dcd1d522"),
	),
});

type CreateGroupPageViewProps = {
	onSubmit: (data: CreateGroupRequest) => void;
	onCancel: () => void;
	error?: unknown;
	isLoading: boolean;
	showOrganizations: boolean;
};

export const CreateGroupPageView: FC<CreateGroupPageViewProps> = ({
	onSubmit,
	onCancel,
	error,
	isLoading,
	showOrganizations,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<CreateGroupRequest>({
		initialValues: {
			name: "",
			display_name: "",
			avatar_url: "",
			quota_allowance: 0,
		},
		validationSchema,
		onSubmit,
	});
	const getFieldHelpers = getFormHelpers<CreateGroupRequest>(form, error);

	return (
		<>
			<Button variant="subtle" asChild className="-ml-3">
				<Link to="..">
					<ArrowLeftIcon />
					<span>
						{tI18n("GroupsPage.CreateGroupPageView.back_to_groups_033bcce2")}
					</span>
				</Link>
			</Button>
			<div className="pt-6">
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n("GroupsPage.CreateGroupPageView.new_group_df796c65")}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"GroupsPage.CreateGroupPageView.add_a_group_to_this_e63dff0b",
						)}{" "}
						{showOrganizations
							? tI18n("GroupsPage.CreateGroupPageView.organization_af3a1bb3")
							: tI18n("GroupsPage.CreateGroupPageView.deployment_aee50b18")}
						.
					</SettingsHeaderDescription>
				</SettingsHeader>

				<form
					className="flex flex-col gap-6 border border-solid p-6 rounded-lg"
					onSubmit={form.handleSubmit}
				>
					{Boolean(error) && !isApiValidationError(error) && (
						<ErrorAlert error={error} />
					)}

					<FormFields>
						<FormField
							field={getFieldHelpers("name", {
								helperText: tI18n(
									"GroupsPage.CreateGroupPageView.unique_identifier_62d55bfc",
								),
							})}
							label={tI18n("GroupsPage.CreateGroupPageView.name_dcd1d522")}
							onChange={onChangeTrimmed(form)}
							autoFocus
							autoComplete="name"
							required
						/>
						<FormField
							field={getFieldHelpers("display_name", {
								helperText: tI18n(
									"GroupsPage.CreateGroupPageView.friendly_name_defaults_to_the_name_if_blank_c7f655d7",
								),
							})}
							label={tI18n(
								"GroupsPage.CreateGroupPageView.display_name_2b7f6a84",
							)}
							autoComplete="display_name"
						/>
						<IconField
							{...getFieldHelpers("avatar_url")}
							onChange={onChangeTrimmed(form)}
							fullWidth
							label={tI18n(
								"GroupsPage.CreateGroupPageView.avatar_url_18a20f99",
							)}
							onPickEmoji={(value) => form.setFieldValue("avatar_url", value)}
						/>
					</FormFields>

					<FormFooter className="mt-0">
						<Button type="button" onClick={onCancel} variant="outline">
							{tI18n("GroupsPage.CreateGroupPageView.cancel_19766ed6")}
						</Button>
						<Button type="submit" disabled={isLoading}>
							<Spinner loading={isLoading} />
							{tI18n("GroupsPage.CreateGroupPageView.save_1509f561")}
						</Button>
					</FormFooter>
				</form>
			</div>
		</>
	);
};
