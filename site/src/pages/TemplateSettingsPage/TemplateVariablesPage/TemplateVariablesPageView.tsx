import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import type {
	CreateTemplateVersionRequest,
	TemplateVersion,
	TemplateVersionVariable,
} from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { TemplateVariablesForm } from "./TemplateVariablesForm";

interface TemplateVariablesPageViewProps {
	templateVersion?: TemplateVersion;
	templateVariables?: TemplateVersionVariable[];
	onSubmit: (data: CreateTemplateVersionRequest) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	errors?: {
		/**
		 * Failed to build a new template version
		 */
		buildError?: unknown;
		/**
		 * New version was created successfully, but publishing it failed
		 */
		publishError?: unknown;
	};
	initialTouched?: ComponentProps<
		typeof TemplateVariablesForm
	>["initialTouched"];
}

export const TemplateVariablesPageView: FC<TemplateVariablesPageViewProps> = ({
	templateVersion,
	templateVariables,
	onCancel,
	onSubmit,
	isSubmitting,
	errors = {},
	initialTouched,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const hasError = Object.values(errors).some((error) => Boolean(error));

	return (
		<div className="flex flex-col gap-12">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"TemplateSettingsPage.TemplateVariablesPage.TemplateVariablesPageView.variables_02db55ba",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"TemplateSettingsPage.TemplateVariablesPage.TemplateVariablesPageView.update_the_variables_used_by_this_template_fd7a6664",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			{hasError && (
				<div className="flex flex-col gap-4">
					{Boolean(errors.buildError) && (
						<ErrorAlert error={errors.buildError} />
					)}
					{Boolean(errors.publishError) && (
						<ErrorAlert error={errors.publishError} />
					)}
				</div>
			)}
			{templateVersion && templateVariables && templateVariables.length > 0 && (
				<TemplateVariablesForm
					initialTouched={initialTouched}
					isSubmitting={isSubmitting}
					templateVersion={templateVersion}
					templateVariables={templateVariables}
					onSubmit={onSubmit}
					onCancel={onCancel}
					error={errors.buildError}
				/>
			)}
			{templateVariables && templateVariables.length === 0 && (
				<Alert severity="info">
					{tI18n(
						"TemplateSettingsPage.TemplateVariablesPage.TemplateVariablesPageView.this_template_does_not_use_managed_variables_b4bd2c16",
					)}
				</Alert>
			)}
		</div>
	);
};
