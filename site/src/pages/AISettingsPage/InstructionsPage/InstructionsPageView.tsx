import { useFormik } from "formik";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import { Switch } from "#/components/Switch/Switch";
import { TextPreviewDialog } from "#/pages/AgentsPage/components/TextPreviewDialog";
import { countInvisibleCharacters } from "#/utils/invisibleUnicode";

const TEXTAREA_MAX_ROWS = 9;

export interface InstructionsPageViewProps {
	systemPromptData: TypesGen.ChatSystemPromptResponse | undefined;
	planModeInstructionsData:
		| TypesGen.ChatPlanModeInstructionsResponse
		| undefined;
	onSaveSystemPrompt: (
		req: TypesGen.UpdateChatSystemPromptRequest,
	) => Promise<void> | void;
	onSavePlanModeInstructions: (
		req: TypesGen.UpdateChatPlanModeInstructionsRequest,
	) => Promise<void> | void;
	onResetSystemPromptSave: () => void;
	onResetPlanModeInstructionsSave: () => void;
	isSaving: boolean;
	isSaveSystemPromptError: boolean;
	isSavePlanModeInstructionsError: boolean;
}

export const InstructionsPageView: FC<InstructionsPageViewProps> = ({
	systemPromptData,
	planModeInstructionsData,
	...formProps
}) => {
	const hasLoadedInstructions =
		systemPromptData !== undefined && planModeInstructionsData !== undefined;

	// Without this gate, Formik would initialize from empty query fallbacks and
	// keep those values after query data loads.
	if (!hasLoadedInstructions) {
		return null;
	}

	return (
		<InstructionsForm
			systemPromptData={systemPromptData}
			planModeInstructionsData={planModeInstructionsData}
			{...formProps}
		/>
	);
};

interface InstructionsFormProps {
	systemPromptData: TypesGen.ChatSystemPromptResponse;
	planModeInstructionsData: TypesGen.ChatPlanModeInstructionsResponse;
	onSaveSystemPrompt: (
		req: TypesGen.UpdateChatSystemPromptRequest,
	) => Promise<void> | void;
	onSavePlanModeInstructions: (
		req: TypesGen.UpdateChatPlanModeInstructionsRequest,
	) => Promise<void> | void;
	onResetSystemPromptSave: () => void;
	onResetPlanModeInstructionsSave: () => void;
	isSaving: boolean;
	isSaveSystemPromptError: boolean;
	isSavePlanModeInstructionsError: boolean;
}

