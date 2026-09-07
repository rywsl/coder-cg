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
import type { AutofillBuildParameter } from "#/utils/richParameters";

interface AutoCreateConsentDialogProps {
	open: boolean;
	autofillParameters: AutofillBuildParameter[];
	presetName?: string;
	onConfirm: () => void;
	onDeny: () => void;
}

export const AutoCreateConsentDialog: FC<AutoCreateConsentDialogProps> = ({
	open,
	autofillParameters,
	presetName,
	onConfirm,
	onDeny,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

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
							"CreateWorkspacePage.AutoCreateConsentDialog.warning_automatic_workspace_creation_d5419492",
						)}
					</DialogTitle>
					<DialogDescription>
						{tI18n(
							"CreateWorkspacePage.AutoCreateConsentDialog.a_link_is_attempting_to_automatically_create_a_w_39ce95ea",
						)}
					</DialogDescription>
				</DialogHeader>

				{presetName && (
					<div className="flex min-w-0 flex-col gap-2">
						<span className="text-sm font-semibold text-content-primary">
							{tI18n(
								"CreateWorkspacePage.AutoCreateConsentDialog.preset_4336d942",
							)}
						</span>
						<code className="block whitespace-pre overflow-x-auto">
							{presetName}
						</code>
					</div>
				)}

				{autofillParameters.length > 0 && (
					<div className="flex min-w-0 flex-col gap-2">
						<span className="text-sm font-semibold text-content-primary">
							{tI18n(
								"CreateWorkspacePage.AutoCreateConsentDialog.parameters_03acaf78",
							)}
						</span>
						<code className="block whitespace-pre overflow-x-auto">
							{autofillParameters
								.map((p) => `${p.name}: ${p.value}`)
								.join("\n")}
						</code>
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={onDeny}>
						{tI18n(
							"CreateWorkspacePage.AutoCreateConsentDialog.cancel_19766ed6",
						)}
					</Button>
					<Button variant="default" onClick={onConfirm}>
						{tI18n(
							"CreateWorkspacePage.AutoCreateConsentDialog.confirm_and_create_37502394",
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
