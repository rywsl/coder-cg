import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { groupById } from "#/api/queries/groups";
import type { Group, GroupMemberAISpend } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Spinner } from "#/components/Spinner/Spinner";
import { TableCell } from "#/components/Table/Table";
import { i18n } from "#/i18n";
import { AIBudgetAmount } from "#/modules/groups/AIBudgetAmount";
import { AIBudgetUsage } from "#/modules/groups/AIBudgetUsage";
import { formatBudgetUSD } from "#/utils/currency";
import { StatusIconTooltip } from "./StatusIconTooltip";

const EM_DASH = "\u2014";

/** Shown on both cells when the governing group is in another org. */
const OTHER_ORG_MESSAGE = i18n.t(
	"administration:GroupsPage.GroupMemberBudgetCells.this_user_s_ai_budget_is_managed_by_a_group_in_a_ccfbce11",
);

/**
 * The AI spend and Budget group cells for a group member. Spend is scoped to
 * the viewed group; the limit comes from the member's effective group.
 */
export const GroupMemberBudgetCells: FC<{
	group: Group;
	userID: string;
	spend: GroupMemberAISpend | undefined;
}> = ({ group, userID, spend }) => {
	const { t: tI18n } = useTranslation("administration");

	const effective = effectiveBudgetGroup(spend, group);
	const isEveryoneGroup = spend?.effective_group_id === group.organization_id;
	const fromOtherGroup = effective.kind === "otherGroup";

	const { data: effectiveGroup, isLoading: isResolvingGroupName } = useQuery({
		...groupById(spend?.effective_group_id ?? "", {
			exclude_members: true,
		}),
		enabled:
			fromOtherGroup && !isEveryoneGroup && Boolean(spend?.effective_group_id),
	});
	const effectiveGroupName = isEveryoneGroup
		? "Everyone"
		: effectiveGroup?.display_name || effectiveGroup?.name;
	const groupName = group.display_name || group.name;
	// A user override shows as "(individual)" on the governing group's badge.
	const badgeName = (name: string) =>
		spend?.effective_budget?.limit_source === "user_override"
			? `${name} (individual)`
			: name;

	let budgetGroup: ReactNode;
	switch (effective.kind) {
		case "none":
			budgetGroup = EM_DASH;
			break;
		case "everyone":
			// A populated budget means the Everyone group's own budget applies,
			// so it isn't the unallocated fallback.
			budgetGroup = (
				<Badge size="sm">
					{spend?.effective_budget
						? badgeName("Everyone")
						: tI18n(
								"GroupsPage.GroupMemberBudgetCells.everyone_not_allocated_2d7a1377",
							)}
				</Badge>
			);
			break;
		case "this":
			budgetGroup = <Badge size="sm">{badgeName(groupName)}</Badge>;
			break;
		case "otherGroup":
			// Wait for the name to resolve rather than flashing the fallback.
			if (isResolvingGroupName) {
				budgetGroup = <Spinner loading size="sm" />;
			} else {
				budgetGroup = effectiveGroupName ? (
					<Badge size="sm">{badgeName(effectiveGroupName)}</Badge>
				) : (
					EM_DASH
				);
			}
			break;
		case "otherOrg":
			budgetGroup = (
				<LabelWithInfo label={EM_DASH} message={OTHER_ORG_MESSAGE} />
			);
			break;
	}

	let budget: ReactNode = EM_DASH;
	if (spend && effective.kind === "otherOrg") {
		budget = <LabelWithInfo label={EM_DASH} message={OTHER_ORG_MESSAGE} />;
	} else if (spend && effective.kind === "otherGroup") {
		if (isResolvingGroupName) {
			budget = <Spinner loading size="sm" />;
		} else if (effectiveGroupName) {
			budget = (
				<div className="flex flex-col gap-0.5">
					<span className="flex items-center gap-1">
						<span>
							<span className="text-content-secondary">
								{formatBudgetUSD(spend.group_spend_micros)}
							</span>{" "}
							<span className="text-content-disabled">
								{tI18n("GroupsPage.GroupMemberBudgetCells.usd_a26cdf3a")}
							</span>
						</span>
						<StatusIconTooltip
							message={
								<>
									{tI18n(
										"GroupsPage.GroupMemberBudgetCells.the_amount_shown_is_this_user_s_spend_in_the_fc905203",
									)}{" "}
									<span className="font-medium text-content-primary">
										{groupName}
									</span>{" "}
									{tI18n(
										"GroupsPage.GroupMemberBudgetCells.group_their_ai_budget_is_currently_managed_by_th_be0c2cc2",
									)}{" "}
									<span className="font-medium text-content-primary">
										{effectiveGroupName}
									</span>{" "}
									{tI18n("GroupsPage.GroupMemberBudgetCells.group_4012eb4b")}
								</>
							}
						/>
					</span>
					<span className="text-xs text-content-secondary">
						{tI18n(
							"GroupsPage.GroupMemberBudgetCells.budget_managed_by_another_group_54d120b1",
						)}
					</span>
				</div>
			);
		}
	} else if (spend) {
		const limit = spend.effective_budget?.spend_limit_micros ?? null;
		if (limit === null) {
			// The effective group has no budget, so no limit applies.
			budget = (
				<LabelWithInfo
					label={
						<AIBudgetUsage
							currentSpend={spend.group_spend_micros}
							spendLimit={null}
						/>
					}
					message={tI18n(
						"GroupsPage.GroupMemberBudgetCells.none_of_this_user_s_groups_have_an_ai_budget_con_02cca7a9",
					)}
				/>
			);
		} else {
			const limitLabel =
				spend.effective_budget?.limit_source === "user_override"
					? tI18n("GroupsPage.GroupMemberBudgetCells.custom_494ca78f")
					: tI18n("GroupsPage.GroupMemberBudgetCells.group_34ca0e76");
			budget = (
				<div className="flex flex-col gap-0.5">
					<span>
						<AIBudgetAmount spend={spend.group_spend_micros} limit={limit} />{" "}
						<span className="text-content-disabled">
							{tI18n("GroupsPage.GroupMemberBudgetCells.usd_a26cdf3a")}
						</span>
					</span>
					<span className="text-xs text-content-secondary">
						{tI18n(
							"GroupsPage.GroupMemberBudgetCells.value0_limit_value1_d9c8790b",
							{
								value0: limitLabel,
								value1: formatBudgetUSD(limit),
							},
						)}
					</span>
				</div>
			);
		}
	}

	return (
		<>
			<TableCell
				data-testid={`member-ai-budget-${userID}`}
				className="whitespace-nowrap tabular-nums"
			>
				{budget}
			</TableCell>
			<TableCell>{budgetGroup}</TableCell>
		</>
	);
};

