import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import type { Template, UpdateTemplateMeta } from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { TemplateSettingsForm } from "./TemplateSettingsForm";

interface TemplateSettingsPageViewProps {
	template: Template;
	onSubmit: (data: UpdateTemplateMeta) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	submitError?: unknown;
	initialTouched?: ComponentProps<
		typeof TemplateSettingsForm
	>["initialTouched"];
	accessControlEnabled: boolean;
	advancedSchedulingEnabled: boolean;
	sharedPortControlsEnabled: boolean;
}

export const TemplateSettingsPageView: FC<TemplateSettingsPageViewProps> = ({
	template,
	onCancel,
	onSubmit,
	isSubmitting,
	submitError,
	initialTouched,
	accessControlEnabled,
	advancedSchedulingEnabled,
	sharedPortControlsEnabled,
}) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<div className="flex flex-col gap-12">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsPageView.general_c910d474",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"TemplateSettingsPage.TemplateGeneralSettingsPage.TemplateSettingsPageView.update_template_metadata_and_workspace_policies_3e01219a",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<TemplateSettingsForm
				initialTouched={initialTouched}
				isSubmitting={isSubmitting}
				template={template}
				onSubmit={onSubmit}
				onCancel={onCancel}
				error={submitError}
				accessControlEnabled={accessControlEnabled}
				advancedSchedulingEnabled={advancedSchedulingEnabled}
				portSharingControlsEnabled={sharedPortControlsEnabled}
			/>
		</div>
	);
};
