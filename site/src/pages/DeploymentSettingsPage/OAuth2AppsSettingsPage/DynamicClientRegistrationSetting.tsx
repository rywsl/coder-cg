import { type FC, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { Spinner } from "#/components/Spinner/Spinner";

type DynamicClientRegistrationSettingProps = {
	enabled: boolean;
	canEdit: boolean;
	isUpdating: boolean;
	onChange: (enabled: boolean) => void;
};

export const DynamicClientRegistrationSetting: FC<
	DynamicClientRegistrationSettingProps
> = ({ enabled, canEdit, isUpdating, onChange }) => {
	const { t: tI18n } = useTranslation("administration");

	const headingId = useId();
	const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	return (
		<>
			<section
				aria-labelledby={headingId}
				className="flex flex-row items-start justify-between gap-8"
			>
				<div className="flex flex-col gap-1 max-w-xl">
					<div className="flex flex-row items-center gap-2">
						<h2
							id={headingId}
							className="text-content-primary text-base font-semibold m-0"
						>
							{tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.dynamic_client_registration_86d7b75f",
							)}
						</h2>
						{enabled && (
							<Badge size="sm" variant="green" className="border-0 shadow-none">
								{tI18n(
									"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.enabled_92c1cdfd",
								)}
							</Badge>
						)}
					</div>
					{/*
					 * Disabling only gates the registration endpoint. It deletes no apps,
					 * secrets, or tokens, so the caveat stays visible in both states: an
					 * admin who has just disabled needs it as much as one deciding to.
					 */}
					<p className="text-sm text-content-secondary m-0">
						{tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.allow_oauth2_clients_to_register_themselves_at_8adea33c",
						)}{" "}
						<code className="text-xs">/oauth2/register</code>
						{tI18n(
							"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.without_prior_administrator_approval_rfc_7591_di_c2a4043c",
						)}
					</p>
					{/*
					 * A disabled button takes no focus and no pointer events, so it
					 * cannot carry the reason it is disabled. Stating the reason here
					 * puts it in reading order ahead of the button for everyone.
					 */}
					{!canEdit && (
						<p className="text-sm text-content-secondary m-0 mt-1">
							{tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.you_need_permission_to_edit_deployment_configura_5673b79d",
							)}
						</p>
					)}
				</div>

				{/*
				 * Lacking permission is permanent, so the button is genuinely
				 * unavailable and takes the native attribute. An in-flight request is
				 * momentary and the button is where focus already is, so it goes inert
				 * without leaving the tab order: disabling a focused element blurs it,
				 * which drops a keyboard user back to the top of the document mid-flip.
				 */}
				<Button
					ref={buttonRef}
					variant={enabled ? "outline" : "default"}
					disabled={!canEdit}
					aria-disabled={isUpdating}
					className="aria-disabled:pointer-events-none"
					onClick={() => {
						if (isUpdating) {
							return;
						}
						if (enabled) {
							onChange(false);
						} else {
							setIsEnableDialogOpen(true);
						}
					}}
				>
					<Spinner loading={isUpdating} aria-hidden />
					{enabled
						? tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.disable_b7e3e4aa",
							)
						: tI18n(
								"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.enable_5342e09f",
							)}
				</Button>
			</section>
			<ConfirmDialog
				type="delete"
				open={isEnableDialogOpen}
				onConfirm={() => {
					setIsEnableDialogOpen(false);
					onChange(true);
				}}
				onClose={() => setIsEnableDialogOpen(false)}
				// Radix returns focus to its trigger on close, and this dialog has
				// none, so focus would land on <body>. Focusing from the handlers
				// above does not survive: Radix moves focus again when the exit
				// animation ends.
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					buttonRef.current?.focus();
				}}
				title={tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.enable_dynamic_client_registration_6973b685",
				)}
				confirmText={tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.enable_5342e09f",
				)}
				description={tI18n(
					"DeploymentSettingsPage.OAuth2AppsSettingsPage.DynamicClientRegistrationSetting.any_client_that_can_reach_this_deployment_will_b_5bd0287f",
				)}
			/>
		</>
	);
};
