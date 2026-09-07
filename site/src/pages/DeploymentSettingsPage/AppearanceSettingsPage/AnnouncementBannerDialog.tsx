import { cn } from "cn";
import { useFormik } from "formik";
import { type FC, useState } from "react";
import { SliderPicker, TwitterPicker } from "react-color";
import { useTranslation } from "react-i18next";
import type { BannerConfig } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Label } from "#/components/Label/Label";
import { Textarea } from "#/components/Textarea/Textarea";
import { AnnouncementBannerView } from "#/modules/dashboard/AnnouncementBanners/AnnouncementBannerView";
import { useTheme } from "#/theme/context";
import { getFormHelpers } from "#/utils/formUtils";

interface AnnouncementBannerDialogProps {
	banner: BannerConfig;
	onCancel: () => void;
	onUpdate: (banner: Partial<BannerConfig>) => Promise<void>;
}

export const AnnouncementBannerDialog: FC<AnnouncementBannerDialogProps> = ({
	banner,
	onCancel,
	onUpdate,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const theme = useTheme();
	const isCreating = banner.message === "";

	const bannerForm = useFormik<{
		message: string;
		background_color: string;
	}>({
		initialValues: {
			message: banner.message ?? "",
			background_color: banner.background_color ?? "#ABB8C3",
		},
		onSubmit: (banner) => onUpdate(banner),
	});
	const getFieldHelpers = getFormHelpers(bannerForm);
	const messageField = getFieldHelpers("message", {
		helperText: tI18n(
			"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.markdown_bold_italics_and_links_are_supported_46408fbd",
		),
	});
	const messageHelperId = `${messageField.id}-helper`;
	const messageErrorId = `${messageField.id}-error`;

	const [showHuePicker, setShowHuePicker] = useState(false);
	const previewMessage = bannerForm.values.message.trim();

	return (
		<Dialog
			open
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onCancel();
				}
			}}
		>
			{/* Banner preview. Rendered outside DialogContent so its fixed
			    positioning is relative to the viewport, not the dialog's
			    transformed containing block. */}
			<div className="pointer-events-none fixed top-0 right-0 left-0 z-60">
				<AnnouncementBannerView
					message={bannerForm.values.message}
					backgroundColor={bannerForm.values.background_color}
				/>
			</div>
			<DialogContent
				className="max-w-[500px]"
				data-testid="dialog"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>
						{tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.announcement_banner_fbdcf7ab",
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor={messageField.id}>
							{tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.message_2f77668a",
							)}
						</Label>
						<Textarea
							id={messageField.id}
							name={messageField.name}
							value={messageField.value}
							onChange={messageField.onChange}
							onBlur={messageField.onBlur}
							rows={3}
							placeholder={tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.enter_a_message_for_the_banner_f3df2442",
							)}
							aria-invalid={messageField.error}
							aria-describedby={
								messageField.error
									? messageErrorId
									: messageField.helperText
										? messageHelperId
										: undefined
							}
							className={cn(messageField.error && "border-border-destructive")}
						/>
						{messageField.error ? (
							<span
								id={messageErrorId}
								className="text-xs text-content-destructive"
							>
								{messageField.helperText}
							</span>
						) : (
							messageField.helperText && (
								<span
									id={messageHelperId}
									className="text-xs text-content-secondary"
								>
									{messageField.helperText}
								</span>
							)
						)}
					</div>
					<div>
						<h4 className="m-0 mb-2 text-base font-semibold text-content-primary">
							{tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.background_color_3e314daf",
							)}
						</h4>
						<div className="flex flex-col gap-4">
							{showHuePicker ? (
								<SliderPicker
									color={bannerForm.values.background_color}
									onChange={async (color) => {
										await bannerForm.setFieldValue(
											"background_color",
											color.hex,
										);
									}}
								/>
							) : (
								<TwitterPicker
									color={bannerForm.values.background_color}
									onChange={async (color) => {
										await bannerForm.setFieldValue(
											"background_color",
											color.hex,
										);
									}}
									triangle="hide"
									colors={[
										"#8b5cf6",
										"#d94a5d",
										"#f78da7",
										"#d65d0f",
										"#ff6900",
										"#fcb900",
										"#0693e3",

										"#8ed1fc",
										"#4cd473",
										"#abb8c3",
									]}
									styles={{
										default: {
											input: {
												color: "white",
												backgroundColor: theme.palette.background.default,
											},
											body: {
												backgroundColor: "transparent",
												color: "white",
												padding: 0,
											},
											card: {
												backgroundColor: "transparent",
											},
										},
									}}
								/>
							)}
							<div>
								<Button
									variant="outline"
									onClick={() => setShowHuePicker((it) => !it)}
								>
									{tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.show_dd0fcd29",
									)}
									{showHuePicker
										? tI18n(
												"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.palette_19e4bd2d",
											)
										: tI18n(
												"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.slider_e0d98dc3",
											)}
								</Button>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<DialogActions
						cancelText={tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.cancel_19766ed6",
						)}
						confirmLoading={bannerForm.isSubmitting}
						confirmText={
							isCreating
								? tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.create_4759498a",
									)
								: tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerDialog.update_c1c1009d",
									)
						}
						confirmDisabled={bannerForm.isSubmitting || previewMessage === ""}
						onCancel={onCancel}
						onConfirm={bannerForm.handleSubmit}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
