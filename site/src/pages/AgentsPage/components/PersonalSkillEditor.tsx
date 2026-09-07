import { cn } from "cn";
import { type FormikErrors, useFormik } from "formik";
import {
	type ChangeEvent,
	type ClipboardEvent,
	type FC,
	useId,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
import * as Yup from "yup";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { Button } from "#/components/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import { Spinner } from "#/components/Spinner/Spinner";
import { formatKiB } from "#/utils/fileSize";
import {
	buildPersonalSkillMarkdown,
	getPersonalSkillContentSizeBytes,
	isValidPersonalSkillDescription,
	isValidPersonalSkillName,
	PERSONAL_SKILL_MAX_SIZE_BYTES,
	type PersonalSkillFormValues,
	tryParsePersonalSkillMarkdown,
} from "../utils/personalSkills";

export type PersonalSkillErrorDisplay = {
	message: string;
	detail?: string;
};

interface PersonalSkillEditorProps {
	open: boolean;
	mode: "create" | "edit";
	initialValues: PersonalSkillFormValues;
	existingNames: readonly string[];
	submitError?: PersonalSkillErrorDisplay;
	isSubmitting: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: PersonalSkillFormValues, content: string) => void;
}

type ImportStatus = {
	kind: "success" | "error";
	title: string;
	detail?: string;
};

const beginsWithFrontmatterDelimiter = (content: string): boolean =>
	content
		.replace(/^\uFEFF/, "")
		.split(/\r?\n/, 1)[0]
		?.trim() === "---";

