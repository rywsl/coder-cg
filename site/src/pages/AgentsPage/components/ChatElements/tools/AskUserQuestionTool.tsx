import { cn } from "cn";
import {
	LoaderIcon,
	MessageCircleQuestionIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { type FC, type FormEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { Button } from "#/components/Button/Button";
import { Input } from "#/components/Input/Input";
import { RadioGroup, RadioGroupItem } from "#/components/RadioGroup/RadioGroup";
import { i18n } from "#/i18n";
import { ToolCall } from "./ToolCall";
import type { ToolStatus } from "./utils";

export type AskUserQuestion = {
	header: string;
	question: string;
	options: Array<{ label: string; description: string }>;
};

type QuestionAnswer =
	| {
			kind: "option";
			label: string;
			optionIndex: number;
	  }
	| {
			kind: "other";
			text: string;
	  };

type AskUserQuestionToolProps = {
	questions: AskUserQuestion[];
	status: ToolStatus;
	isError: boolean;
	errorMessage?: string;
	isChatCompleted?: boolean;
	isLatestAskUserQuestion?: boolean;
	previousResponseText?: string;
	onSubmitAnswer?: (message: string) => Promise<void> | void;
};

const OTHER_OPTION_VALUE = "other";

const getQuestionHeader = (
	question: AskUserQuestion,
	questionIndex: number,
): string => question.header || `Question ${questionIndex + 1}`;

const getQuestionText = (question: AskUserQuestion): string =>
	question.question || "No question provided.";

const filterQuestionOptions = (question: AskUserQuestion): AskUserQuestion => ({
	...question,
	options: question.options.filter(
		(option) => option.label.trim().toLowerCase() !== "other",
	),
});

const getDefaultAnswer = (
	question: AskUserQuestion,
): QuestionAnswer | undefined => {
	const firstOption = question.options[0];
	if (!firstOption) {
		return undefined;
	}

	return {
		kind: "option",
		label: firstOption.label || "Option 1",
		optionIndex: 0,
	};
};

const formatAnswer = (answer: QuestionAnswer): string =>
	answer.kind === "other"
		? `Other: ${answer.text.trim()}`
		: answer.label || `Option ${answer.optionIndex + 1}`;

const isAnswerValid = (
	answer: QuestionAnswer | undefined,
): answer is QuestionAnswer => {
	if (!answer) {
		return false;
	}

	if (answer.kind === "other") {
		return answer.text.trim().length > 0;
	}

	return answer.label.trim().length > 0;
};

const getSelectedValue = (
	answer: QuestionAnswer | undefined,
): string | undefined => {
	if (!answer) {
		return undefined;
	}

	if (answer.kind === "other") {
		return OTHER_OPTION_VALUE;
	}

	return `option-${answer.optionIndex}`;
};

const formatOutgoingMessage = (
	questions: AskUserQuestion[],
	answers: readonly QuestionAnswer[],
): string => {
	if (questions.length === 1) {
		return formatAnswer(answers[0]);
	}

	return questions
		.map((question, questionIndex) => {
			return `${questionIndex + 1}. ${getQuestionHeader(question, questionIndex)}: ${formatAnswer(answers[questionIndex])}`;
		})
		.join("\n");
};

const getSubmissionErrorMessage = (error: unknown): string | undefined => {
	if (!error) {
		return undefined;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return i18n.t(
		"agents:AgentsPage.components.ChatElements.tools.AskUserQuestionTool.failed_to_submit_your_answer_cc17faaf",
	);
};

type SelectableAnswerOptionProps = {
	id: string;
	value: string;
	label: string;
	description: string;
	isInteractive: boolean;
	isSubmitting: boolean;
};

const SelectableAnswerOption: FC<SelectableAnswerOptionProps> = ({
	id,
	value,
	label,
	description,
	isInteractive,
	isSubmitting,
}) => {
	const isEnabled = isInteractive && !isSubmitting;

	return (
		<label
			htmlFor={id}
			className={cn(
				"grid gap-x-3 gap-y-0.5 py-1.5",
				isEnabled ? "cursor-pointer" : "cursor-default",
			)}
			style={{ gridTemplateColumns: "auto 1fr" }}
		>
			<RadioGroupItem
				className="self-center"
				disabled={!isEnabled}
				id={id}
				value={value}
			/>
			<span className="text-[13px] font-medium text-content-primary">
				{label}
			</span>
			<p className="col-start-2 m-0 whitespace-pre-wrap text-[13px] text-content-secondary">
				{description}
			</p>
		</label>
	);
};

type QuestionOptionProps = {
	questionIdBase: string;
	option: AskUserQuestion["options"][number];
	optionIndex: number;
	isInteractive: boolean;
	isSubmitting: boolean;
};

const QuestionOption: FC<QuestionOptionProps> = ({
	questionIdBase,
	option,
	optionIndex,
	isInteractive,
	isSubmitting,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<SelectableAnswerOption
			id={`${questionIdBase}-option-${optionIndex}`}
			value={`option-${optionIndex}`}
			label={
				option.label ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.option_value0_c333077e",
					{
						value0: optionIndex + 1,
					},
				)
			}
			description={
				option.description ||
				tI18n(
					"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.no_description_provided_2527a18a",
				)
			}
			isInteractive={isInteractive}
			isSubmitting={isSubmitting}
		/>
	);
};

type OtherQuestionOptionProps = {
	questionHeader: string;
	questionIdBase: string;
	optionIndex: number;
	answer: QuestionAnswer | undefined;
	isInteractive: boolean;
	isSubmitting: boolean;
	onTextChange: (text: string) => void;
};

const OtherQuestionOption: FC<OtherQuestionOptionProps> = ({
	questionHeader,
	questionIdBase,
	optionIndex,
	answer,
	isInteractive,
	isSubmitting,
	onTextChange,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const isOtherSelected = answer?.kind === "other";

	return (
		<div className="space-y-2">
			<SelectableAnswerOption
				id={`${questionIdBase}-option-${optionIndex}`}
				value={OTHER_OPTION_VALUE}
				label={tI18n(
					"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.other_f97e9da0",
				)}
				description={tI18n(
					"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.share_a_different_answer_7272d5b8",
				)}
				isInteractive={isInteractive}
				isSubmitting={isSubmitting}
			/>
			{isOtherSelected && (
				<div className="pl-7">
					<Input
						autoFocus={isInteractive}
						aria-label={tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.other_response_for_value0_0e5eb095",
							{
								value0: questionHeader,
							},
						)}
						disabled={!isInteractive || isSubmitting}
						placeholder={tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.describe_another_answer_3b9f898e",
						)}
						value={answer.text}
						onChange={(event) => {
							onTextChange(event.currentTarget.value);
						}}
					/>
				</div>
			)}
		</div>
	);
};

type QuestionStepProps = {
	question: AskUserQuestion;
	questionIndex: number;
	questionCount: number;
	idPrefix: string;
	answer: QuestionAnswer | undefined;
	isInteractive: boolean;
	isSubmitting: boolean;
	onOptionChange: (value: string) => void;
	onOtherTextChange: (text: string) => void;
};

const QuestionStep: FC<QuestionStepProps> = ({
	question,
	questionIndex,
	questionCount,
	idPrefix,
	answer,
	isInteractive,
	isSubmitting,
	onOptionChange,
	onOtherTextChange,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const questionHeader = getQuestionHeader(question, questionIndex);
	const questionText = getQuestionText(question);
	const questionIdBase = `${idPrefix}-question-${questionIndex}`;
	const questionHeaderId = `${questionIdBase}-header`;
	const questionTextId = `${questionIdBase}-text`;
	const showProgress = isInteractive && questionCount > 1;

	return (
		<div className="space-y-3">
			{showProgress && (
				<p className="text-xs font-medium text-content-secondary">
					{tI18n(
						"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.question_39821a75",
					)}
					{questionIndex + 1}
					{tI18n(
						"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.of_a4282e4b",
					)}
					{questionCount}
				</p>
			)}
			<div className="flex items-start gap-1.5 text-content-secondary">
				<MessageCircleQuestionIcon
					aria-hidden="true"
					className="mt-0.5 size-4 shrink-0"
				/>
				<p
					id={questionTextId}
					className="m-0 min-w-0 flex-1 whitespace-pre-wrap text-[13px]"
				>
					<span className="sr-only" id={questionHeaderId}>
						{questionHeader}
					</span>
					<span aria-hidden="true">
						{tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.asking_6b18649b",
						)}
					</span>
					<span>{questionText}</span>
				</p>
			</div>
			<div className="rounded-md border border-solid border-border-default px-3 py-1">
				<RadioGroup
					aria-labelledby={`${questionHeaderId} ${questionTextId}`}
					className="space-y-1"
					name={`${questionIdBase}-options`}
					value={getSelectedValue(answer)}
					onValueChange={onOptionChange}
				>
					{question.options.map((option, optionIndex) => {
						return (
							<QuestionOption
								key={`${option.label}-${option.description}-${optionIndex}`}
								questionIdBase={questionIdBase}
								option={option}
								optionIndex={optionIndex}
								isInteractive={isInteractive}
								isSubmitting={isSubmitting}
							/>
						);
					})}
					<OtherQuestionOption
						questionHeader={questionHeader}
						questionIdBase={questionIdBase}
						optionIndex={question.options.length}
						answer={answer}
						isInteractive={isInteractive}
						isSubmitting={isSubmitting}
						onTextChange={onOtherTextChange}
					/>
				</RadioGroup>
			</div>
		</div>
	);
};

type AnsweredQuestionTextProps = {
	question: AskUserQuestion;
	questionIndex: number;
	idPrefix: string;
};

const AnsweredQuestionText: FC<AnsweredQuestionTextProps> = ({
	question,
	questionIndex,
	idPrefix,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="flex items-start gap-1.5 text-content-secondary">
			<MessageCircleQuestionIcon
				aria-hidden="true"
				className="mt-0.5 size-4 shrink-0"
			/>
			<p
				id={`${idPrefix}-question-${questionIndex}-text`}
				className="m-0 min-w-0 flex-1 whitespace-pre-wrap text-[13px]"
			>
				<span aria-hidden="true">
					{tI18n(
						"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.asked_74075f90",
					)}
				</span>
				<span>{getQuestionText(question)}</span>
			</p>
		</div>
	);
};

export const AskUserQuestionTool: FC<AskUserQuestionToolProps> = ({
	questions,
	status,
	isError,
	errorMessage,
	isChatCompleted = false,
	isLatestAskUserQuestion = false,
	previousResponseText,
	onSubmitAnswer,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const idPrefix = useId();
	const filteredQuestions = questions.map(filterQuestionOptions);
	const [answers, setAnswers] = useState<Array<QuestionAnswer | undefined>>(
		() => filteredQuestions.map(getDefaultAnswer),
	);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [submittedResponseText, setSubmittedResponseText] = useState<
		string | null
	>(null);
	const submitAnswerMutation = useMutation({
		mutationFn: async (message: string) => {
			if (!onSubmitAnswer) {
				return;
			}

			await onSubmitAnswer(message);
		},
		onSuccess: (_data, message) => {
			setSubmittedResponseText(message);
		},
	});
	const isRunning = status === "running";
	const displayedSubmittedResponseText =
		previousResponseText ?? submittedResponseText;
	const hasSubmittedResponse = displayedSubmittedResponseText != null;
	const showAnsweredState = status === "completed" && hasSubmittedResponse;
	const showSubmittedResponse = showAnsweredState && isLatestAskUserQuestion;
	const activeQuestionIndex = Math.min(
		currentQuestionIndex,
		Math.max(filteredQuestions.length - 1, 0),
	);
	const currentAnswer = answers[activeQuestionIndex];
	const isInteractive =
		isChatCompleted &&
		status === "completed" &&
		isLatestAskUserQuestion &&
		!hasSubmittedResponse &&
		Boolean(onSubmitAnswer);
	const isSubmitting = submitAnswerMutation.isPending;
	const submitError = getSubmissionErrorMessage(submitAnswerMutation.error);
	const canAdvanceToNextQuestion = isAnswerValid(currentAnswer);
	const canSubmitAllAnswers = filteredQuestions.every((_, questionIndex) =>
		isAnswerValid(answers[questionIndex]),
	);
	const isWizard = filteredQuestions.length > 1;
	const isFinalQuestion = activeQuestionIndex >= filteredQuestions.length - 1;
	const visibleQuestions =
		isInteractive && isWizard
			? [
					{
						question: filteredQuestions[activeQuestionIndex],
						questionIndex: activeQuestionIndex,
					},
				]
			: filteredQuestions.map((question, questionIndex) => ({
					question,
					questionIndex,
				}));

	const resetSubmitState = () => {
		submitAnswerMutation.reset();
	};

	const setAnswerAtIndex = (
		questionIndex: number,
		nextAnswer: QuestionAnswer | undefined,
	) => {
		setAnswers((currentAnswers) => {
			const nextAnswers = [...currentAnswers];
			nextAnswers[questionIndex] = nextAnswer;
			return nextAnswers;
		});
		resetSubmitState();
	};

	const handleOptionChange = (
		questionIndex: number,
		question: AskUserQuestion,
		value: string,
	) => {
		if (value === OTHER_OPTION_VALUE) {
			const previousAnswer = answers[questionIndex];
			setAnswerAtIndex(
				questionIndex,
				previousAnswer?.kind === "other"
					? previousAnswer
					: { kind: "other", text: "" },
			);
			return;
		}

		const optionIndex = Number.parseInt(value.replace("option-", ""), 10);
		const option = question.options[optionIndex];
		if (!option) {
			return;
		}

		setAnswerAtIndex(questionIndex, {
			kind: "option",
			label: option.label || `Option ${optionIndex + 1}`,
			optionIndex,
		});
	};

	const handleBack = () => {
		setCurrentQuestionIndex((currentIndex) => {
			return Math.max(currentIndex - 1, 0);
		});
		resetSubmitState();
	};

	const handleNext = () => {
		if (!canAdvanceToNextQuestion) {
			return;
		}

		setCurrentQuestionIndex((currentIndex) => {
			return Math.min(currentIndex + 1, filteredQuestions.length - 1);
		});
		resetSubmitState();
	};

	const handleSubmit = () => {
		if (!onSubmitAnswer || !isInteractive || !canSubmitAllAnswers) {
			return;
		}

		const finalizedAnswers = filteredQuestions.map((_, questionIndex) => {
			return answers[questionIndex];
		});
		if (!finalizedAnswers.every(isAnswerValid)) {
			return;
		}

		const outgoingMessage = formatOutgoingMessage(
			filteredQuestions,
			finalizedAnswers,
		);
		resetSubmitState();
		submitAnswerMutation.mutate(outgoingMessage);
	};

	const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!isInteractive) {
			return;
		}

		if (isWizard && !isFinalQuestion) {
			handleNext();
			return;
		}

		handleSubmit();
	};

	if (isError) {
		return (
			<div className="w-full" role="alert">
				<ToolCall.Root
					status={status}
					isError
					errorMessage={
						errorMessage ||
						tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.failed_to_ask_questions_5138683a",
						)
					}
					hasContent={false}
				>
					<ToolCall.Header
						iconName="ask_user_question"
						label={
							errorMessage ||
							tI18n(
								"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.failed_to_ask_questions_5138683a",
							)
						}
					/>
				</ToolCall.Root>
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="w-full">
				{isRunning ? (
					<ToolCall.Root
						status={status}
						hasContent={false}
						role="status"
						aria-live="polite"
					>
						<ToolCall.Header
							iconName="ask_user_question"
							label={tI18n(
								"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.asking_for_clarification_dfd1fbb1",
							)}
						/>
					</ToolCall.Root>
				) : (
					<p className="text-[13px] italic text-content-secondary">
						{tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.no_questions_available_d889d64e",
						)}
					</p>
				)}
			</div>
		);
	}

	const content = (
		<>
			<div className="space-y-5">
				{visibleQuestions.map(({ question, questionIndex }) => {
					const questionKey = `${question.header}-${question.question}-${questionIndex}`;
					if (showAnsweredState) {
						return (
							<AnsweredQuestionText
								key={questionKey}
								question={question}
								questionIndex={questionIndex}
								idPrefix={idPrefix}
							/>
						);
					}

					return (
						<QuestionStep
							key={questionKey}
							question={question}
							questionIndex={questionIndex}
							questionCount={filteredQuestions.length}
							idPrefix={idPrefix}
							answer={answers[questionIndex]}
							isInteractive={isInteractive}
							isSubmitting={isSubmitting}
							onOptionChange={(value) => {
								handleOptionChange(questionIndex, question, value);
							}}
							onOtherTextChange={(text) => {
								setAnswerAtIndex(questionIndex, {
									kind: "other",
									text,
								});
							}}
						/>
					);
				})}
			</div>

			{showSubmittedResponse && (
				<div className="mt-4 rounded-md border border-solid border-border-default bg-surface-secondary px-3 py-2">
					<p className="text-xs font-medium text-content-secondary">
						{tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.submitted_answer_3df2eacb",
						)}
					</p>
					<p className="mt-1 whitespace-pre-wrap text-[13px] text-content-primary">
						{displayedSubmittedResponseText ||
							tI18n(
								"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.no_answer_recorded_85dd2304",
							)}
					</p>
				</div>
			)}

			{submitError && (
				<div
					role="alert"
					className="mt-3 flex items-center gap-1.5 text-[13px] text-content-destructive"
				>
					<TriangleAlertIcon className="size-3.5 shrink-0" />
					<span>{submitError}</span>
				</div>
			)}

			{isInteractive && (
				<div className="mt-4 flex items-center gap-2">
					{isWizard && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={handleBack}
							disabled={activeQuestionIndex === 0 || isSubmitting}
						>
							{tI18n(
								"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.back_76900f1b",
							)}
						</Button>
					)}
					{isWizard && !isFinalQuestion ? (
						<Button
							type="submit"
							size="sm"
							variant="outline"
							disabled={!canAdvanceToNextQuestion || isSubmitting}
						>
							{tI18n(
								"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.next_1ff57a29",
							)}
						</Button>
					) : (
						<Button
							type="submit"
							size="sm"
							variant="outline"
							disabled={!canSubmitAllAnswers || isSubmitting}
						>
							{isSubmitting && (
								<LoaderIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
							)}
							{isSubmitting
								? tI18n(
										"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.submitting_64115d5b",
									)
								: tI18n(
										"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.submit_155f816c",
									)}
						</Button>
					)}
				</div>
			)}
		</>
	);

	return (
		<div className="w-full">
			{isRunning && (
				<ToolCall.Root
					status={status}
					hasContent={false}
					role="status"
					aria-live="polite"
				>
					<ToolCall.Header
						iconName="ask_user_question"
						label={tI18n(
							"AgentsPage.components.ChatElements.tools.AskUserQuestionTool.asking_for_clarification_dfd1fbb1",
						)}
					/>
				</ToolCall.Root>
			)}
			{isInteractive ? (
				<form onSubmit={handleFormSubmit}>{content}</form>
			) : (
				content
			)}
		</div>
	);
};
