import { BanIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProvisionerJob } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { CancelJobConfirmationDialog } from "./CancelJobConfirmationDialog";

const CANCELLABLE = ["pending", "running"];

type CancelJobButtonProps = {
	job: ProvisionerJob;
};

export const CancelJobButton: FC<CancelJobButtonProps> = ({ job }) => {
	const { t: tI18n } = useTranslation("administration");

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const isCancellable = CANCELLABLE.includes(job.status);

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						disabled={!isCancellable}
						aria-label={tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobButton.cancel_job_a5032d26",
						)}
						size="icon"
						variant="outline"
						onClick={() => {
							setIsDialogOpen(true);
						}}
					>
						<BanIcon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerJobsPage.CancelJobButton.cancel_job_a5032d26",
					)}
				</TooltipContent>
			</Tooltip>
			<CancelJobConfirmationDialog
				open={isDialogOpen}
				job={job}
				onClose={() => {
					setIsDialogOpen(false);
				}}
			/>
		</>
	);
};