const InstructionsForm: FC<InstructionsFormProps> = ({
	systemPromptData,
	planModeInstructionsData,
	onSaveSystemPrompt,
	onSavePlanModeInstructions,
	onResetSystemPromptSave,
	onResetPlanModeInstructionsSave,
	isSaving,
	isSaveSystemPromptError,
	isSavePlanModeInstructionsError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const [showDefaultPromptPreview, setShowDefaultPromptPreview] =
		useState(false);
	const defaultSystemPrompt = systemPromptData.default_system_prompt ?? "";
	const initialValues = {
		system_prompt: systemPromptData.system_prompt ?? "",
		include_default_system_prompt:
			systemPromptData.include_default_system_prompt ?? false,
		plan_mode_instructions:
			planModeInstructionsData.plan_mode_instructions ?? "",
	};

	const form = useFormik({
		initialValues,
		onSubmit: async (values, { resetForm, setValues }) => {
			onResetSystemPromptSave();
			onResetPlanModeInstructionsSave();

			try {
				if (
					values.system_prompt !== initialValues.system_prompt ||
					values.include_default_system_prompt !==
						initialValues.include_default_system_prompt
				) {
					await onSaveSystemPrompt({
						system_prompt: values.system_prompt,
						include_default_system_prompt: values.include_default_system_prompt,
					});
				}

				if (
					values.plan_mode_instructions !== initialValues.plan_mode_instructions
				) {
					await onSavePlanModeInstructions({
						plan_mode_instructions: values.plan_mode_instructions,
					});
				}
			} catch (error) {
				await setValues(values, false);
				throw error;
			}

			toast.success(
				tI18n(
					"AISettingsPage.InstructionsPage.InstructionsPageView.instructions_saved_successfully_7444fe26",
				),
			);
			resetForm({ values });
		},
	});

	const systemInvisibleCharCount = countInvisibleCharacters(
		form.values.system_prompt,
	);
	const planModeInvisibleCharCount = countInvisibleCharacters(
		form.values.plan_mode_instructions,
	);
	const isDisabled = isSaving || form.isSubmitting;

	return (
		<div className="flex max-w-4xl flex-col gap-8">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPageView.instructions_934652dc",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPageView.control_the_system_prompts_and_plan_mode_instruc_ed5f52bd",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<form
				className="flex flex-col rounded-lg border border-solid border-border p-6"
				onSubmit={form.handleSubmit}
			>
				<div className="flex items-center gap-2 font-sans text-sm font-normal leading-6 text-content-primary">
					<Switch
						checked={form.values.include_default_system_prompt}
						onCheckedChange={(checked) =>
							form.setFieldValue("include_default_system_prompt", checked)
						}
						aria-label={tI18n(
							"AISettingsPage.InstructionsPage.InstructionsPageView.include_coder_agents_default_system_prompt_9d178118",
						)}
						disabled={isDisabled}
					/>
					<div className="flex min-w-0 items-center gap-1.5">
						<span>
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.include_coder_agents_default_system_prompt_ee3e4d19",
							)}
						</span>
						<Button
							size="xs"
							variant="subtle"
							type="button"
							onClick={() => setShowDefaultPromptPreview(true)}
							className="min-w-0 px-0 font-sans text-sm font-normal leading-6 text-content-link hover:text-content-link"
						>
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.view_prompt_be8e02ef",
							)}
						</Button>
					</div>
				</div>

				<label
					className="mt-4 mb-2 font-sans text-sm font-bold leading-6 text-content-primary"
					htmlFor="system_prompt"
				>
					{tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPageView.additional_system_instructions_668ccd2b",
					)}
				</label>
				<TextareaAutosize
					className="w-full resize-none overflow-y-auto rounded-lg border border-solid border-border bg-surface-primary px-4 py-3 font-sans text-sm font-normal leading-6 text-content-primary placeholder:text-content-secondary focus:outline-hidden focus:ring-2 focus:ring-content-link/30 scrollbar-thin"
					id="system_prompt"
					placeholder={tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPageView.instructions_appended_to_every_agent_session_6abbecc2",
					)}
					name="system_prompt"
					value={form.values.system_prompt}
					onChange={form.handleChange}
					disabled={isDisabled}
					minRows={1}
					maxRows={TEXTAREA_MAX_ROWS}
				/>
				{systemInvisibleCharCount > 0 && (
					<Alert severity="warning" className="mt-2">
						<AlertDescription>
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.this_text_contains_51d7632d",
							)}
							{systemInvisibleCharCount}
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.invisible_unicode_8dedc14d",
							)}{" "}
							{systemInvisibleCharCount !== 1
								? tI18n(
										"AISettingsPage.InstructionsPage.InstructionsPageView.characters_25d939ff",
									)
								: tI18n(
										"AISettingsPage.InstructionsPage.InstructionsPageView.character_4bcef3de",
									)}
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.that_could_hide_content_these_will_be_stripped_o_c3bb6f1f",
							)}
						</AlertDescription>
					</Alert>
				)}

				<label
					className="mt-8 mb-2 font-sans text-sm font-bold leading-6 text-content-primary"
					htmlFor="plan_mode_instructions"
				>
					{tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPageView.additional_plan_mode_instructions_4cc6ff16",
					)}
				</label>
				<TextareaAutosize
					className="w-full resize-none overflow-y-auto rounded-lg border border-solid border-border bg-surface-primary px-4 py-3 font-sans text-sm font-normal leading-6 text-content-primary placeholder:text-content-secondary focus:outline-hidden focus:ring-2 focus:ring-content-link/30 scrollbar-thin"
					id="plan_mode_instructions"
					placeholder={tI18n(
						"AISettingsPage.InstructionsPage.InstructionsPageView.instructions_applied_when_the_agent_enters_plan__8b256255",
					)}
					name="plan_mode_instructions"
					value={form.values.plan_mode_instructions}
					onChange={form.handleChange}
					disabled={isDisabled}
					minRows={4}
					maxRows={TEXTAREA_MAX_ROWS}
				/>
				{planModeInvisibleCharCount > 0 && (
					<Alert severity="warning" className="mt-2">
						<AlertDescription>
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.this_text_contains_51d7632d",
							)}
							{planModeInvisibleCharCount}
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.invisible_unicode_8dedc14d",
							)}{" "}
							{planModeInvisibleCharCount !== 1
								? tI18n(
										"AISettingsPage.InstructionsPage.InstructionsPageView.characters_25d939ff",
									)
								: tI18n(
										"AISettingsPage.InstructionsPage.InstructionsPageView.character_4bcef3de",
									)}{" "}
							{tI18n(
								"AISettingsPage.InstructionsPage.InstructionsPageView.that_could_hide_content_these_will_be_stripped_o_5ad1a889",
							)}
						</AlertDescription>
					</Alert>
				)}

				{isSaveSystemPromptError && (
					<p className="m-0 mt-4 text-xs text-content-destructive">
						{tI18n(
							"AISettingsPage.InstructionsPage.InstructionsPageView.failed_to_save_system_prompt_2f3234b5",
						)}
					</p>
				)}
				{isSavePlanModeInstructionsError && (
					<p className="m-0 mt-4 text-xs text-content-destructive">
						{tI18n(
							"AISettingsPage.InstructionsPage.InstructionsPageView.failed_to_save_plan_mode_instructions_5542d257",
						)}
					</p>
				)}

				<div className="mt-8 flex justify-end gap-4">
					<Button
						variant="outline"
						type="button"
						onClick={() => {
							// Save failures leave mutation errors outside Formik state, so
							// both stores must reset before the clean form disables actions.
							onResetSystemPromptSave();
							onResetPlanModeInstructionsSave();
							form.resetForm({ values: initialValues });
						}}
						disabled={
							isDisabled ||
							(!form.dirty &&
								!isSaveSystemPromptError &&
								!isSavePlanModeInstructionsError)
						}
					>
						{tI18n(
							"AISettingsPage.InstructionsPage.InstructionsPageView.cancel_19766ed6",
						)}
					</Button>
					<Button type="submit" disabled={isDisabled || !form.dirty}>
						{isSaving && <Spinner loading className="size-4" />}
						{tI18n(
							"AISettingsPage.InstructionsPage.InstructionsPageView.save_1509f561",
						)}
					</Button>
				</div>
			</form>
			{showDefaultPromptPreview && (
				<TextPreviewDialog
					content={defaultSystemPrompt}
					fileName="Default System Prompt"
					onClose={() => setShowDefaultPromptPreview(false)}
				/>
			)}
		</div>
	);
};
