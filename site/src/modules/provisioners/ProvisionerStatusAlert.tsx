import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { AlertColor } from "#/components/Alert/Alert";
import { AlertVariant, ProvisionerAlert } from "./ProvisionerAlert";

interface ProvisionerStatusAlertProps {
	matchingProvisioners: number | undefined;
	availableProvisioners: number | undefined;
	tags: Record<string, string>;
	variant?: AlertVariant;
}

export const ProvisionerStatusAlert: FC<ProvisionerStatusAlertProps> = ({
	matchingProvisioners,
	availableProvisioners,
	tags,
	variant = AlertVariant.Standalone,
}) => {
	const { t: tI18n } = useTranslation("administration");

	let title: string;
	let detail: string;
	let severity: AlertColor;
	switch (true) {
		case matchingProvisioners === 0:
			title = tI18n(
				"provisioners.ProvisionerStatusAlert.build_pending_provisioner_deployment_fb9554ac",
			);
			detail =
				"Your build has been enqueued, but there are no provisioners that accept the required tags. Once a compatible provisioner becomes available, your build will continue. Please contact your administrator.";
			severity = "warning";
			break;
		case availableProvisioners === 0:
			title = tI18n(
				"provisioners.ProvisionerStatusAlert.build_delayed_ab028515",
			);
			detail =
				"Provisioners that accept the required tags have not responded for longer than expected. This may delay your build. Please contact your administrator if your build does not complete.";
			severity = "warning";
			break;
		default:
			title = tI18n(
				"provisioners.ProvisionerStatusAlert.build_enqueued_de4ebbde",
			);
			detail =
				"Your build has been enqueued and will begin once a provisioner becomes available to process it.";
			severity = "info";
	}

	return (
		<ProvisionerAlert
			title={title}
			detail={detail}
			severity={severity}
			tags={tags}
			variant={variant}
		/>
	);
};
