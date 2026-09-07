import { useFormik } from "formik";
import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type { Group } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { IconField } from "#/components/IconField/IconField";
import { Input } from "#/components/Input/Input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/InputGroup/InputGroup";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import {
	getAIBudgetRangeError,
	isEveryoneGroup,
	maxAIBudgetDollars,
} from "#/modules/groups";
import { usdBudgetFormatter } from "#/utils/currency";
import { docs } from "#/utils/docs";
import {
	getFormHelpers,
	nameValidator,
	onChangeTrimmed,
} from "#/utils/formUtils";

type FormData = {
	name: string;
	display_name: string;
	avatar_url: string;
	quota_allowance: number;
	// Per-member AI budget, in dollars. "" means no budget; 0 disables AI access.
	monthly_budget_per_member: string;
};

const validationSchema = Yup.object({
	name: nameValidator(
		i18n.t("administration:GroupsPage.GroupSettingsPageView.name_dcd1d522"),
	),
	quota_allowance: Yup.number().required().min(0).integer(),
	// Optional: empty means no budget. A value must be within the range; 0 disables.
	monthly_budget_per_member: Yup.number()
		.transform((value, original) => (original === "" ? undefined : value))
		.min(0, getAIBudgetRangeError)
		.max(maxAIBudgetDollars, getAIBudgetRangeError),
});

const BudgetDocsLink: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Link
			href={docs(
				"/ai-coder/ai-gateway/cost-controls#effective-group-resolution",
			)}
			target="_blank"
			rel="noreferrer"
			size="sm"
			// The link's default left padding reads as a stray gap when the link
			// wraps to its own line under the helper text.
			className="pl-0"
		>
			{tI18n("GroupsPage.GroupSettingsPageView.view_docs_61479fda")}
		</Link>
	);
};

interface AIBudgetFeedbackProps {
	error: boolean;
	helperText?: ReactNode;
	monthlyBudgetPerMember: string;
	memberCount: number;
}

const AIBudgetFeedback: FC<AIBudgetFeedbackProps> = ({
	error,
	helperText,
	monthlyBudgetPerMember,
	memberCount,
}) => {
	const { t: tI18n } = useTranslation("administration");

	if (error) {
		return (
			<span className="text-left text-xs text-content-destructive">
				{helperText}
			</span>
		);
	}

	const budgetValue = monthlyBudgetPerMember.trim();
	const budgetAmount = Number(budgetValue);

	// Empty means no budget; $0 disables AI access. Both states show an
	// explanatory alert alongside the summary line.
	if (budgetValue === "" || budgetAmount === 0) {
		const { summary, message } =
			budgetValue === ""
				? {
						summary: tI18n(
							"GroupsPage.GroupSettingsPageView.this_group_doesn_t_have_a_budget_set_ff45eb6b",
						),
						message: tI18n(
							"GroupsPage.GroupSettingsPageView.members_will_fall_back_to_another_group_s_limit__a67e3683",
						),
					}
				: {
						summary: (
							<>
								{tI18n(
									"GroupsPage.GroupSettingsPageView.this_group_s_limit_has_been_set_to_decac4da",
								)}{" "}
								<span className="font-medium text-content-primary">$0</span>.
							</>
						),
						message: tI18n(
							"GroupsPage.GroupSettingsPageView.a_0_limit_blocks_ai_access_for_members_that_aren_5aa50965",
						),
					};
		return (
			<>
				<span className="text-left text-xs text-content-secondary">
					{summary}
				</span>
				<span className="text-left text-xs text-content-secondary">
					{message} <BudgetDocsLink />
				</span>
			</>
		);
	}

	if (Number.isFinite(budgetAmount) && budgetAmount > 0) {
		return (
			<span className="text-left text-xs text-content-secondary">
				{tI18n(
					"GroupsPage.GroupSettingsPageView.this_group_s_limit_is_40fca312",
				)}{" "}
				<span className="font-medium text-content-primary">
					{usdBudgetFormatter.format(budgetAmount * memberCount)}
				</span>
				{tI18n("GroupsPage.GroupSettingsPageView.month_based_on_1b994ac4")}{" "}
				<span className="font-medium text-content-primary">{memberCount}</span>{" "}
				{memberCount === 1
					? tI18n("GroupsPage.GroupSettingsPageView.member_e31ab643")
					: tI18n("GroupsPage.GroupSettingsPageView.members_17373ca1")}
				. <BudgetDocsLink />
			</span>
		);
	}

	return null;
};

