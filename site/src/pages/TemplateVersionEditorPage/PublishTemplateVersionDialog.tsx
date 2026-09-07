import { cn } from "cn";
import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { EnterpriseBadge } from "#/components/Badge/PresetBadges";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { FormFields } from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverLink,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
} from "#/components/HelpPopover/HelpPopover";
import { Label } from "#/components/Label/Label";
import { Textarea } from "#/components/Textarea/Textarea";
import type { PublishVersionData } from "#/pages/TemplateVersionEditorPage/types";
import { docs } from "#/utils/docs";
import { getFormHelpers } from "#/utils/formUtils";

type PublishTemplateVersionDialogProps = {
	open: boolean;
	defaultName: string;
	isPublishing: boolean;
	publishingError?: unknown;
	onClose: () => void;
	onConfirm: (data: PublishVersionData) => void;
};

export const PublishTemplateVersionDialog: FC<
	PublishTemplateVersionDialogProps
> = ({
	open,
	onConfirm,
	isPublishing,
	onClose,
	defaultName,
	publishingError,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const form = useFormik({
		initialValues: {
			name: defaultName,
			message: "",
			isActiveVersion: true,
		},
		validationSchema: Yup.object({
			name: Yup.string().required(),
			message: Yup.string(),
			isActiveVersion: Yup.boolean(),
		}),
		onSubmit: onConfirm,
	});
	const getFieldHelpers = getFormHelpers(form, publishingError);
	const messageField = getFieldHelpers("message");
	const messageErrorId = `${messageField.id}-error`;
	const handleClose = () => {
		form.resetForm();
		onClose();
	};

	return (
		<ConfirmDialog
			open={open}
			confirmLoading={isPublishing}
			onClose={handleClose}
			onConfirm={async () => {
				await form.submitForm();
			}}
			hideCancel={false}
			type="success"
			cancelText={tI18n(
				"TemplateVersionEditorPage.PublishTemplateVersionDialog.cancel_19766ed6",
			)}
			confirmText={tI18n(
				"TemplateVersionEditorPage.PublishTemplateVersionDialog.publish_859390eb",
			)}
			title={tI18n(
				"TemplateVersionEditorPage.PublishTemplateVersionDialog.publish_new_version_2d25c9b1",
			)}
			description={
				<form id="publish-version" onSubmit={form.handleSubmit}>
					<div className="flex flex-col gap-4">
						<p>
							{tI18n(
								"TemplateVersionEditorPage.PublishTemplateVersionDialog.you_are_about_to_publish_a_new_version_of_this_t_debd40ff",
							)}
						</p>
						<FormFields>
							<FormField
								field={getFieldHelpers("name")}
								label={tI18n(
									"TemplateVersionEditorPage.PublishTemplateVersionDialog.version_name_c5be1c55",
								)}
								autoFocus
								disabled={isPublishing}
							/>

							<div className="flex flex-col gap-2">
								<Label htmlFor={messageField.id}>
									{tI18n(
										"TemplateVersionEditorPage.PublishTemplateVersionDialog.message_2f77668a",
									)}
								</Label>
								<Textarea
									id={messageField.id}
									name={messageField.name}
									value={messageField.value ?? ""}
									onChange={messageField.onChange}
									onBlur={messageField.onBlur}
									placeholder={tI18n(
										"TemplateVersionEditorPage.PublishTemplateVersionDialog.write_a_short_message_about_the_changes_you_made_25e75970",
									)}
									disabled={isPublishing}
									rows={5}
									aria-invalid={messageField.error}
									aria-describedby={
										messageField.error ? messageErrorId : undefined
									}
									className={cn(
										messageField.error && "border-border-destructive",
									)}
								/>
								{messageField.error && (
									<span
										id={messageErrorId}
										className="text-xs text-content-destructive"
									>
										{messageField.helperText}
									</span>
								)}
							</div>

							<div className="flex flex-row items-center gap-4">
								<div className="flex items-center gap-2">
									<Checkbox
										id="isActiveVersion"
										checked={form.values.isActiveVersion}
										onCheckedChange={(checked) => {
											void form.setFieldValue(
												"isActiveVersion",
												Boolean(checked),
											);
										}}
										name="isActiveVersion"
									/>
									<Label htmlFor="isActiveVersion" className="cursor-pointer">
										{tI18n(
											"TemplateVersionEditorPage.PublishTemplateVersionDialog.promote_to_active_version_48004815",
										)}
									</Label>
								</div>

								<HelpPopover>
									<HelpPopoverIconTrigger />
									<HelpPopoverContent>
										<HelpPopoverTitle>
											{tI18n(
												"TemplateVersionEditorPage.PublishTemplateVersionDialog.active_versions_8969a7b0",
											)}
										</HelpPopoverTitle>
										<HelpPopoverText>
											{tI18n(
												"TemplateVersionEditorPage.PublishTemplateVersionDialog.templates_can_enforce_that_the_active_version_be_ffee1e41",
											)}
											<EnterpriseBadge />
										</HelpPopoverText>
										<HelpPopoverLinksGroup>
											<HelpPopoverLink
												href={docs(
													"/admin/templates/managing-templates#template-update-policies",
												)}
											>
												{tI18n(
													"TemplateVersionEditorPage.PublishTemplateVersionDialog.review_the_documentation_aa0f2c23",
												)}
											</HelpPopoverLink>
										</HelpPopoverLinksGroup>
									</HelpPopoverContent>
								</HelpPopover>
							</div>
						</FormFields>
					</div>
				</form>
			}
		/>
	);
};
