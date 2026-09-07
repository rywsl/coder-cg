import { cn } from "cn";
import { useFormik } from "formik";
import { ArrowLeftIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import * as Yup from "yup";
import { isApiValidationError } from "#/api/errors";
import { createOrganization } from "#/api/queries/organizations";
import type { CreateOrganizationRequest } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import { Label } from "#/components/Label/Label";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { Textarea } from "#/components/Textarea/Textarea";
import { i18n } from "#/i18n";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import {
	displayNameValidator,
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const MAX_DESCRIPTION_CHAR_LIMIT = 128;
const MAX_DESCRIPTION_MESSAGE = i18n.t(
	"administration:OrganizationSettingsPage.CreateOrganizationPageView.please_enter_a_description_that_is_no_longer_tha_41a269dc",
	{
		value0: MAX_DESCRIPTION_CHAR_LIMIT,
	},
);

const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t(
			"administration:OrganizationSettingsPage.CreateOrganizationPageView.name_dcd1d522",
		),
	),
	display_name: displayNameValidator(
		i18n.t(
			"administration:OrganizationSettingsPage.CreateOrganizationPageView.display_name_2b7f6a84",
		),
	),
	description: Yup.string().max(
		MAX_DESCRIPTION_CHAR_LIMIT,
		MAX_DESCRIPTION_MESSAGE,
	),
});

interface CreateOrganizationPageViewProps {
	isEntitled: boolean;
	permissions: Permissions;
}

export const CreateOrganizationPageView: FC<
	CreateOrganizationPageViewProps
