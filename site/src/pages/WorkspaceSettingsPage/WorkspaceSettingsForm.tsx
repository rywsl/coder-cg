import { cn } from "cn";
import { useFormik } from "formik";
import upperFirst from "lodash/upperFirst";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import {
	type AutomaticUpdates,
	AutomaticUpdateses,
	type Workspace,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	FormFields,
	FormFooter,
	FormSection,
	HorizontalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { Label } from "#/components/Label/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

export type WorkspaceSettingsFormValues = {
	name: string;
	automatic_updates: AutomaticUpdates;
};

interface WorkspaceSettingsFormProps {
	workspace: Workspace;
	error: unknown;
	onCancel: () => void;
	onSubmit: (values: WorkspaceSettingsFormValues) => Promise<void>;
}

export const WorkspaceSettingsForm: FC<WorkspaceSettingsFormProps> = ({
	onCancel,
	onSubmit,
	workspace,
	error,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const formEnabled =
		!workspace.template_require_active_version || workspace.allow_renames;

	const form = useFormik<WorkspaceSettingsFormValues>({
		onSubmit,
		initialValues: {
			name: workspace.name,
			automatic_updates: workspace.automatic_updates,
		},
		validationSchema: Yup.object({
			name: nameValidator(
				tI18n("WorkspaceSettingsPage.WorkspaceSettingsForm.name_dcd1d522"),
			),
			automatic_updates: Yup.string().oneOf(AutomaticUpdateses),
		}),
	});
	const getFieldHelpers = getFormHelpers<WorkspaceSettingsFormValues>(
		form,
		error,
	);
	const automaticUpdatesField = getFieldHelpers("automatic_updates", {
		helperText: workspace.template_require_active_version
			? tI18n(
					"WorkspaceSettingsPage.WorkspaceSettingsForm.the_template_for_this_workspace_requires_automat_39483add",
				)
			: undefined,
	});
	const automaticUpdatesHelperId = `${automaticUpdatesField.id}-helper`;

	return (
		<HorizontalForm onSubmit={form.handleSubmit} data-testid="form">
			<FormSection
				title={tI18n(
					"WorkspaceSettingsPage.WorkspaceSettingsForm.workspace_name_6fa5a5b1",
				)}
				description={tI18n(
					"WorkspaceSettingsPage.WorkspaceSettingsForm.update_the_name_of_your_workspace_9e8775b9",
				)}
			>
				<FormFields>
					<FormField
						field={getFieldHelpers("name", {
							helperText: workspace.allow_renames
								? form.values.name !== form.initialValues.name && (
										<span className="text-content-warning">
											{tI18n(
												"WorkspaceSettingsPage.WorkspaceSettingsForm.depending_on_the_template_renaming_your_workspac_bf87b1f2",
											)}
										</span>
									)
								: "Renaming your workspace can be destructive and is disabled by the template.",
						})}
						label={tI18n(
							"WorkspaceSettingsPage.WorkspaceSettingsForm.name_dcd1d522",
						)}
						disabled={!workspace.allow_renames || form.isSubmitting}
						onChange={onChangeTrimmed(form)}
						autoFocus
						className="w-full"
					/>
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n(
					"WorkspaceSettingsPage.WorkspaceSettingsForm.automatic_updates_e8287a1a",
				)}
				description={tI18n(
					"WorkspaceSettingsPage.WorkspaceSettingsForm.configure_your_workspace_to_automatically_update_271dbfdd",
				)}
			>
				<FormFields>
					<div className="flex flex-col gap-2">
						<Label htmlFor={automaticUpdatesField.id}>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceSettingsForm.update_policy_829fd2b1",
							)}
						</Label>
						<Select
							value={
								workspace.template_require_active_version
									? "always"
									: form.values.automatic_updates
							}
							onValueChange={(value) =>
								void form.setFieldValue("automatic_updates", value)
							}
							disabled={
								form.isSubmitting || workspace.template_require_active_version
							}
						>
							<SelectTrigger
								id={automaticUpdatesField.id}
								className={cn(
									"w-full",
									automaticUpdatesField.error && "border-border-destructive",
								)}
								aria-invalid={automaticUpdatesField.error}
								aria-describedby={
									automaticUpdatesField.helperText
										? automaticUpdatesHelperId
										: undefined
								}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{AutomaticUpdateses.map((value) => (
									<SelectItem value={value} key={value}>
										{upperFirst(value)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{automaticUpdatesField.helperText && (
							<span
								id={automaticUpdatesHelperId}
								className={cn(
									"text-xs",
									automaticUpdatesField.error
										? "text-content-destructive"
										: "text-content-secondary",
								)}
							>
								{automaticUpdatesField.helperText}
							</span>
						)}
					</div>
				</FormFields>
			</FormSection>
			{formEnabled && (
				<FormFooter>
					<Button onClick={onCancel} variant="outline">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceSettingsForm.cancel_19766ed6",
						)}
					</Button>

					<Button type="submit" disabled={form.isSubmitting}>
						<Spinner loading={form.isSubmitting} />
						{tI18n("WorkspaceSettingsPage.WorkspaceSettingsForm.save_1509f561")}
					</Button>
				</FormFooter>
			)}
		</HorizontalForm>
	);
};
