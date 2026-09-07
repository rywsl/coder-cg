import { useFormik } from "formik";
import { PlusIcon, TrashIcon, TriangleAlertIcon } from "lucide-react";
import { type FC, type KeyboardEventHandler, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type {
	Group,
	GroupSyncSettings,
	Organization,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	Combobox,
	ComboboxButton,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "#/components/Combobox/Combobox";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverText,
	HelpPopoverTitle,
} from "#/components/HelpPopover/HelpPopover";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import {
	MultiSelectCombobox,
	type Option,
} from "#/components/MultiSelectCombobox/MultiSelectCombobox";
import { Spinner } from "#/components/Spinner/Spinner";
import { Switch } from "#/components/Switch/Switch";
import { TableCell, TableRow } from "#/components/Table/Table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import { isEveryoneGroup } from "#/modules/groups";
import { docs } from "#/utils/docs";
import { isUUID } from "#/utils/uuid";
import { ExportPolicyButton } from "./ExportPolicyButton";
import { IdpMappingTable } from "./IdpMappingTable";
import { IdpPillList } from "./IdpPillList";

const groupSyncValidationSchema = Yup.object({
	field: Yup.string().trim(),
	regex_filter: Yup.string().trim(),
	auto_create_missing_groups: Yup.boolean(),
	mapping: Yup.object()
		.test(
			"valid-mapping",
			i18n.t(
				"administration:OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.invalid_group_sync_settings_mapping_structure_86c08aad",
			),
			(value) => {
				if (!value) return true;
				return Object.entries(value).every(
					([key, arr]) =>
						typeof key === "string" &&
						Array.isArray(arr) &&
						arr.every((item) => {
							return typeof item === "string" && isUUID(item);
						}),
				);
			},
		)
		.default({}),
});

interface IdpGroupSyncFormProps {
	groupSyncSettings: GroupSyncSettings;
	claimFieldValues: readonly string[] | undefined;
	groupsMap: Map<string, string>;
	groups: Group[];
	groupMappingCount: number;
	legacyGroupMappingCount: number;
	organization: Organization;
	onSubmit: (data: GroupSyncSettings) => void;
	onSyncFieldChange: (value: string) => void;
}

export const IdpGroupSyncForm: FC<IdpGroupSyncFormProps> = ({
	groupSyncSettings,
	claimFieldValues,
	groupMappingCount,
	legacyGroupMappingCount,
	groups,
	groupsMap,
	organization,
	onSubmit,
	onSyncFieldChange,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<GroupSyncSettings>({
		initialValues: {
			field: groupSyncSettings?.field ?? "",
			regex_filter: groupSyncSettings?.regex_filter ?? "",
			auto_create_missing_groups:
				groupSyncSettings?.auto_create_missing_groups ?? false,
			mapping: groupSyncSettings?.mapping ?? {},
		},
		validationSchema: groupSyncValidationSchema,
		onSubmit,
		enableReinitialize: Boolean(groupSyncSettings),
	});
	const [idpGroupName, setIdpGroupName] = useState("");
	const [coderGroups, setCoderGroups] = useState<Option[]>([]);
	const id = useId();
	const [comboInputValue, setComboInputValue] = useState("");
	const [open, setOpen] = useState(false);

	const getGroupNames = (groupIds: readonly string[]) => {
		return groupIds.map((groupId) => groupsMap.get(groupId) || groupId);
	};

	const handleDelete = async (idpOrg: string) => {
		const newMapping = Object.fromEntries(
			Object.entries(form.values.mapping || {}).filter(
				([key]) => key !== idpOrg,
			),
		);
		const newSyncSettings = {
			...form.values,
			mapping: newMapping,
		};
		void form.setFieldValue("mapping", newSyncSettings.mapping);
		form.handleSubmit();
	};

	const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
		if (
			event.key === "Enter" &&
			comboInputValue &&
			!claimFieldValues?.some(
				(value) => value === comboInputValue.toLowerCase(),
			)
		) {
			event.preventDefault();
			setIdpGroupName(comboInputValue);
			setComboInputValue("");
			setOpen(false);
		}
	};

	return (
		<form onSubmit={form.handleSubmit}>
			<fieldset
				disabled={form.isSubmitting}
				className="flex flex-col border-none gap-8 pt-2"
			>
				<div className="flex justify-end">
					<ExportPolicyButton
						syncSettings={groupSyncSettings}
						organization={organization}
						type="groups"
					/>
				</div>
				<div className="grid items-center gap-3">
					<div className="flex flex-row items-center gap-5">
						<div className="grid grid-cols-2 gap-2 grid-rows-[20px_auto_20px]">
							<Label className="text-sm" htmlFor={`${id}-sync-field`}>
								{tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.group_sync_field_828927f6",
								)}
							</Label>
							<Label className="text-sm" htmlFor={`${id}-regex-filter`}>
								{tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.regex_filter_8c7c1818",
								)}
							</Label>
							<Input
								id={`${id}-sync-field`}
								value={form.values.field}
								onChange={(event) => {
									void form.setFieldValue("field", event.target.value);
									onSyncFieldChange(event.target.value);
								}}
								className="w-72"
							/>
							<div className="flex flex-row gap-2">
								<Input
									id={`${id}-regex-filter`}
									value={form.values.regex_filter ?? ""}
									onChange={(event) => {
										void form.setFieldValue("regex_filter", event.target.value);
									}}
									className="min-w-40"
								/>
								<Button
									type="submit"
									disabled={form.isSubmitting || !form.dirty}
									onClick={(event) => {
										event.preventDefault();
										form.handleSubmit();
									}}
								>
									<Spinner loading={form.isSubmitting} />
									{tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.save_1509f561",
									)}
								</Button>
							</div>
							<p className="text-content-secondary text-2xs m-0">
								{tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.if_empty_group_sync_is_deactivated_b5b4a737",
								)}
							</p>
						</div>
					</div>
					{form.errors.field ||
						(form.errors.regex_filter && (
							<p className="text-content-destructive text-sm m-0">
								{form.errors.field || form.errors.regex_filter}
							</p>
						))}
				</div>
				<div className="flex flex-row items-center gap-3">
					<Spinner size="sm" loading={form.isSubmitting} className="w-9">
						<Switch
							id={`${id}-auto-create-missing-groups`}
							checked={form.values.auto_create_missing_groups}
							onCheckedChange={(checked) => {
								void form.setFieldValue("auto_create_missing_groups", checked);
								form.handleSubmit();
							}}
						/>
					</Spinner>
					<span className="flex flex-row items-center gap-1">
						<Label htmlFor={`${id}-auto-create-missing-groups`}>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.auto_create_missing_groups_82fae119",
							)}
						</Label>
						<AutoCreateMissingGroupsHelpPopover />
					</span>
				</div>
				<div className="flex flex-row gap-2 justify-between items-start">
					<div className="grid items-center gap-1 w-72">
						<Label className="text-sm" htmlFor={`${id}-idp-group-name`}>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.idp_group_name_f56f321f",
							)}
						</Label>
						{claimFieldValues ? (
							<Combobox
								open={open}
								onOpenChange={setOpen}
								value={idpGroupName}
								onValueChange={(value) => setIdpGroupName(value ?? "")}
							>
								<ComboboxTrigger asChild>
									<ComboboxButton
										className="w-72"
										selectedOption={
											idpGroupName
												? { label: idpGroupName, value: idpGroupName }
												: undefined
										}
										placeholder={tI18n(
											"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.select_idp_group_c6eb586b",
										)}
									/>
								</ComboboxTrigger>
								<ComboboxContent className="w-72">
									<ComboboxInput
										value={comboInputValue}
										onValueChange={setComboInputValue}
										placeholder={tI18n(
											"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.search_7f553822",
										)}
										onKeyDown={handleKeyDown}
									/>
									<ComboboxList>
										{claimFieldValues
											.filter((value) =>
												value
													.toLowerCase()
													.includes(comboInputValue.toLowerCase()),
											)
											.map((value) => (
												<ComboboxItem
													key={value}
													value={value}
													onSelect={() => setComboInputValue("")}
												>
													{value}
												</ComboboxItem>
											))}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						) : (
							<Input
								id={`${id}-idp-group-name`}
								value={idpGroupName}
								className="w-72"
								onChange={(event) => {
									setIdpGroupName(event.target.value);
								}}
							/>
						)}
					</div>
					<div className="grid items-center gap-1 flex-1">
						<Label className="text-sm" htmlFor={`${id}-coder-group`}>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.coder_group_4b56cf6a",
							)}
						</Label>
						<MultiSelectCombobox
							inputProps={{
								id: `${id}-coder-group`,
							}}
							className="min-w-60 max-w-3xl"
							value={coderGroups}
							onChange={setCoderGroups}
							options={groups
								.filter((group) => !isEveryoneGroup(group))
								.map((group) => ({
									label: group.display_name || group.name,
									value: group.id,
								}))}
							hidePlaceholderWhenSelected
							placeholder={tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.select_group_720c488f",
							)}
							emptyIndicator={
								<p className="text-center text-md text-content-primary">
									{tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.no_more_groups_to_select_bf31dceb",
									)}
								</p>
							}
						/>
					</div>
					<div className="grid grid-rows-[28px_auto]">
						<div />
						<Button
							type="submit"
							className="min-w-fit"
							disabled={!idpGroupName || coderGroups.length === 0}
							onClick={() => {
								const newSyncSettings = {
									...form.values,
									mapping: {
										...form.values.mapping,
										[idpGroupName]: coderGroups.map((group) => group.value),
									},
								};
								void form.setFieldValue("mapping", newSyncSettings.mapping);
								form.handleSubmit();
								setIdpGroupName("");
								setCoderGroups([]);
							}}
						>
							<Spinner loading={form.isSubmitting}>
								<PlusIcon />
							</Spinner>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.add_idp_group_1b3638e8",
							)}
						</Button>
					</div>
				</div>
				{form.errors.mapping && (
					<p className="text-content-destructive text-sm m-0">
						{Object.values(form.errors.mapping || {})}
					</p>
				)}
				<div className="flex flex-col">
					<IdpMappingTable type="Group" rowCount={groupMappingCount}>
						{groupSyncSettings?.mapping &&
							Object.entries(groupSyncSettings.mapping)
								.sort(([a], [b]) =>
									a.toLowerCase().localeCompare(b.toLowerCase()),
								)
								.map(([idpGroup, groups]) => (
									<GroupRow
										key={idpGroup}
										idpGroup={idpGroup}
										exists={claimFieldValues?.includes(idpGroup)}
										coderGroup={getGroupNames(groups)}
										onDelete={handleDelete}
									/>
								))}
					</IdpMappingTable>

					{groupSyncSettings?.legacy_group_name_mapping && (
						<div>
							<LegacyGroupSyncHeader />
							<IdpMappingTable type="Group" rowCount={legacyGroupMappingCount}>
								{Object.entries(groupSyncSettings.legacy_group_name_mapping)
									.sort(([a], [b]) =>
										a.toLowerCase().localeCompare(b.toLowerCase()),
									)
									.map(([idpGroup, groupId]) => (
										<GroupRow
											key={groupId}
											idpGroup={idpGroup}
											exists={claimFieldValues?.includes(idpGroup)}
											coderGroup={getGroupNames([groupId])}
											onDelete={handleDelete}
										/>
									))}
							</IdpMappingTable>
						</div>
					)}
				</div>
			</fieldset>
		</form>
	);
};

