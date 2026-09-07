import { useFormik } from "formik";
import { PlusIcon, TrashIcon, TriangleAlertIcon } from "lucide-react";
import { type FC, type KeyboardEventHandler, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type {
	Organization,
	Role,
	RoleSyncSettings,
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
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import {
	MultiSelectCombobox,
	type Option,
} from "#/components/MultiSelectCombobox/MultiSelectCombobox";
import { Spinner } from "#/components/Spinner/Spinner";
import { TableCell, TableRow } from "#/components/Table/Table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import { ExportPolicyButton } from "./ExportPolicyButton";
import { IdpMappingTable } from "./IdpMappingTable";
import { IdpPillList } from "./IdpPillList";

const roleSyncValidationSchema = Yup.object({
	field: Yup.string().trim(),
	regex_filter: Yup.string().trim(),
	auto_create_missing_groups: Yup.boolean(),
	mapping: Yup.object()
		.test(
			"valid-mapping",
			i18n.t(
				"administration:OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.invalid_role_sync_settings_mapping_structure_80aea2b4",
			),
			(value) => {
				if (!value) return true;
				return Object.entries(value).every(
					([key, arr]) =>
						typeof key === "string" &&
						Array.isArray(arr) &&
						arr.every((item) => {
							return typeof item === "string";
						}),
				);
			},
		)
		.default({}),
});

interface IdpRoleSyncFormProps {
	roleSyncSettings: RoleSyncSettings;
	claimFieldValues: readonly string[] | undefined;
	roleMappingCount: number;
	organization: Organization;
	roles: Role[];
	onSubmit: (data: RoleSyncSettings) => void;
	onSyncFieldChange: (value: string) => void;
}

export const IdpRoleSyncForm: FC<IdpRoleSyncFormProps> = ({
	roleSyncSettings,
	claimFieldValues,
	roleMappingCount,
	organization,
	roles,
	onSubmit,
	onSyncFieldChange,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<RoleSyncSettings>({
		initialValues: {
			field: roleSyncSettings?.field ?? "",
			mapping: roleSyncSettings?.mapping ?? {},
		},
		validationSchema: roleSyncValidationSchema,
		onSubmit,
		enableReinitialize: Boolean(roleSyncSettings),
	});
	const [idpRoleName, setIdpRoleName] = useState("");
	const [coderRoles, setCoderRoles] = useState<Option[]>([]);
	const id = useId();
	const [comboInputValue, setComboInputValue] = useState("");
	const [open, setOpen] = useState(false);

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
			setIdpRoleName(comboInputValue);
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
						syncSettings={roleSyncSettings}
						organization={organization}
						type="roles"
					/>
				</div>
				<div className="grid items-center gap-1">
					<Label className="text-sm" htmlFor={`${id}-sync-field`}>
						{tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.role_sync_field_e896a659",
						)}
					</Label>
					<div className="flex flex-row items-center gap-5">
						<div className="flex flex-row gap-2">
							<Input
								id={`${id}-sync-field`}
								value={form.values.field}
								onChange={(event) => {
									void form.setFieldValue("field", event.target.value);
									onSyncFieldChange(event.target.value);
								}}
								className="w-72"
							/>
							<Button
								className="px-6"
								type="submit"
								disabled={form.isSubmitting || !form.dirty}
								onClick={(event) => {
									event.preventDefault();
									form.handleSubmit();
								}}
							>
								<Spinner loading={form.isSubmitting} />
								{tI18n(
									"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.save_1509f561",
								)}
							</Button>
						</div>
					</div>
					<p className="text-content-secondary text-2xs m-0">
						{tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.if_empty_role_sync_is_deactivated_7ecbe6e4",
						)}
					</p>
				</div>
				{form.errors.field && (
					<p className="text-content-destructive text-sm m-0">
						{form.errors.field}
					</p>
				)}
				<div className="flex flex-row gap-2 justify-between items-start">
					<div className="grid items-center gap-1 w-72">
						<Label className="text-sm" htmlFor={`${id}-idp-role-name`}>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.idp_role_name_9bca2a07",
							)}
						</Label>
						{claimFieldValues ? (
							<Combobox
								open={open}
								onOpenChange={setOpen}
								value={idpRoleName}
								onValueChange={(value) => setIdpRoleName(value ?? "")}
							>
								<ComboboxTrigger asChild>
									<ComboboxButton
										className="w-72"
										selectedOption={
											idpRoleName
												? { label: idpRoleName, value: idpRoleName }
												: undefined
										}
										placeholder={tI18n(
											"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.select_idp_role_386cda47",
										)}
									/>
								</ComboboxTrigger>
								<ComboboxContent className="w-72">
									<ComboboxInput
										value={comboInputValue}
										onValueChange={setComboInputValue}
										placeholder={tI18n(
											"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.search_7f553822",
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
								id={`${id}-idp-role-name`}
								value={idpRoleName}
								className="w-72"
								onChange={(event) => {
									setIdpRoleName(event.target.value);
								}}
							/>
						)}
					</div>
					<div className="grid items-center gap-1 flex-1">
						<Label className="text-sm" htmlFor={`${id}-coder-role`}>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.coder_role_7337dae7",
							)}
						</Label>
						<MultiSelectCombobox
							inputProps={{
								id: `${id}-coder-role`,
							}}
							className="min-w-60 max-w-3xl"
							value={coderRoles}
							onChange={setCoderRoles}
							options={roles.map((role) => ({
								label: role.display_name || role.name,
								value: role.name,
							}))}
							hidePlaceholderWhenSelected
							placeholder={tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.select_role_ba07cd15",
							)}
							emptyIndicator={
								<p className="text-center text-md text-content-primary">
									{tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.all_roles_selected_3f8e4132",
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
							disabled={!idpRoleName || coderRoles.length === 0}
							onClick={() => {
								const newSyncSettings = {
									...form.values,
									mapping: {
										...form.values.mapping,
										[idpRoleName]: coderRoles.map((role) => role.value),
									},
								};
								void form.setFieldValue("mapping", newSyncSettings.mapping);
								form.handleSubmit();
								setIdpRoleName("");
								setCoderRoles([]);
							}}
						>
							<Spinner loading={form.isSubmitting}>
								<PlusIcon />
							</Spinner>
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.add_idp_role_451a5bf8",
							)}
						</Button>
					</div>
				</div>
				{form.errors.mapping && (
					<p className="text-content-destructive text-sm m-0">
						{Object.values(form.errors.mapping || {})}
					</p>
				)}
				<IdpMappingTable type="Role" rowCount={roleMappingCount}>
					{roleSyncSettings?.mapping &&
						Object.entries(roleSyncSettings.mapping)
							.sort(([a], [b]) =>
								a.toLowerCase().localeCompare(b.toLowerCase()),
							)
							.map(([idpRole, roles]) => (
								<RoleRow
									key={idpRole}
									idpRole={idpRole}
									exists={claimFieldValues?.includes(idpRole)}
									coderRoles={roles}
									onDelete={handleDelete}
								/>
							))}
				</IdpMappingTable>
			</fieldset>
		</form>
	);
};

interface RoleRowProps {
	idpRole: string;
	exists: boolean | undefined;
	coderRoles: readonly string[];
	onDelete: (idpOrg: string) => void;
}

const RoleRow: FC<RoleRowProps> = ({
	idpRole,
	exists = true,
	coderRoles,
	onDelete,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<TableRow data-testid={`role-${idpRole}`}>
			<TableCell>
				<div className="flex flex-row items-center gap-2 text-content-primary">
					{idpRole}
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
									"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.this_value_has_not_be_seen_in_the_specified_clai_69d1ded4",
								)}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</TableCell>
			<TableCell>
				<IdpPillList roles={coderRoles} />
			</TableCell>
			<TableCell>
				<Button
					variant="outline"
					size="icon"
					className="text-content-primary"
					aria-label={tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.delete_61975955",
					)}
					onClick={() => onDelete(idpRole)}
				>
					<TrashIcon />
					<span className="sr-only">
						{tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpRoleSyncForm.delete_idp_mapping_8c31481a",
						)}
					</span>
				</Button>
			</TableCell>
		</TableRow>
	);
};
