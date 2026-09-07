import type { FC, FormEventHandler, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { Spinner } from "#/components/Spinner/Spinner";
import { TemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";

interface AgentSettingLayoutProps {
	title: string;
	description?: ReactNode;
	children?: ReactNode;
	error?: ReactNode;
	showSave: boolean;
	isSaving: boolean;
	isSavedVisible: boolean;
	saveDisabled: boolean;
	onSubmit: FormEventHandler<HTMLFormElement>;
}

export const AgentSettingLayout: FC<AgentSettingLayoutProps> = ({
	title,
	description,
	children,
	error,
	showSave,
	isSaving,
	isSavedVisible,
	saveDisabled,
	onSubmit,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const shouldShowControls =
		Boolean(children) || showSave || isSavedVisible || isSaving;

	return (
		<form
			aria-label={title}
			className="flex flex-col"
			onSubmit={onSubmit}
			noValidate
		>
			<div className="min-w-0">
				<h3 className="m-0 text-sm font-normal leading-6 text-content-primary">
					{title}
				</h3>
				{description && (
					<p className="mt-1 mb-0 text-sm font-normal leading-6 text-content-secondary">
						{description}
					</p>
				)}
			</div>
			{shouldShowControls && (
				<div className="mt-4 flex flex-wrap items-start gap-3">
					{children}
					<div className="flex min-h-10 items-center">
						{(showSave || isSavedVisible || isSaving) &&
							(isSavedVisible ? (
								<TemporarySavedState />
							) : (
								<Button
									size="lg"
									type="submit"
									disabled={saveDisabled}
									className="h-10 min-w-[88px]"
								>
									{isSaving && <Spinner loading className="size-4" />}
									{tI18n(
										"AISettingsPage.CoderAgentsPage.components.AgentSettingLayout.save_1509f561",
									)}
								</Button>
							))}
					</div>
				</div>
			)}
			{error && <div className="text-xs text-content-destructive">{error}</div>}
		</form>
	);
};