interface GroupRowProps {
	idpGroup: string;
	exists: boolean | undefined;
	coderGroup: readonly string[];
	onDelete: (idpOrg: string) => void;
}

const GroupRow: FC<GroupRowProps> = ({
	idpGroup,
	exists = true,
	coderGroup,
	onDelete,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<TableRow data-testid={`group-${idpGroup}`}>
			<TableCell>
				<div className="flex flex-row items-center gap-2 text-content-primary">
					{idpGroup}
					{!exists && (
						<Tooltip>
							<TooltipTrigger asChild>
								<TriangleAlertIcon className="size-icon-xs cursor-pointer text-content-warning" />
							</TooltipTrigger>
							<TooltipContent
								align="start"
								alignOffset={-8}
								sideOffset={8}
								className="p-2 text-xs text-content-secondary max-w-sm"
							>
								{tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.this_value_has_not_be_seen_in_the_specified_clai_69d1ded4",
								)}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</TableCell>
			<TableCell>
				<IdpPillList roles={coderGroup} />
			</TableCell>
			<TableCell>
				<Button
					variant="outline"
					size="icon"
					className="text-content-primary"
					aria-label={tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.delete_61975955",
					)}
					onClick={() => onDelete(idpGroup)}
				>
					<TrashIcon />
					<span className="sr-only">
						{tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.delete_idp_mapping_8c31481a",
						)}
					</span>
				</Button>
			</TableCell>
		</TableRow>
	);
};

const AutoCreateMissingGroupsHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverText>
					{tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.enabling_auto_create_missing_groups_will_automat_115de3a5",
					)}
				</HelpPopoverText>
			</HelpPopoverContent>
		</HelpPopover>
	);
};

const LegacyGroupSyncHeader: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<h4 className="text-xl font-medium">
			<div className="flex items-end gap-2">
				<span>
					{tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.legacy_group_sync_settings_677299d7",
					)}
				</span>
				<HelpPopover>
					<HelpPopoverIconTrigger />
					<HelpPopoverContent>
						<HelpPopoverTitle>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.legacy_group_sync_settings_677299d7",
							)}
						</HelpPopoverTitle>
						<HelpPopoverText>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.these_settings_were_configured_using_environment_88f712a6",
							)}{" "}
							<Link href={docs("/admin/users/idp-sync")}>
								{tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpGroupSyncForm.learn_more_bdc5b959",
								)}
							</Link>
						</HelpPopoverText>
					</HelpPopoverContent>
				</HelpPopover>
			</div>
		</h4>
	);
};
