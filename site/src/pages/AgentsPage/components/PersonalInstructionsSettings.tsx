import { cn } from "cn";
import { useFormik } from "formik";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	TemporarySavedState,
	useTemporarySavedState,
} from "#/components/TemporarySavedState/TemporarySavedState";
import { countInvisibleCharacters } from "#/utils/invisibleUnicode";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface PersonalInstructionsSettingsProps {
	userPromptData: TypesGen.UserChatCustomPrompt | undefined;
	onSaveUserPrompt: (
		req: TypesGen.UserChatCustomPrompt,
		options?: MutationCallbacks,
	) => void;
	isSavingUserPrompt: boolean;
	isSaveUserPromptError: boolean;
	isAnyPromptSaving: boolean;
}

export const PersonalInstructionsSettings: FC<
	PersonalInstructionsSettingsProps
> = ({
	userPromptData,
	onSaveUserPrompt,
	isSavingUserPrompt,
	isSaveUserPromptError,
	isAnyPromptSaving,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const [isUserPromptOverflowing, setIsUserPromptOverflowing] = useState(false);
	const { isSavedVisible, showSavedState } = useTemporarySavedState();

	const form = useFormik({
		initialValues: {
			custom_prompt: userPromptData?.custom_prompt ?? "",
		},
		enableReinitialize: true,
		onSubmit: (values, helpers) => {
			onSaveUserPrompt(
				{ custom_prompt: values.custom_prompt },
				{
					onSuccess: () => {
						showSavedState();
						helpers.resetForm();
					},
				},
			);
		},
	});

	const userInvisibleCharCount = countInvisibleCharacters(
		form.values.custom_prompt,
	);

	return (
		<form className="flex flex-col gap-2" onSubmit={form.handleSubmit}>
			<h3 className="m-0 text-sm font-semibold text-content-primary">
				{tI18n(
					"AgentsPage.components.PersonalInstructionsSettings.personal_instructions_5061e60c",
				)}
			</h3>
			<p className="m-0 text-xs text-content-secondary">
				{tI18n(
					"AgentsPage.components.PersonalInstructionsSettings.applied_to_all_your_conversations_only_visible_t_fa0a3077",
				)}
			</p>
			<TextareaAutosize
				className={cn(
					"max-h-[240px] w-full resize-none rounded-lg border border-border bg-surface-primary px-4 py-3 font-sans text-sm leading-relaxed text-content-primary placeholder:text-content-secondary focus:outline-hidden focus:ring-2 focus:ring-content-link",
					isUserPromptOverflowing && "overflow-y-auto scrollbar-thin",
				)}
				name="custom_prompt"
				placeholder={tI18n(
					"AgentsPage.components.PersonalInstructionsSettings.additional_behavior_style_and_tone_preferences_81856d5d",
				)}
				value={form.values.custom_prompt}
				onChange={form.handleChange}
				onHeightChange={(height) => setIsUserPromptOverflowing(height >= 240)}
				disabled={isAnyPromptSaving}
				minRows={1}
			/>
			{userInvisibleCharCount > 0 && (
				<Alert severity="warning">
					<AlertDescription>
						{tI18n(
							"AgentsPage.components.PersonalInstructionsSettings.this_text_contains_51d7632d",
						)}
						{userInvisibleCharCount}
						{tI18n(
							"AgentsPage.components.PersonalInstructionsSettings.invisible_unicode_8dedc14d",
						)}{" "}
						{userInvisibleCharCount !== 1
							? tI18n(
									"AgentsPage.components.PersonalInstructionsSettings.characters_25d939ff",
								)
							: tI18n(
									"AgentsPage.components.PersonalInstructionsSettings.character_4bcef3de",
								)}
						{tI18n(
							"AgentsPage.components.PersonalInstructionsSettings.that_could_hide_content_these_will_be_stripped_o_c3bb6f1f",
						)}
					</AlertDescription>
				</Alert>
			)}
			<div className="mt-2 flex min-h-6 justify-end gap-2">
				{(form.dirty || isSavedVisible || isSavingUserPrompt) &&
					(isSavedVisible ? (
						<TemporarySavedState />
					) : (
						<>
							<Button
								size="xs"
								variant="outline"
								type="button"
								onClick={() => form.setFieldValue("custom_prompt", "")}
								disabled={isAnyPromptSaving || !form.values.custom_prompt}
							>
								{tI18n(
									"AgentsPage.components.PersonalInstructionsSettings.clear_83b12c22",
								)}
							</Button>
							<Button
								size="xs"
								type="submit"
								disabled={isAnyPromptSaving || !form.dirty}
							>
								{isSavingUserPrompt && <Spinner loading className="size-4" />}
								{tI18n(
									"AgentsPage.components.PersonalInstructionsSettings.save_1509f561",
								)}
							</Button>
						</>
					))}
			</div>
			{isSaveUserPromptError && (
				<p className="m-0 text-xs text-content-destructive">
					{tI18n(
						"AgentsPage.components.PersonalInstructionsSettings.failed_to_save_personal_instructions_6e9691a6",
					)}
				</p>
			)}
		</form>
	);
};
