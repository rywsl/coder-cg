import { EllipsisVerticalIcon } from "lucide-react";
import { type FC, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";

type AgentDevcontainerMoreActionsProps = {
	deleteDevContainer: () => void;
};

export const AgentDevcontainerMoreActions: FC<
	AgentDevcontainerMoreActionsProps
> = ({ deleteDevContainer }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [open, setOpen] = useState(false);
	const menuContentId = useId();

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button size="icon-lg" variant="subtle" aria-controls={menuContentId}>
					<EllipsisVerticalIcon aria-hidden="true" />
					<span className="sr-only">
						{tI18n(
							"resources.AgentDevcontainerMoreActions.dev_container_actions_81b88653",
						)}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent id={menuContentId} align="end">
				<DropdownMenuItem
					className="text-content-destructive focus:text-content-destructive"
					onClick={() => {
						setIsConfirmingDelete(true);
					}}
				>
					{tI18n("resources.AgentDevcontainerMoreActions.delete_9ce78fe3")}
				</DropdownMenuItem>
			</DropdownMenuContent>
			<DevcontainerDeleteDialog
				isOpen={isConfirmingDelete}
				onCancel={() => setIsConfirmingDelete(false)}
				onConfirm={() => {
					deleteDevContainer();
					setIsConfirmingDelete(false);
				}}
			/>
		</DropdownMenu>
	);
};

type DevcontainerDeleteDialogProps = {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

const DevcontainerDeleteDialog: FC<DevcontainerDeleteDialogProps> = ({
	isOpen,
	onCancel,
	onConfirm,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<ConfirmDialog
			type="delete"
			open={isOpen}
			title={tI18n(
				"resources.AgentDevcontainerMoreActions.delete_dev_container_42dd659f",
			)}
			onConfirm={onConfirm}
			onClose={onCancel}
			description={
				<p>
					{tI18n(
						"resources.AgentDevcontainerMoreActions.are_you_sure_you_want_to_delete_this_dev_contain_69cea10a",
					)}
				</p>
			}
		/>
	);
};
