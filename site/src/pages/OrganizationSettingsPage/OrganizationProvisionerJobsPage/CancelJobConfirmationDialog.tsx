import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import {
	getProvisionerDaemonsKey,
	provisionerJobsQueryKey,
} from "#/api/queries/organizations";
import type { ProvisionerJob } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";

type CancelJobConfirmationDialogProps = {
	open: boolean;
	onClose: () => void;
	job: ProvisionerJob;
	cancelProvisionerJob?: typeof API.cancelProvisionerJob;
};

export const CancelJobConfirmationDialog: FC<
	CancelJobConfirmationDialogProps
> = ({
	job,
	cancelProvisionerJob = API.cancelProvisionerJob,
	...dialogProps
}) => {
	const { t: tI18n } = useTranslation("administration");

	const queryClient = useQueryClient();
	const cancelMutation = useMutation({
		mutationFn: cancelProvisionerJob,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: provisionerJobsQueryKey(job.organization_id),
			});
			queryClient.invalidateQueries({
				queryKey: getProvisionerDaemonsKey(job.organization_id, job.tags),
			});
		},
	});

	return (
		<ConfirmDialog
			{...dialogProps}
			type="delete"
			title={tI18n(
				"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.cancel_provisioner_job_be5194f2",
			)}
			description={tI18n(
				"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.are_you_sure_you_want_to_cancel_the_provisioner__e392543a",
				{
					value0: job.id,
				},
			)}
			confirmText={tI18n(
				"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.confirm_eebdd24a",
			)}
			cancelText={tI18n(
				"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.cancel_19766ed6",
			)}
			confirmLoading={cancelMutation.isPending}
			onConfirm={async () => {
				const mutation = cancelMutation.mutateAsync(job, {
					onSuccess: () => {
						dialogProps.onClose();
					},
				});
				toast.promise(mutation, {
					loading: tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.canceling_provisioner_job_value0_5f10845b",
						{
							value0: job.id,
						},
					),
					success: tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.provisioner_job_value0_canceled_successfully_b666a3a3",
						{
							value0: job.id,
						},
					),
					error: (error) => ({
						message: tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobConfirmationDialog.failed_to_cancel_provisioner_job_value0_d992c399",
							{
								value0: job.id,
							},
						),
						description: getErrorDetail(error),
					}),
				});
			}}
		/>
	);
};