interface UpdateGroupFormProps {
	group: Group;
	/** Whether the AI budget settings are shown (gated by the aibridge feature). */
	showAISettings: boolean;
	/** Per-member AI budget in dollars, or null for unlimited spend. */
	initialBudgetDollars: number | null;
	errors: unknown;
	onSubmit: (data: FormData) => void;
	isLoading: boolean;
}

const UpdateGroupForm: FC<UpdateGroupFormProps> = ({
	group,
	showAISettings,
	initialBudgetDollars,
	errors,
	onSubmit,
	isLoading,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<FormData>({
		initialValues: {
			name: group.name,
			display_name: group.display_name,
			avatar_url: group.avatar_url,
			quota_allowance: group.quota_allowance,
			monthly_budget_per_member:
				initialBudgetDollars === null ? "" : String(initialBudgetDollars),
		},
		validationSchema,
		onSubmit,
	});
	const getFieldHelpers = getFormHelpers<FormData>(form, errors);
	const nameField = getFieldHelpers("name", {
		helperText: tI18n(
			"GroupsPage.GroupSettingsPageView.unique_identifier_62d55bfc",
		),
	});
	const displayNameField = getFieldHelpers("display_name", {
		helperText: tI18n(
			"GroupsPage.GroupSettingsPageView.friendly_name_defaults_to_the_name_if_blank_c7f655d7",
		),
	});
	const quotaField = getFieldHelpers("quota_allowance", {
		helperText: tI18n(
			"GroupsPage.GroupSettingsPageView.this_group_gives_value0_quota_credits_to_each_of_5073c010",
			{
				value0: form.values.quota_allowance,
			},
		),
	});
	const budgetField = getFieldHelpers("monthly_budget_per_member");

	return (
		<form className="flex flex-col gap-6" onSubmit={form.handleSubmit}>
			<section className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<h2 className="text-xl font-semibold text-content-primary m-0">
						{tI18n("GroupsPage.GroupSettingsPageView.general_c910d474")}
					</h2>
				</div>
				<div className="flex flex-col gap-6">
					<div className="flex flex-col items-start gap-2">
						<Label htmlFor={nameField.id}>
							{tI18n("GroupsPage.GroupSettingsPageView.name_dcd1d522")}{" "}
							<span className="text-xs font-bold text-content-destructive">
								*
							</span>
						</Label>
						<Input
							id={nameField.id}
							name={nameField.name}
							value={nameField.value}
							onChange={onChangeTrimmed(form)}
							onBlur={nameField.onBlur}
							autoComplete="name"
							autoFocus
							disabled={isEveryoneGroup(group)}
							aria-invalid={nameField.error}
						/>
						{nameField.helperText && (
							<span
								className={`text-xs text-left ${
									nameField.error
										? "text-content-destructive"
										: "text-content-secondary"
								}`}
							>
								{nameField.helperText}
							</span>
						)}
					</div>
					{!isEveryoneGroup(group) && (
						<>
							<div className="flex flex-col items-start gap-2">
								<Label htmlFor={displayNameField.id}>
									{tI18n(
										"GroupsPage.GroupSettingsPageView.display_name_2b7f6a84",
									)}
								</Label>
								<Input
									id={displayNameField.id}
									name={displayNameField.name}
									value={displayNameField.value}
									onChange={displayNameField.onChange}
									onBlur={displayNameField.onBlur}
									autoComplete="display_name"
									disabled={isEveryoneGroup(group)}
									aria-invalid={displayNameField.error}
								/>
								{displayNameField.helperText && (
									<span
										className={`text-xs text-left ${
											displayNameField.error
												? "text-content-destructive"
												: "text-content-secondary"
										}`}
									>
										{displayNameField.helperText}
									</span>
								)}
							</div>
							<IconField
								{...getFieldHelpers("avatar_url")}
								onChange={onChangeTrimmed(form)}
								fullWidth
								label={tI18n(
									"GroupsPage.GroupSettingsPageView.avatar_url_18a20f99",
								)}
								onPickEmoji={(value) => form.setFieldValue("avatar_url", value)}
							/>
						</>
					)}
				</div>
			</section>
			{showAISettings && (
				<section className="flex flex-col gap-4">
					<h2 className="m-0 text-xl font-semibold text-content-primary">
						{tI18n("GroupsPage.GroupSettingsPageView.ai_budget_4b897a4d")}
					</h2>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col items-start gap-2">
							<Label htmlFor={budgetField.id}>
								{tI18n(
									"GroupsPage.GroupSettingsPageView.monthly_limit_per_member_8a53fd72",
								)}
							</Label>
							<InputGroup>
								<InputGroupInput
									id={budgetField.id}
									name={budgetField.name}
									value={budgetField.value}
									onChange={(event) =>
										form.setFieldValue(budgetField.name, event.target.value)
									}
									onBlur={budgetField.onBlur}
									type="number"
									min="0"
									max={maxAIBudgetDollars}
									step="1"
									placeholder={tI18n(
										"GroupsPage.GroupSettingsPageView.no_budget_fa2e5945",
									)}
									aria-invalid={budgetField.error}
								/>
								<InputGroupAddon align="inline-end" className="pr-3">
									{tI18n("GroupsPage.GroupSettingsPageView.usd_a26cdf3a")}
								</InputGroupAddon>
							</InputGroup>
							<AIBudgetFeedback
								error={budgetField.error}
								helperText={budgetField.helperText}
								monthlyBudgetPerMember={form.values.monthly_budget_per_member}
								memberCount={group.total_member_count}
							/>
						</div>
					</div>
				</section>
			)}
			<section className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<h2 className="text-xl font-semibold text-content-primary m-0">
						{tI18n("GroupsPage.GroupSettingsPageView.quotas_422b3847")}
					</h2>
					<p className="text-sm leading-none m-0 text-content-secondary">
						{tI18n(
							"GroupsPage.GroupSettingsPageView.you_can_use_quotas_to_restrict_how_many_resource_04cfcd09",
						)}
					</p>
				</div>
				<div className="flex flex-col gap-6">
					<div className="flex flex-col items-start gap-2">
						<Label htmlFor={quotaField.id}>
							{tI18n(
								"GroupsPage.GroupSettingsPageView.quota_allowance_53415b1f",
							)}
						</Label>
						<Input
							id={quotaField.id}
							name={quotaField.name}
							value={quotaField.value}
							onChange={onChangeTrimmed(form)}
							onBlur={quotaField.onBlur}
							type="number"
							aria-invalid={quotaField.error}
							className="w-40"
						/>
						{quotaField.helperText && (
							<span
								className={`text-xs text-left ${
									quotaField.error
										? "text-content-destructive"
										: "text-content-secondary"
								}`}
							>
								{quotaField.helperText}
							</span>
						)}
					</div>
				</div>
			</section>
			<footer className="flex items-center justify-end space-x-2">
				<Button type="submit" disabled={isLoading}>
					<Spinner loading={isLoading} />
					{tI18n("GroupsPage.GroupSettingsPageView.save_1509f561")}
				</Button>
			</footer>
		</form>
	);
};

type SettingsGroupPageViewProps = {
	onSubmit: (data: FormData) => void;
	group: Group;
	showAISettings: boolean;
	initialBudgetDollars: number | null;
	formErrors: unknown;
	isUpdating: boolean;
};

const GroupSettingsPageView: FC<SettingsGroupPageViewProps> = ({
	onSubmit,
	group,
	showAISettings,
	initialBudgetDollars,
	formErrors,
	isUpdating,
}) => {
	return (
		<UpdateGroupForm
			group={group}
			showAISettings={showAISettings}
			initialBudgetDollars={initialBudgetDollars}
			errors={formErrors}
			isLoading={isUpdating}
			onSubmit={onSubmit}
		/>
	);
};

export default GroupSettingsPageView;
