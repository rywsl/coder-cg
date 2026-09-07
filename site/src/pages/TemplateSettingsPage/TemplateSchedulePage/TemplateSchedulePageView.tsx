import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import type { Template, UpdateTemplateMeta } from "#/api/typesGenerated";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { TemplateScheduleForm } from "./TemplateScheduleForm";

interface TemplateSchedulePageViewProps {
	template: Template;
	onSubmit: (data: UpdateTemplateMeta) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	submitError?: unknown;
	initialTouched?: ComponentProps<
		typeof TemplateScheduleForm
	>["initialTouched"];
	allowAdvancedScheduling: boolean;
}

export const TemplateSchedulePageView: FC<TemplateSchedulePageViewProps> = ({
	template,
	onCancel,
	onSubmit,
	isSubmitting,
	allowAdvancedScheduling,
	submitError,
	initialTouched,
}) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<div className="flex flex-col gap-12">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"TemplateSettingsPage.TemplateSchedulePage.TemplateSchedulePageView.schedule_f4830a1d",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"TemplateSettingsPage.TemplateSchedulePage.TemplateSchedulePageView.configure_workspace_schedule_defaults_for_this_t_2cb3eb77",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<TemplateScheduleForm
				allowAdvancedScheduling={allowAdvancedScheduling}
				initialTouched={initialTouched}
				isSubmitting={isSubmitting}
				template={template}
				onSubmit={onSubmit}
				onCancel={onCancel}
				error={submitError}
			/>
		</div>
	);
};
