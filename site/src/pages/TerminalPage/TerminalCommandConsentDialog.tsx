import { TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";

interface TerminalCommandConsentDialogProps {
	open: boolean;
	command: string;
	onConfirm: () => void;
	onDeny: () => void;
}

export const TerminalCommandConsentDialog: FC<
	TerminalCommandConsentDialogProps
> = ({ open, command, onConfirm, onDeny }) => {
	const { t: tI18n } = useTranslation("pages");

	return (
		<Dialog open={open}>
			<DialogContent
				onPointerDownOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				className="max-w-2xl overflow-hidden min-w-0"
			>
				<DialogHeader>
					<DialogTitle>
						<TriangleAlertIcon className="size-icon-lg text-content-warning inline-block align-text-bottom mr-2" />
						{tI18n(
							"TerminalPage.TerminalCommandConsentDialog.warning_terminal_command_execution_170dedcb",
						)}
					</DialogTitle>
					<DialogDescription>
						{tI18n(
							"TerminalPage.TerminalCommandConsentDialog.a_link_is_requesting_to_run_a_command_in_your_te_8dd66329",
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex min-w-0 flex-col gap-2">
					<span className="text-sm font-semibold text-content-primary">
						{tI18n(
							"TerminalPage.TerminalCommandConsentDialog.command_a7a9c915",
						)}
					</span>
					<code className="block whitespace-pre overflow-x-auto">
						{command}
					</code>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onDeny}>
						{tI18n("TerminalPage.TerminalCommandConsentDialog.cancel_19766ed6")}
					</Button>
					<Button variant="default" onClick={onConfirm}>
						{tI18n(
							"TerminalPage.TerminalCommandConsentDialog.run_command_87e30f34",
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
