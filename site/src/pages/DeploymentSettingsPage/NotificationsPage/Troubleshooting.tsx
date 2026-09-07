import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import { Button } from "#/components/Button/Button";
import { Spinner } from "#/components/Spinner/Spinner";

type TroubleshootingProps = {
	canEdit?: boolean;
};

export const Troubleshooting: FC<TroubleshootingProps> = ({
	canEdit = true,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const { mutate: sendTestNotificationApi, isPending } = useMutation({
		mutationFn: API.postTestNotification,
		onSuccess: () =>
			toast.success(
				tI18n(
					"DeploymentSettingsPage.NotificationsPage.Troubleshooting.test_notification_sent_4aee53af",
				),
			),
		onError: (error) =>
			toast.error(
				tI18n(
					"DeploymentSettingsPage.NotificationsPage.Troubleshooting.failed_to_send_test_notification_7f8adf84",
				),
				{
					description: getErrorDetail(error),
				},
			),
	});

	return (
		<>
			<div className="text-sm text-content-secondary leading-relaxed mb-4">
				{tI18n(
					"DeploymentSettingsPage.NotificationsPage.Troubleshooting.send_a_test_notification_to_troubleshoot_your_no_f181df4c",
				)}
			</div>
			<div>
				<span>
					<Button
						variant="outline"
						size="sm"
						disabled={isPending || !canEdit}
						onClick={() => {
							sendTestNotificationApi();
						}}
					>
						<Spinner loading={isPending} />
						{tI18n(
							"DeploymentSettingsPage.NotificationsPage.Troubleshooting.send_notification_02f68b63",
						)}
					</Button>
				</span>
			</div>
		</>
	);
};
