import { type FC, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type ShareableWorkspaceOwners,
	ShareableWorkspaceOwnerses,
} from "#/api/typesGenerated";
import { Alert, AlertTitle } from "#/components/Alert/Alert";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { FormSection, HorizontalForm } from "#/components/Form/Form";
import { RadioGroup, RadioGroupItem } from "#/components/RadioGroup/RadioGroup";
import { DisableWorkspaceSharingDialog } from "./DisableWorkspaceSharingDialog";

const isShareableWorkspaceOwners = (
	value: string,
): value is ShareableWorkspaceOwners =>
	ShareableWorkspaceOwnerses.some((option) => option === value);

type WorkspaceSharingSectionProps = {
	organizationId: string;
	workspaceSharingGloballyDisabled?: boolean;
	shareableWorkspaceOwners: ShareableWorkspaceOwners;
	onChangeShareableOwners: (value: ShareableWorkspaceOwners) => void;
	isTogglingWorkspaceSharing: boolean;
};

export const WorkspaceSharingSection: FC<WorkspaceSharingSectionProps> = ({
	organizationId,
	workspaceSharingGloballyDisabled,
	shareableWorkspaceOwners,
	onChangeShareableOwners,
	isTogglingWorkspaceSharing,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [pendingSharingChange, setPendingSharingChange] =
		useState<ShareableWorkspaceOwners | null>(null);

	const id = useId();
	const workspaceSharingId = `${id}-workspace-sharing`;
	const sharingServiceAccountsId = `${id}-sharing-service-accounts`;
	const sharingEveryoneId = `${id}-sharing-everyone`;

	return (
		<>
			<HorizontalForm className="mt-12">
				<FormSection
					title={tI18n(
						"OrganizationSettingsPage.WorkspaceSharingSection.workspace_sharing_3eee503a",
					)}
					description={tI18n(
						"OrganizationSettingsPage.WorkspaceSharingSection.control_whether_workspace_owners_can_share_their_e4760fc9",
					)}
				>
					<div className="flex flex-col gap-2">
						{workspaceSharingGloballyDisabled && (
							<Alert severity="warning" className="mb-4">
								<AlertTitle>
									{tI18n(
										"OrganizationSettingsPage.WorkspaceSharingSection.disabled_by_deployment_settings_7267a26f",
									)}
								</AlertTitle>
								{tI18n(
									"OrganizationSettingsPage.WorkspaceSharingSection.workspace_sharing_has_been_disallowed_by_an_admi_73a16962",
								)}
							</Alert>
						)}
						<div className="flex items-start gap-3">
							<Checkbox
								id={workspaceSharingId}
								checked={
									!workspaceSharingGloballyDisabled &&
									shareableWorkspaceOwners !== "none"
								}
								disabled={
									workspaceSharingGloballyDisabled || isTogglingWorkspaceSharing
								}
								onCheckedChange={(checked) => {
									if (checked) {
										onChangeShareableOwners("service_accounts");
									} else {
										setPendingSharingChange("none");
									}
								}}
							/>
							<div className="flex flex-col gap-3">
								<div className="flex flex-col">
									<label
										htmlFor={workspaceSharingId}
										className="text-sm cursor-pointer"
									>
										{tI18n(
											"OrganizationSettingsPage.WorkspaceSharingSection.allow_workspace_sharing_60d64ade",
										)}
									</label>
									<div className="text-xs text-content-secondary">
										{tI18n(
											"OrganizationSettingsPage.WorkspaceSharingSection.when_enabled_workspace_owners_can_share_their_wo_6d874593",
										)}
									</div>
								</div>
								{shareableWorkspaceOwners !== "none" &&
									!workspaceSharingGloballyDisabled && (
										<RadioGroup
											value={shareableWorkspaceOwners}
											onValueChange={(value) => {
												if (!isShareableWorkspaceOwners(value)) {
													return;
												}
												// Restricting from everyone to service accounts
												// revokes existing shares, so confirm first.
												if (
													shareableWorkspaceOwners === "everyone" &&
													value === "service_accounts"
												) {
													setPendingSharingChange("service_accounts");
												} else {
													onChangeShareableOwners(value);
												}
											}}
											disabled={isTogglingWorkspaceSharing}
											className="ml-1"
										>
											<div className="flex items-start gap-2">
												<RadioGroupItem
													value="service_accounts"
													id={sharingServiceAccountsId}
													className="mt-0.5"
												/>
												<div className="flex flex-col">
													<label
														htmlFor={sharingServiceAccountsId}
														className="text-sm cursor-pointer"
													>
														{tI18n(
															"OrganizationSettingsPage.WorkspaceSharingSection.only_service_accounts_can_share_workspaces_50726efa",
														)}
													</label>
													<span className="text-xs text-content-secondary">
														{tI18n(
															"OrganizationSettingsPage.WorkspaceSharingSection.service_accounts_are_non_login_accounts_typicall_7fb7b8c3",
														)}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<RadioGroupItem
													value="everyone"
													id={sharingEveryoneId}
												/>
												<label
													htmlFor={sharingEveryoneId}
													className="text-sm cursor-pointer"
												>
													{tI18n(
														"OrganizationSettingsPage.WorkspaceSharingSection.all_members_can_share_workspaces_f2a10adc",
													)}
												</label>
											</div>
										</RadioGroup>
									)}
							</div>
						</div>
					</div>
				</FormSection>
			</HorizontalForm>
			<DisableWorkspaceSharingDialog
				isOpen={pendingSharingChange !== null}
				organizationId={organizationId}
				newSetting={pendingSharingChange ?? "none"}
				onConfirm={async () => {
					if (pendingSharingChange !== null) {
						await onChangeShareableOwners(pendingSharingChange);
					}
					setPendingSharingChange(null);
				}}
				onCancel={() => setPendingSharingChange(null)}
				isLoading={isTogglingWorkspaceSharing}
			/>
		</>
	);
};
