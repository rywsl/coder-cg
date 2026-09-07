import type { ProvisionerJob } from "#/api/typesGenerated";
import { i18n } from "#/i18n";

export const getPendingStatusLabel = (
	provisionerJob?: ProvisionerJob,
): string => {
	if (!provisionerJob || provisionerJob.queue_size === 0) {
		return i18n.t("pages:provisionerJob.pending_331551b0");
	}
	return i18n.t("pages:provisionerJob.position_in_queue_value0_485aefa1", {
		value0: provisionerJob.queue_position,
	});
};
