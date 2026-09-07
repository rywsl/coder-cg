import { cn } from "cn";
import { type FormikTouched, useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import {
	CORSBehaviors,
	type Template,
	type UpdateTemplateMeta,
	WorkspaceAppSharingLevels,
} from "#/api/typesGenerated";
import { PremiumBadge } from "#/components/Badge/PresetBadges";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import {
	FormFields,
	FormFooter,
	FormSection,
	HorizontalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { IconField } from "#/components/IconField/IconField";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	StackLabel,
	StackLabelHelperText,
} from "#/components/StackLabel/StackLabel";
import { Textarea } from "#/components/Textarea/Textarea";
import { i18n } from "#/i18n";
import { docs } from "#/utils/docs";
import {
	displayNameValidator,
	getFormHelpers,
	iconValidator,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

const MAX_DESCRIPTION_CHAR_LIMIT = 128;
const MAX_DESCRIPTION_MESSAGE = i18n.t(
	"templates:TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.please_enter_a_description_that_is_no_longer_tha_41a269dc",
	{
		value0: MAX_DESCRIPTION_CHAR_LIMIT,
	},
);

export const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t(
			"templates:TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.name_dcd1d522",
		),
	),
	display_name: displayNameValidator(
		i18n.t(
			"templates:TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.display_name_2b7f6a84",
		),
	),
	description: Yup.string().max(
		MAX_DESCRIPTION_CHAR_LIMIT,
		MAX_DESCRIPTION_MESSAGE,
	),
	allow_user_cancel_workspace_jobs: Yup.boolean(),
	agents_allowed: Yup.boolean(),
	allow_workspace_renames: Yup.boolean(),
	icon: iconValidator,
	require_active_version: Yup.boolean(),
	disable_module_cache: Yup.boolean(),
	deprecation_message: Yup.string(),
	max_port_sharing_level: Yup.string().oneOf(WorkspaceAppSharingLevels),
	cors_behavior: Yup.string().oneOf(Object.values(CORSBehaviors)),
});

export interface TemplateSettingsForm {
	template: Template;
	onSubmit: (data: UpdateTemplateMeta) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	error?: unknown;
	// Helpful to show field errors on Storybook
	initialTouched?: FormikTouched<UpdateTemplateMeta>;
	accessControlEnabled: boolean;
	advancedSchedulingEnabled: boolean;
	portSharingControlsEnabled: boolean;
}

