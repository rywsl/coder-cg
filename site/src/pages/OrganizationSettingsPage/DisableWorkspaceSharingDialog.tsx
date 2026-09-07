import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { API } from "#/api/api";
import type { ShareableWorkspaceOwners } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { Spinner } from "#/components/Spinner/Spinner";

interface DisableWorkspaceSharingDialogProps {
	isOpen: boolean;
	organizationId: string;
	newSetting: ShareableWorkspaceOwners;
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
}

export const DisableWorkspaceSharingDialog: FC<
	DisableWorkspaceSharingDialogProps
> = ({
	isOpen,
	organizationId,
	newSetting: targetValue,
	onConfirm,
	onCancel,
	isLoading,
}) => {
	const { t: tI18n } = useTranslation("administration");

	// Fetch the count of shared workspaces in this organization.
	const sharedWorkspacesQuery = useQuery({
		queryKey: ["workspaces", organizationId, "shared", "count"],
		queryFn: async () => {
			const response = await API.getWorkspaces({
				q: `organization:${organizationId} shared:true`,
				limit: 0, // Avoid fetching workspaces as we only need the count.
			});
			return response.count;
		},
		enabled: isOpen,
	});

	const sharedCount = sharedWorkspacesQuery.data ?? 0;
	const isLoadingCount = sharedWorkspacesQuery.isLoading;
	const isRestrictingToServiceAccounts = targetValue === "service_accounts";

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent variant="destructive" className="max-w-xl">
				<DialogHeader>
					<DialogTitle>
						{isRestrictingToServiceAccounts
							? tI18n(
									"OrganizationSettingsPage.DisableWorkspaceSharingDialog.restrict_sharing_to_service_accounts_77249135",
								)
							: tI18n(
									"OrganizationSettingsPage.DisableWorkspaceSharingDialog.disable_workspace_sharing_0a74542e",
								)}
					</DialogTitle>
					<DialogDescription asChild>
						<div className="flex flex-col gap-4">
							<p>
								{isRestrictingToServiceAccounts
									? tI18n(
											"OrganizationSettingsPage.DisableWorkspaceSharingDialog.restricting_workspace_sharing_to_service_account_f8d50470",
										)
									: tI18n(
											"OrganizationSettingsPage.DisableWorkspaceSharingDialog.disabling_workspace_sharing_will_immediately_rem_b0328bde",
										)}
							</p>
							{isLoadingCount ? (
								<Skeleton className="h-6 w-4/5" />
							) : sharedCount > 0 ? (
								<p className="text-content-danger font-medium m-0">
									{tI18n(
										"OrganizationSettingsPage.DisableWorkspaceSharingDialog.this_action_will_affect_8874be80",
									)}{" "}
									<strong className="text-content-primary">
										{sharedCount}
										{tI18n(
											"OrganizationSettingsPage.DisableWorkspaceSharingDialog.workspace_4be0369b",
										)}
										{sharedCount !== 1
											? tI18n(
													"OrganizationSettingsPage.DisableWorkspaceSharingDialog.s_043a7187",
												)
											: ""}
									</strong>{" "}
									{tI18n(
										"OrganizationSettingsPage.DisableWorkspaceSharingDialog.that_a0496121",
									)}
									{sharedCount !== 1
										? tI18n(
												"OrganizationSettingsPage.DisableWorkspaceSharingDialog.are_ba78973d",
											)
										: tI18n(
												"OrganizationSettingsPage.DisableWorkspaceSharingDialog.is_fa51fd49",
											)}
									{tI18n(
										"OrganizationSettingsPage.DisableWorkspaceSharingDialog.currently_shared_eceeff13",
									)}
								</p>
							) : (
								<p className="text-content-secondary m-0">
									{tI18n(
										"OrganizationSettingsPage.DisableWorkspaceSharingDialog.no_workspaces_are_currently_shared_in_this_organ_972db800",
									)}
								</p>
							)}
							<p>
								{tI18n(
									"OrganizationSettingsPage.DisableWorkspaceSharingDialog.re_enabling_workspace_sharing_will_84041437",
								)}{" "}
								<strong className="text-content-primary">
									{tI18n(
										"OrganizationSettingsPage.DisableWorkspaceSharingDialog.not_restore_d455f0f6",
									)}
								</strong>{" "}
								{tI18n(
									"OrganizationSettingsPage.DisableWorkspaceSharingDialog.these_permissions_7d675017",
								)}
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={isLoading}>
						{tI18n(
							"OrganizationSettingsPage.DisableWorkspaceSharingDialog.cancel_19766ed6",
						)}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
					>
						<Spinner loading={isLoading} />
						{isRestrictingToServiceAccounts
							? tI18n(
									"OrganizationSettingsPage.DisableWorkspaceSharingDialog.restrict_sharing_aacb9d73",
								)
							: tI18n(
									"OrganizationSettingsPage.DisableWorkspaceSharingDialog.disable_sharing_7b1511aa",
								)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