/** Which group governs a member's AI budget, relative to the given group. */
type EffectiveBudgetGroup =
	| { kind: "none" }
	| { kind: "everyone" }
	| { kind: "this" }
	| { kind: "otherGroup" }
	| { kind: "otherOrg" };

/**
 * Resolves which group governs a member's AI budget:
 *
 * - "none": spend data is not loaded.
 * - "everyone": the viewed group is Everyone or Everyone is unlimited.
 * - "this": the viewed group governs the budget.
 * - "otherGroup": another group in this organization governs the budget.
 * - "otherOrg": a group in another organization governs the budget.
 */
export function effectiveBudgetGroup(
	spend: GroupMemberAISpend | undefined,
	group: Pick<Group, "id" | "organization_id">,
): EffectiveBudgetGroup {
	const groupId = spend?.effective_group_id ?? null;
	if (groupId === null) {
		return spend === undefined ? { kind: "none" } : { kind: "otherOrg" };
	}
	// A budgeted Everyone group is "otherGroup" when viewing a regular group.
	// The unlimited fallback remains "everyone" so it renders as not allocated.
	if (groupId === group.organization_id) {
		return group.id === group.organization_id || !spend?.effective_budget
			? { kind: "everyone" }
			: { kind: "otherGroup" };
	}
	if (groupId === group.id) {
		return { kind: "this" };
	}
	return { kind: "otherGroup" };
}

const LabelWithInfo: FC<{ label: ReactNode; message: ReactNode }> = ({
	label,
	message,
}) => (
	<span className="inline-flex items-center gap-1">
		{label}
		<StatusIconTooltip message={message} />
	</span>
);