export const PersonalSkillEditor: FC<PersonalSkillEditorProps> = ({
	open,
	mode,
	initialValues,
	existingNames,
	submitError,
	isSubmitting,
	onOpenChange,
	onSubmit,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const isCreate = mode === "create";
	const importId = useId();
	const nameId = useId();
	const nameErrorId = useId();
	const descriptionId = useId();
	const descriptionErrorId = useId();
	const bodyId = useId();
	const bodyErrorId = useId();
	const validationSchema = Yup.object({
		name: Yup.string()
			.trim()
			.required(
				tI18n(
					"AgentsPage.components.PersonalSkillEditor.name_is_required_f83a4bc1",
				),
			)
			.test(
				"skill-name",
				tI18n(
					"AgentsPage.components.PersonalSkillEditor.use_kebab_case_with_lowercase_letters_numbers_an_3bab4f5f",
				),
				(value) => Boolean(value && isValidPersonalSkillName(value.trim())),
			)
			.test(
				"unique-name",
				tI18n(
					"AgentsPage.components.PersonalSkillEditor.a_skill_with_this_name_already_exists_07a65473",
				),
				(value) =>
					!isCreate ||
					!existingNames.includes(
						value?.trim().toLocaleLowerCase("en-US") ?? "",
					),
			),
		description: Yup.string().test(
			"description-size",
			tI18n(
				"AgentsPage.components.PersonalSkillEditor.description_must_be_4096_bytes_or_smaller_4c55bfc7",
			),
			(value) => isValidPersonalSkillDescription(value ?? ""),
		),
		body: Yup.string().test(
			"body-required",
			tI18n(
				"AgentsPage.components.PersonalSkillEditor.body_is_required_52e74135",
			),
			(value) => Boolean(value?.trim()),
		),
	});

	const validate = (
		values: PersonalSkillFormValues,
	): FormikErrors<PersonalSkillFormValues> => {
		if (
			getPersonalSkillContentSizeBytes(buildPersonalSkillMarkdown(values)) <=
			PERSONAL_SKILL_MAX_SIZE_BYTES
		) {
			return {};
		}
		return {
			body: `Skill content must be ${formatKiB(PERSONAL_SKILL_MAX_SIZE_BYTES)} or smaller.`,
		};
	};

	const form = useFormik<PersonalSkillFormValues>({
		initialValues,
		enableReinitialize: true,
		validationSchema,
		validate,
		onSubmit: (values) => {
			const normalizedValues = {
				name: values.name.trim(),
				description: values.description.trim(),
				body: values.body.trim(),
			};
			onSubmit(normalizedValues, buildPersonalSkillMarkdown(normalizedValues));
		},
	});

	const [importContent, setImportContent] = useState("");
	const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

	const importSkillMarkdown = async (contentToImport: string) => {
		if (!contentToImport.trim()) {
			return;
		}

		const result = tryParsePersonalSkillMarkdown(contentToImport);
		if (!result.ok) {
			setImportStatus({
				kind: "error",
				title: tI18n(
					"AgentsPage.components.PersonalSkillEditor.could_not_parse_skill_md_4a63765c",
				),
				detail: result.error,
			});
			return;
		}

		if (isCreate) {
			await form.setValues(result.values);
			await form.setTouched(
				{ name: true, description: true, body: true },
				false,
			);
		} else {
			await form.setValues({
				...form.values,
				description: result.values.description,
				body: result.values.body,
			});
			await form.setTouched(
				{ name: false, description: true, body: true },
				false,
			);
		}

		setImportContent("");
		setImportStatus({
			kind: "success",
			title: tI18n(
				"AgentsPage.components.PersonalSkillEditor.imported_skill_md_7111bd76",
			),
			detail: isCreate
				? tI18n(
						"AgentsPage.components.PersonalSkillEditor.updated_name_description_and_body_fields_049c6f9c",
					)
				: tI18n(
						"AgentsPage.components.PersonalSkillEditor.updated_description_and_body_fields_kept_the_exi_af7ace05",
					),
		});
	};

	const handleImportContentChange = (
		event: ChangeEvent<HTMLTextAreaElement>,
	) => {
		setImportContent(event.target.value);
		setImportStatus(null);
	};

	const handleImportContentPaste = (
		event: ClipboardEvent<HTMLTextAreaElement>,
	) => {
		const pastedContent = event.clipboardData.getData("text");
		if (!beginsWithFrontmatterDelimiter(pastedContent)) {
			return;
		}

		event.preventDefault();
		setImportContent(pastedContent);
		setImportStatus(null);
		void importSkillMarkdown(pastedContent);
	};

	const content = buildPersonalSkillMarkdown(form.values);
	const sizeBytes = getPersonalSkillContentSizeBytes(content);
	const nameError = form.touched.name ? form.errors.name : undefined;
	const descriptionError = form.touched.description
		? form.errors.description
		: undefined;
	const bodyError = form.touched.body ? form.errors.body : undefined;
	const isTooLarge = sizeBytes > PERSONAL_SKILL_MAX_SIZE_BYTES;
	const isNearLimit = sizeBytes > PERSONAL_SKILL_MAX_SIZE_BYTES * 0.9;
	const title = isCreate
		? tI18n(
				"AgentsPage.components.PersonalSkillEditor.create_personal_skill_902a04c4",
			)
		: tI18n(
				"AgentsPage.components.PersonalSkillEditor.edit_personal_skill_58dff266",
			);
	const submitLabel = isCreate
		? tI18n("AgentsPage.components.PersonalSkillEditor.create_skill_1a903008")
		: tI18n("AgentsPage.components.PersonalSkillEditor.save_skill_1d92b781");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
				<form
					className="flex min-h-0 flex-1 flex-col"
					onSubmit={form.handleSubmit}
				>
					<DialogHeader className="px-6 pt-6">
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>
							{tI18n(
								"AgentsPage.components.PersonalSkillEditor.personal_skills_are_available_to_your_agents_and_e12442f9",
							)}
						</DialogDescription>
					</DialogHeader>

					<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
						{submitError && (
							<Alert severity="error">
								<AlertTitle>{submitError.message}</AlertTitle>
								{submitError.detail && (
									<AlertDescription>{submitError.detail}</AlertDescription>
								)}
							</Alert>
						)}

						<div className="flex flex-col gap-3 rounded-md border border-border-default p-4">
							<div className="flex flex-col gap-1">
								<Label htmlFor={importId}>
									{tI18n(
										"AgentsPage.components.PersonalSkillEditor.import_from_skill_md_6b35dda0",
									)}
								</Label>
								<p className="m-0 text-xs text-content-secondary">
									{tI18n(
										"AgentsPage.components.PersonalSkillEditor.paste_a_full_skill_md_file_with_frontmatter_to_a_553bf72d",
									)}
								</p>
							</div>
							<TextareaAutosize
								id={importId}
								value={importContent}
								onChange={handleImportContentChange}
								onPaste={handleImportContentPaste}
								placeholder={tI18n(
									"AgentsPage.components.PersonalSkillEditor.nname_my_skill_ndescription_n_n_nbody_6847cff4",
								)}
								disabled={isSubmitting}
								minRows={4}
								maxRows={10}
								className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed text-content-primary placeholder:text-content-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-content-link disabled:cursor-not-allowed disabled:opacity-50"
							/>
							{importStatus && (
								<Alert severity={importStatus.kind}>
									<AlertTitle>{importStatus.title}</AlertTitle>
									{importStatus.detail && (
										<AlertDescription>{importStatus.detail}</AlertDescription>
									)}
								</Alert>
							)}
							<div className="flex justify-end gap-2">
								{importContent && (
									<Button
										variant="outline"
										size="sm"
										disabled={isSubmitting}
										onClick={() => {
											setImportContent("");
											setImportStatus(null);
										}}
									>
										{tI18n(
											"AgentsPage.components.PersonalSkillEditor.clear_83b12c22",
										)}
									</Button>
								)}
								<Button
									size="sm"
									disabled={isSubmitting || !importContent.trim()}
									onClick={() => {
										void importSkillMarkdown(importContent);
									}}
								>
									{tI18n(
										"AgentsPage.components.PersonalSkillEditor.import_2cff9baa",
									)}
								</Button>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={nameId}>
								{tI18n(
									"AgentsPage.components.PersonalSkillEditor.name_dcd1d522",
								)}
							</Label>
							<Input
								id={nameId}
								name="name"
								value={form.values.name}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								placeholder={tI18n(
									"AgentsPage.components.PersonalSkillEditor.review_database_query_ca1dca2d",
								)}
								readOnly={!isCreate}
								disabled={isSubmitting}
								aria-invalid={Boolean(nameError)}
								aria-describedby={nameError ? nameErrorId : undefined}
								className={cn(!isCreate && "bg-surface-secondary")}
							/>
							{nameError ? (
								<p
									id={nameErrorId}
									className="m-0 text-xs text-content-destructive"
								>
									{nameError}
								</p>
							) : (
								<p className="m-0 text-xs text-content-secondary">
									{tI18n(
										"AgentsPage.components.PersonalSkillEditor.use_lowercase_letters_numbers_and_hyphens_names__e39db7bf",
									)}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={descriptionId}>
								{tI18n(
									"AgentsPage.components.PersonalSkillEditor.description_526e0087",
								)}
							</Label>
							<Input
								id={descriptionId}
								name="description"
								value={form.values.description}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								placeholder={tI18n(
									"AgentsPage.components.PersonalSkillEditor.when_to_use_this_skill_0fc9782b",
								)}
								disabled={isSubmitting}
								aria-invalid={Boolean(descriptionError)}
								aria-describedby={
									descriptionError ? descriptionErrorId : undefined
								}
							/>
							{descriptionError && (
								<p
									id={descriptionErrorId}
									className="m-0 text-xs text-content-destructive"
								>
									{descriptionError}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={bodyId}>
								{tI18n(
									"AgentsPage.components.PersonalSkillEditor.body_6ccaa641",
								)}
							</Label>
							<TextareaAutosize
								id={bodyId}
								name="body"
								value={form.values.body}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								placeholder={tI18n(
									"AgentsPage.components.PersonalSkillEditor.describe_when_and_how_agents_should_use_this_ski_b7739860",
								)}
								disabled={isSubmitting}
								minRows={8}
								aria-invalid={Boolean(bodyError)}
								aria-describedby={bodyError ? bodyErrorId : undefined}
								className={cn(
									"w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed text-content-primary placeholder:text-content-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-content-link disabled:cursor-not-allowed disabled:opacity-50",
									bodyError && "border-border-destructive",
								)}
							/>
							{bodyError && (
								<p
									id={bodyErrorId}
									className="m-0 text-xs text-content-destructive"
								>
									{bodyError}
								</p>
							)}
							<p
								className={cn(
									"m-0 text-xs text-content-secondary",
									isNearLimit && "text-content-warning",
									isTooLarge && "text-content-destructive",
								)}
							>
								{formatKiB(sizeBytes)}
								{tI18n("AgentsPage.components.PersonalSkillEditor.of_88eb5a7e")}{" "}
								{formatKiB(PERSONAL_SKILL_MAX_SIZE_BYTES)}
								{tI18n(
									"AgentsPage.components.PersonalSkillEditor.used_a47509e9",
								)}
							</p>
						</div>
					</div>

					<DialogFooter className="border-t border-border-default px-6 py-4">
						<Button
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onOpenChange(false)}
						>
							{tI18n(
								"AgentsPage.components.PersonalSkillEditor.cancel_19766ed6",
							)}
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !form.isValid || !form.dirty}
						>
							{isSubmitting && <Spinner className="size-4" loading />}
							{submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
