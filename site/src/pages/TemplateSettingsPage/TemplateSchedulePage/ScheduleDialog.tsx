import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import type { ConfirmDialogProps } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";

interface ScheduleDialogProps
	extends Pick<
		ConfirmDialogProps,
		| "open"
		| "onClose"
		| "onConfirm"
		| "title"
		| "cancelText"
		| "confirmLoading"
		| "disabled"
		| "hideCancel"
	> {
	readonly inactiveWorkspacesToGoDormant: number;
	readonly inactiveWorkspacesToGoDormantInWeek: number;
	readonly dormantWorkspacesToBeDeleted: number;
	readonly dormantWorkspacesToBeDeletedInWeek: number;
	readonly updateDormantWorkspaces: (confirm: boolean) => void;
	readonly updateInactiveWorkspaces: (confirm: boolean) => void;
	readonly dormantWorkspacesChecked: boolean;
	readonly inactiveWorkspacesChecked: boolean;
	readonly dormantValueChanged: boolean;
	readonly deletionValueChanged: boolean;
}

export const ScheduleDialog: FC<ScheduleDialogProps> = ({
	cancelText,
	confirmLoading,
	disabled = false,
	hideCancel = false,
	onClose,
	onConfirm,
	open = false,
	title,
	inactiveWorkspacesToGoDormant,
	inactiveWorkspacesToGoDormantInWeek,
	dormantWorkspacesToBeDeleted,
	dormantWorkspacesToBeDeletedInWeek,
	updateDormantWorkspaces,
	updateInactiveWorkspaces,
	dormantWorkspacesChecked,
	inactiveWorkspacesChecked,
	dormantValueChanged,
	deletionValueChanged,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const showDormancyWarning =
		dormantValueChanged &&
		(inactiveWorkspacesToGoDormant > 0 ||
			inactiveWorkspacesToGoDormantInWeek > 0);
	const showDeletionWarning =
		deletionValueChanged &&
		(dormantWorkspacesToBeDeleted > 0 ||
			dormantWorkspacesToBeDeletedInWeek > 0);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
		>
			<DialogContent
				variant="destructive"
				data-testid="dialog"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4 text-sm text-content-secondary font-medium [&_strong]:text-content-primary">
					{showDormancyWarning && (
						<div className="flex flex-col gap-3">
							<h4 className="m-0 text-base font-semibold text-content-primary">
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.dormancy_threshold_8558e0a1",
								)}
							</h4>
							<p className="m-0 leading-relaxed">
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.this_change_will_result_in_7381e7f3",
								)}{" "}
								<strong>{inactiveWorkspacesToGoDormant}</strong>{" "}
								{inactiveWorkspacesToGoDormant === 1
									? tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspace_21a3230e",
										)
									: tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspaces_6e8d7998",
										)}{" "}
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.being_immediately_transitioned_to_the_dormant_st_3788c2de",
								)}{" "}
								<strong>{inactiveWorkspacesToGoDormantInWeek}</strong>{" "}
								{inactiveWorkspacesToGoDormantInWeek === 1
									? tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspace_21a3230e",
										)
									: tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspaces_6e8d7998",
										)}{" "}
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.over_the_next_7_days_to_prevent_this_do_you_want_9fa52bc7",
								)}
							</p>
							<label
								htmlFor="prevent-dormancy"
								className="flex items-center gap-2 text-content-primary"
							>
								<Checkbox
									id="prevent-dormancy"
									checked={inactiveWorkspacesChecked}
									onCheckedChange={(checked) => {
										updateInactiveWorkspaces(checked === true);
									}}
								/>
								<span>
									{tI18n(
										"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.prevent_dormancy_reset_all_workspace_inactivity__c7e2822d",
									)}
								</span>
							</label>
						</div>
					)}

					{showDeletionWarning && (
						<div className="flex flex-col gap-3">
							<h4 className="m-0 text-base font-semibold text-content-primary">
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.dormancy_auto_deletion_c77d7e63",
								)}
							</h4>
							<p className="m-0 leading-relaxed">
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.this_change_will_result_in_7381e7f3",
								)}{" "}
								<strong>{dormantWorkspacesToBeDeleted}</strong>{" "}
								{dormantWorkspacesToBeDeleted === 1
									? tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspace_21a3230e",
										)
									: tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspaces_6e8d7998",
										)}{" "}
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.being_immediately_deleted_and_762e17c6",
								)}{" "}
								<strong>{dormantWorkspacesToBeDeletedInWeek}</strong>{" "}
								{dormantWorkspacesToBeDeletedInWeek === 1
									? tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspace_21a3230e",
										)
									: tI18n(
											"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.workspaces_6e8d7998",
										)}{" "}
								{tI18n(
									"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.over_the_next_7_days_to_prevent_this_do_you_want_1e29716f",
								)}
							</p>
							<label
								htmlFor="prevent-deletion"
								className="flex items-center gap-2 text-content-primary"
							>
								<Checkbox
									id="prevent-deletion"
									checked={dormantWorkspacesChecked}
									onCheckedChange={(checked) => {
										updateDormantWorkspaces(checked === true);
									}}
								/>
								<span>
									{tI18n(
										"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.prevent_deletion_reset_all_workspace_dormancy_pe_40b67213",
									)}
								</span>
							</label>
						</div>
					)}
				</div>

				<DialogFooter>
					<DialogActions
						cancelText={cancelText}
						confirmLoading={confirmLoading}
						confirmText={tI18n(
							"TemplateSettingsPage.TemplateSchedulePage.ScheduleDialog.submit_155f816c",
						)}
						confirmDisabled={disabled}
						confirmVariant="destructive"
						onCancel={!hideCancel ? onClose : undefined}
						onConfirm={onConfirm || onClose}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