> = ({ isEntitled, permissions }) => {
	const { t: tI18n } = useTranslation("administration");

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const createOrganizationMutation = useMutation(
		createOrganization(queryClient),
	);
	const error = createOrganizationMutation.error;

	const form = useFormik<CreateOrganizationRequest>({
		initialValues: {
			name: "",
			display_name: "",
			description: "",
			icon: "",
		},
		validationSchema,
		onSubmit: (values) => {
			createOrganizationMutation.mutate(values, {
				onSuccess: () => {
					toast.success(
						tI18n(
							"OrganizationSettingsPage.CreateOrganizationPageView.organization_value0_created_successfully_1b622eb2",
							{
								value0: values.name,
							},
						),
					);
					void navigate(`/organizations/${values.name}`);
				},
			});
		},
	});
	const getFieldHelpers = getFormHelpers(form, error);
	const descriptionField = getFieldHelpers("description", {
		maxLength: MAX_DESCRIPTION_CHAR_LIMIT,
		helperText: tI18n(
			"OrganizationSettingsPage.CreateOrganizationPageView.optional_short_summary_of_this_organization_389c25be",
		),
	});
	const iconField = getFieldHelpers("icon", {
		helperText: tI18n(
			"OrganizationSettingsPage.CreateOrganizationPageView.optional_url_or_emoji_shown_for_this_organizatio_fd921083",
		),
	});
	const descriptionErrorId = `${descriptionField.id}-error`;
	const descriptionHelperId = `${descriptionField.id}-helper`;

	return (
		<section className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,800px)_1fr] gap-x-4 gap-y-6">
			<div>
				<Button variant="subtle" asChild className="-ml-3">
					<Link to="/organizations">
						<ArrowLeftIcon />
						<span>
							{tI18n(
								"OrganizationSettingsPage.CreateOrganizationPageView.back_to_organizations_2257dc4a",
							)}
						</span>
					</Link>
				</Button>
			</div>
			<div className="flex flex-col gap-4 w-full mx-auto max-w-2xl">
				<div className="flex flex-col">
					<SettingsHeader>
						<SettingsHeaderTitle>
							{tI18n(
								"OrganizationSettingsPage.CreateOrganizationPageView.new_organization_4876e647",
							)}
						</SettingsHeaderTitle>
						<SettingsHeaderDescription>
							{tI18n(
								"OrganizationSettingsPage.CreateOrganizationPageView.isolate_members_templates_and_provisioners_for_a_59c2f444",
							)}{" "}
							<SettingsHeaderDocsLink
								href={docs("/admin/users/organizations")}
							/>
						</SettingsHeaderDescription>
					</SettingsHeader>

					{!isEntitled ? (
						<PremiumPaywall
							source="multiple_organizations"
							message={tI18n(
								"OrganizationSettingsPage.CreateOrganizationPageView.organizations_2730183d",
							)}
							description={tI18n(
								"OrganizationSettingsPage.CreateOrganizationPageView.run_isolated_business_units_on_one_deployment_ea_3b4f63c9",
							)}
							features={[
								tI18n(
									"OrganizationSettingsPage.CreateOrganizationPageView.isolate_provisioners_infrastructure_b9bf8bb0",
								),
								tI18n(
									"OrganizationSettingsPage.CreateOrganizationPageView.sync_org_membership_from_your_idp_48008951",
								),
								tI18n(
									"OrganizationSettingsPage.CreateOrganizationPageView.manage_orgs_at_scale_via_terraform_5dea644c",
								),
							]}
							canViewPremium={permissions.viewAllLicenses}
						/>
					) : (
						<div className="border border-solid p-6 rounded-lg">
							<form
								onSubmit={form.handleSubmit}
								aria-label={tI18n(
									"OrganizationSettingsPage.CreateOrganizationPageView.organization_settings_form_c66805d0",
								)}
								className="flex flex-col gap-6 w-full"
							>
								{Boolean(error) && !isApiValidationError(error) && (
									<ErrorAlert error={error} />
								)}
								<fieldset
									disabled={form.isSubmitting}
									className="flex flex-col gap-6 w-full border-none p-0 m-0"
								>
									<div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
										<FormField
											field={getFieldHelpers("name", {
												helperText: tI18n(
													"OrganizationSettingsPage.CreateOrganizationPageView.unique_identifier_used_in_urls_d00e951c",
												),
											})}
											label={tI18n(
												"OrganizationSettingsPage.CreateOrganizationPageView.slug_d15387ec",
											)}
											required
											className="w-full"
											onChange={onChangeTrimmed(form)}
										/>
										<FormField
											field={getFieldHelpers("display_name", {
												helperText: tI18n(
													"OrganizationSettingsPage.CreateOrganizationPageView.friendly_name_defaults_to_the_slug_if_blank_00e6a878",
												),
											})}
											label={tI18n(
												"OrganizationSettingsPage.CreateOrganizationPageView.display_name_2b7f6a84",
											)}
											className="w-full"
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor={descriptionField.id}>
											{tI18n(
												"OrganizationSettingsPage.CreateOrganizationPageView.description_526e0087",
											)}
										</Label>
										<Textarea
											id={descriptionField.id}
											name={descriptionField.name}
											value={descriptionField.value}
											onChange={descriptionField.onChange}
											onBlur={descriptionField.onBlur}
											rows={2}
											aria-invalid={descriptionField.error}
											aria-describedby={
												descriptionField.error
													? descriptionErrorId
													: descriptionField.helperText
														? descriptionHelperId
														: undefined
											}
											className={cn(
												"resize-none",
												descriptionField.error && "border-border-destructive",
											)}
										/>
										{descriptionField.error ? (
											<span
												id={descriptionErrorId}
												className="text-xs text-content-destructive"
											>
												{descriptionField.helperText}
											</span>
										) : (
											descriptionField.helperText && (
												<span
													id={descriptionHelperId}
													className="text-xs text-content-secondary"
												>
													{descriptionField.helperText}
												</span>
											)
										)}
									</div>
									<IconField
										{...iconField}
										disabled={form.isSubmitting}
										onChange={onChangeTrimmed(form)}
										onPickEmoji={(value) => {
											void form.setFieldValue("icon", value);
											void form.setFieldTouched("icon", true);
										}}
									/>
								</fieldset>
								<div className="flex justify-end gap-4">
									<Button asChild variant="outline">
										<Link to="/organizations">
											{tI18n(
												"OrganizationSettingsPage.CreateOrganizationPageView.cancel_19766ed6",
											)}
										</Link>
									</Button>
									<Button type="submit" disabled={form.isSubmitting}>
										<Spinner loading={form.isSubmitting} />
										{tI18n(
											"OrganizationSettingsPage.CreateOrganizationPageView.create_organization_f14e1b22",
										)}
									</Button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};
