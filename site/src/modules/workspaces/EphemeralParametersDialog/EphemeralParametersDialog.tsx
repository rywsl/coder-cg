import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { TemplateVersionParameter } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";

interface EphemeralParametersDialogProps {
	open: boolean;
	onClose: () => void;
	onContinue: () => void;
	ephemeralParameters: TemplateVersionParameter[];
	workspaceOwner: string;
	workspaceName: string;
	templateVersionId: string;
}

export const EphemeralParametersDialog: FC<EphemeralParametersDialogProps> = ({
	open,
	onClose,
	onContinue,
	ephemeralParameters,
	workspaceOwner,
	workspaceName,
	templateVersionId,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const navigate = useNavigate();

	const handleGoToParameters = () => {
		onClose();
		navigate(
			`/@${workspaceOwner}/${workspaceName}/settings/parameters?templateVersionId=${templateVersionId}`,
		);
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{tI18n(
							"workspaces.EphemeralParametersDialog.EphemeralParametersDialog.ephemeral_parameters_detected_b2f94cbb",
						)}
					</DialogTitle>
					<DialogDescription>
						{tI18n(
							"workspaces.EphemeralParametersDialog.EphemeralParametersDialog.this_workspace_template_has_2dc1735e",
						)}{" "}
						<strong className="text-content-primary">
							{ephemeralParameters.length}
						</strong>{" "}
						{tI18n(
							"workspaces.EphemeralParametersDialog.EphemeralParametersDialog.ephemeral_parameters_that_will_be_reset_to_their_b25fa9a2",
						)}
					</DialogDescription>
					<DialogDescription>
						<ul className="list-none pl-6 space-y-2">
							{ephemeralParameters.map((param) => (
								<li key={param.name}>
									<p className="text-content-primary m-0 font-bold">
										{param.display_name || param.name}
									</p>
									{param.description && (
										<p className="m-0 text-sm text-content-secondary">
											{param.description}
										</p>
									)}
								</li>
							))}
						</ul>
					</DialogDescription>
					<DialogDescription>
						{tI18n(
							"workspaces.EphemeralParametersDialog.EphemeralParametersDialog.would_you_like_to_go_to_the_workspace_parameters_eafe61e8",
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={onContinue} variant="outline">
						{tI18n(
							"workspaces.EphemeralParametersDialog.EphemeralParametersDialog.continue_31fbef16",
						)}
					</Button>
					<Button
						data-testid="workspace-parameters"
						onClick={handleGoToParameters}
					>
						{tI18n(
							"workspaces.EphemeralParametersDialog.EphemeralParametersDialog.go_to_workspace_parameters_1986a430",
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