export const TemplateSettingsForm: FC<TemplateSettingsForm> = ({
	template,
	onSubmit,
	onCancel,
	error,
	isSubmitting,
	initialTouched,
	accessControlEnabled,
	advancedSchedulingEnabled,
	portSharingControlsEnabled,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const form = useFormik<UpdateTemplateMeta>({
		initialValues: {
			name: template.name,
			display_name: template.display_name,
			description: template.description,
			icon: template.icon,
			allow_user_cancel_workspace_jobs:
				template.allow_user_cancel_workspace_jobs,
			agents_allowed: template.agents_allowed,
			update_workspace_last_used_at: false,
			update_workspace_dormant_at: false,
			require_active_version: template.require_active_version,
			deprecation_message: template.deprecation_message,
			disable_everyone_group_access: false,
			max_port_share_level: template.max_port_share_level,
			cors_behavior: template.cors_behavior,
			disable_module_cache: template.disable_module_cache,
			allow_workspace_renames: template.allow_workspace_renames,
		},
		validationSchema,
		onSubmit,
		initialTouched,
	});
	const getFieldHelpers = getFormHelpers(form, error);
	const descriptionField = getFieldHelpers("description", {
		maxLength: MAX_DESCRIPTION_CHAR_LIMIT,
	});
	const descriptionHelperId = `${descriptionField.id}-helper`;
	const maxPortShareField = getFieldHelpers("max_port_share_level", {
		helperText: tI18n(
			"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.the_maximum_level_of_port_sharing_allowed_for_wo_9de4a132",
		),
	});
	const maxPortShareHelperId = `${maxPortShareField.id}-helper`;
	const corsBehaviorField = getFieldHelpers("cors_behavior", {
		helperText: tI18n(
			"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.use_passthru_to_bypass_coder_s_built_in_cors_pro_d15662df",
		),
	});
	const corsBehaviorHelperId = `${corsBehaviorField.id}-helper`;

	return (
		<HorizontalForm
			onSubmit={form.handleSubmit}
			aria-label={tI18n(
				"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.template_settings_form_ffeb1444",
			)}
		>
			<FormSection
				title={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.general_info_9df01657",
				)}
				description={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.the_name_is_used_to_identify_the_template_in_url_0035a189",
				)}
			>
				<FormFields>
					<FormField
						field={getFieldHelpers("name")}
						label={tI18n(
							"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.name_dcd1d522",
						)}
						disabled={isSubmitting}
						onChange={onChangeTrimmed(form)}
						autoFocus
						className="w-full"
					/>
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.display_info_6a226cf7",
				)}
				description={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.a_friendly_name_description_and_icon_to_help_dev_7a9cbfe1",
				)}
			>
				<FormFields>
					<FormField
						field={getFieldHelpers("display_name")}
						label={tI18n(
							"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.display_name_2b7f6a84",
						)}
						disabled={isSubmitting}
						className="w-full"
					/>

					<div className="flex flex-col gap-2">
						<Label htmlFor={descriptionField.id}>
							{tI18n(
								"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.description_526e0087",
							)}
						</Label>
						<Textarea
							id={descriptionField.id}
							name={descriptionField.name}
							value={descriptionField.value ?? ""}
							onChange={descriptionField.onChange}
							onBlur={descriptionField.onBlur}
							disabled={isSubmitting}
							rows={2}
							aria-invalid={descriptionField.error}
							aria-describedby={
								descriptionField.helperText ? descriptionHelperId : undefined
							}
							className={cn(
								descriptionField.error && "border-border-destructive",
							)}
						/>
						{descriptionField.helperText && (
							<span
								id={descriptionHelperId}
								className={cn(
									"text-xs",
									descriptionField.error
										? "text-content-destructive"
										: "text-content-secondary",
								)}
							>
								{descriptionField.helperText}
							</span>
						)}
					</div>

					<IconField
						{...getFieldHelpers("icon")}
						disabled={isSubmitting}
						onChange={onChangeTrimmed(form)}
						fullWidth
						label={tI18n(
							"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.icon_a35abcd6",
						)}
						onPickEmoji={(value) => form.setFieldValue("icon", value)}
					/>
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.operations_358cc201",
				)}
				description={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.regulate_actions_allowed_on_workspaces_created_f_c953eaa8",
				)}
			>
				<FormFields className="gap-12">
					<div className="flex items-start">
						<Checkbox
							id="agents_allowed"
							name="agents_allowed"
							disabled={isSubmitting}
							checked={form.values.agents_allowed}
							onCheckedChange={(checked) => {
								form.setFieldValue("agents_allowed", checked === true);
							}}
						/>
						<Label htmlFor="agents_allowed">
							<StackLabel>
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.allow_coder_agents_to_create_workspaces_using_th_eb9e8d23",
								)}
							</StackLabel>
						</Label>
					</div>

					<div className="flex items-start">
						<Checkbox
							id="allow_user_cancel_workspace_jobs"
							name="allow_user_cancel_workspace_jobs"
							disabled={isSubmitting}
							checked={form.values.allow_user_cancel_workspace_jobs}
							onCheckedChange={(checked) => {
								form.setFieldValue(
									"allow_user_cancel_workspace_jobs",
									checked === true,
								);
							}}
						/>
						<Label htmlFor="allow_user_cancel_workspace_jobs">
							<StackLabel>
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.allow_users_to_cancel_in_progress_workspace_jobs_57c58235",
								)}
								<StackLabelHelperText>
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.depending_on_your_template_canceling_builds_may__a2852157",
									)}{" "}
									<strong>
										{tI18n(
											"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.if_checked_users_may_be_able_to_corrupt_their_wo_0c813c7e",
										)}
									</strong>
								</StackLabelHelperText>
							</StackLabel>
						</Label>
					</div>

					<div className="flex items-start">
						<Checkbox
							id="require_active_version"
							name="require_active_version"
							checked={form.values.require_active_version}
							onCheckedChange={(checked) => {
								form.setFieldValue("require_active_version", checked === true);
							}}
							disabled={
								!template.require_active_version && !advancedSchedulingEnabled
							}
						/>
						<Label htmlFor="require_active_version">
							<StackLabel>
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.require_workspaces_automatically_update_when_sta_384edbec",
								)}
								<StackLabelHelperText>
									<span>
										{tI18n(
											"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.workspaces_that_are_manually_started_or_auto_sta_28706e98",
										)}{" "}
										<strong>
											{tI18n(
												"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.this_setting_is_not_enforced_for_template_admins_5f569b18",
											)}
										</strong>
									</span>

									{!advancedSchedulingEnabled && (
										<div className="flex flex-row gap-4 items-center mt-4">
											<PremiumBadge />
											<span>
												{tI18n(
													"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.premium_license_required_to_be_enabled_06948795",
												)}
											</span>
										</div>
									)}
								</StackLabelHelperText>
							</StackLabel>
						</Label>
					</div>

					<div className="flex items-start">
						<Checkbox
							id="disable_module_cache"
							name="disable_module_cache"
							checked={form.values.disable_module_cache}
							onCheckedChange={(checked) => {
								form.setFieldValue("disable_module_cache", checked === true);
							}}
							disabled={isSubmitting}
						/>
						<Label htmlFor="disable_module_cache">
							<StackLabel>
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.disable_terraform_module_caching_da0077c2",
								)}
								<StackLabelHelperText>
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.when_checked_terraform_modules_are_re_downloaded_1169c00c",
									)}{" "}
									<strong>
										{tI18n(
											"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.warning_this_makes_workspace_builds_less_predict_43b726b0",
										)}
									</strong>
								</StackLabelHelperText>
							</StackLabel>
						</Label>
					</div>

					<div className="flex items-start">
						<Checkbox
							id="allow_workspace_renames"
							name="allow_workspace_renames"
							checked={form.values.allow_workspace_renames}
							onCheckedChange={(checked) => {
								form.setFieldValue("allow_workspace_renames", checked === true);
							}}
							disabled={isSubmitting}
						/>
						<Label htmlFor="allow_workspace_renames">
							<StackLabel>
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.allow_users_to_rename_their_workspaces_ed7ef9e0",
								)}
								<StackLabelHelperText>
									<div>
										{tI18n(
											"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.only_enable_this_if_your_template_does_not_use_t_47747245",
										)}
									</div>
									<Link
										className="text-xs"
										href={docs(
											"/admin/templates/extending-templates/resource-persistence",
										)}
									>
										{tI18n(
											"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.learn_more_1445799c",
										)}
									</Link>
								</StackLabelHelperText>
							</StackLabel>
						</Label>
					</div>
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.deprecate_45284c69",
				)}
				description={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.deprecating_a_template_prevents_any_new_workspac_fc8ad990",
				)}
			>
				<FormFields>
					<FormField
						field={getFieldHelpers("deprecation_message", {
							helperText: tI18n(
								"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.leave_the_message_empty_to_keep_the_template_act_4e637fe5",
							),
						})}
						label={tI18n(
							"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.deprecation_message_5ccc8f40",
						)}
						disabled={
							isSubmitting || (!template.deprecated && !accessControlEnabled)
						}
						className="w-full"
					/>
					{!accessControlEnabled && (
						<div className="flex flex-row gap-4 items-center">
							<PremiumBadge />
							<span className="text-xs text-content-secondary">
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.premium_license_required_to_deprecate_templates_da938291",
								)}
								{template.deprecated &&
									tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.you_cannot_change_the_message_but_you_may_remove_31623b51",
									)}
							</span>
						</div>
					)}
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.port_sharing_bfae45f6",
				)}
				description={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.shared_ports_with_the_public_sharing_level_can_b_988a8e5a",
				)}
			>
				<FormFields>
					<div className="flex flex-col gap-2">
						<Label htmlFor={maxPortShareField.id}>
							{tI18n(
								"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.maximum_port_sharing_level_359ae635",
							)}
						</Label>
						<Select
							value={
								portSharingControlsEnabled
									? form.values.max_port_share_level
									: "public"
							}
							onValueChange={(value) => {
								form.setFieldValue("max_port_share_level", value);
							}}
							disabled={isSubmitting || !portSharingControlsEnabled}
						>
							<SelectTrigger
								id={maxPortShareField.id}
								className={cn(
									"w-full",
									maxPortShareField.error && "border-border-destructive",
								)}
								aria-invalid={maxPortShareField.error}
								aria-describedby={
									maxPortShareField.helperText
										? maxPortShareHelperId
										: undefined
								}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="owner">
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.owner_4b1b8aa3",
									)}
								</SelectItem>
								<SelectItem value="organization">
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.organization_d764d425",
									)}
								</SelectItem>
								<SelectItem value="authenticated">
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.authenticated_6ab694cf",
									)}
								</SelectItem>
								<SelectItem value="public">
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.public_591935b1",
									)}
								</SelectItem>
							</SelectContent>
						</Select>
						{maxPortShareField.helperText && (
							<span
								id={maxPortShareHelperId}
								className={cn(
									"text-xs",
									maxPortShareField.error
										? "text-content-destructive"
										: "text-content-secondary",
								)}
							>
								{maxPortShareField.helperText}
							</span>
						)}
					</div>
					{!portSharingControlsEnabled && (
						<div className="flex flex-row gap-4 items-center">
							<PremiumBadge />
							<span className="text-xs text-content-secondary">
								{tI18n(
									"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.premium_license_required_to_control_max_port_sha_4063aba7",
								)}
							</span>
						</div>
					)}
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.cors_behavior_b1fcce04",
				)}
				description={tI18n(
					"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.control_how_cross_origin_resource_sharing_cors_r_37cfc8c5",
				)}
			>
				<FormFields>
					<div className="flex flex-col gap-2">
						<Label htmlFor={corsBehaviorField.id}>
							{tI18n(
								"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.cors_behavior_b1fcce04",
							)}
						</Label>
						<Select
							value={form.values.cors_behavior}
							onValueChange={(value) => {
								form.setFieldValue("cors_behavior", value);
							}}
							disabled={isSubmitting}
						>
							<SelectTrigger
								id={corsBehaviorField.id}
								className={cn(
									"w-full",
									corsBehaviorField.error && "border-border-destructive",
								)}
								aria-invalid={corsBehaviorField.error}
								aria-describedby={
									corsBehaviorField.helperText
										? corsBehaviorHelperId
										: undefined
								}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="simple">
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.simple_recommended_e3650e9f",
									)}
								</SelectItem>
								<SelectItem value="passthru">
									{tI18n(
										"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.passthru_b72ab480",
									)}
								</SelectItem>
							</SelectContent>
						</Select>
						{corsBehaviorField.helperText && (
							<span
								id={corsBehaviorHelperId}
								className={cn(
									"text-xs",
									corsBehaviorField.error
										? "text-content-destructive"
										: "text-content-secondary",
								)}
							>
								{corsBehaviorField.helperText}
							</span>
						)}
					</div>
				</FormFields>
			</FormSection>
			<FormFooter>
				<Button onClick={onCancel} variant="outline">
					{tI18n(
						"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.cancel_19766ed6",
					)}
				</Button>

				<Button type="submit" disabled={isSubmitting}>
					<Spinner loading={isSubmitting} />
					{tI18n(
						"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsForm.save_1509f561",
					)}
				</Button>
			</FormFooter>
		</HorizontalForm>
	);
};
