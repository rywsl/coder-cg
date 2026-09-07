import { TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ProvisionerJobStatus } from "#/api/typesGenerated";
import {
	StatusIndicator,
	StatusIndicatorDot,
	type StatusIndicatorProps,
} from "#/components/StatusIndicator/StatusIndicator";

const variantByStatus: Record<
	ProvisionerJobStatus,
	StatusIndicatorProps["variant"]
> = {
	succeeded: "success",
	failed: "failed",
	pending: "pending",
	running: "pending",
	canceling: "pending",
	canceled: "inactive",
	unknown: "inactive",
};

type JobStatusIndicatorProps = {
	status: ProvisionerJobStatus;
	queue?: { size: number; position: number };
};

export const JobStatusIndicator: FC<JobStatusIndicatorProps> = ({
	status,
	queue,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<StatusIndicator size="sm" variant={variantByStatus[status]}>
			<StatusIndicatorDot />
			<span className="[&:first-letter]:uppercase">{status}</span>
			{status === "failed" && (
				<TriangleAlertIcon className="size-icon-xs p-px" />
			)}
			{status === "pending" &&
				queue &&
				tI18n("provisioners.JobStatusIndicator.value0_value1_b67f0786", {
					value0: queue.position,
					value1: queue.size,
				})}
		</StatusIndicator>
	);
};
