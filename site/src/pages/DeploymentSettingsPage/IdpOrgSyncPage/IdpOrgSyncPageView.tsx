import { useFormik } from "formik";
import { PlusIcon, TrashIcon, TriangleAlertIcon } from "lucide-react";
import { type FC, type KeyboardEventHandler, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import type {
	Organization,
	OrganizationSyncSettings,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import {
	HelpPopover,
	HelpPopoverContent,
	HelpPopoverIconTrigger,
	HelpPopoverText,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { i18n } from "#/i18n";
import { docs } from "#/utils/docs";
import { isUUID } from "#/utils/uuid";
import { OrganizationPills } from "./OrganizationPills";

interface IdpSyncPageViewProps {
	organizationSyncSettings: OrganizationSyncSettings | undefined;
	claimFieldValues: readonly string[] | undefined;
	organizations: readonly Organization[];
	onSubmit: (data: OrganizationSyncSettings) => void;
	onSyncFieldChange: (value: string) => void;
	error?: unknown;
}

const validationSchema = Yup.object({
	field: Yup.string().trim(),
	organization_assign_default: Yup.boolean(),
	mapping: Yup.object()
		.test(
			"valid-mapping",
			i18n.t(
				"administration:DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.invalid_organization_sync_settings_mapping_struc_b6ce4a8b",
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

export const IdpOrgSyncPageView: FC<IdpSyncPageViewProps> = ({
	organizationSyncSettings,
	claimFieldValues,
	organizations,
	onSubmit,
	onSyncFieldChange,
	error,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const form = useFormik<OrganizationSyncSettings>({
		initialValues: {
			field: organizationSyncSettings?.field ?? "",
			organization_assign_default:
				organizationSyncSettings?.organization_assign_default ?? true,
			mapping: organizationSyncSettings?.mapping ?? {},
		},
		validationSchema: validationSchema,
		onSubmit,
		enableReinitialize: Boolean(organizationSyncSettings),
	});
	const [coderOrgs, setCoderOrgs] = useState<Option[]>([]);
	const [idpOrgName, setIdpOrgName] = useState("");
	const [inputValue, setInputValue] = useState("");
	const organizationMappingCount = form.values.mapping
		? Object.entries(form.values.mapping).length
		: 0;
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const id = useId();
	const [open, setOpen] = useState(false);

	const getOrgNames = (orgIds: readonly string[]) => {
		return orgIds.map(
			(orgId) =>
				organizations.find((org) => org.id === orgId)?.display_name || orgId,
		);
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
			inputValue &&
			!claimFieldValues?.some((value) => value === inputValue.toLowerCase())
		) {
			event.preventDefault();
			setIdpOrgName(inputValue);
			setInputValue("");
			setOpen(false);
		}
	};

	return (
		<div className="flex flex-col gap-2">
			{Boolean(error) && <ErrorAlert error={error} />}
			<form onSubmit={form.handleSubmit}>
				<fieldset disabled={form.isSubmitting} className="border-none">
					<div className="flex flex-row">
						<div className="grid items-center gap-1">
							<Label className="text-sm" htmlFor={`${id}-sync-field`}>
								{tI18n(
									"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.organization_sync_field_2df93b43",
								)}
							</Label>
							<div className="flex flex-row items-center gap-5">
								<div className="flex flex-row gap-2 w-72">
									<Input
										id={`${id}-sync-field`}
										value={form.values.field}
										onChange={(event) => {
											void form.setFieldValue("field", event.target.value);
											onSyncFieldChange(event.target.value);
										}}
									/>
									<Button
										className="w-20"
										type="submit"
										disabled={form.isSubmitting || !form.dirty}
										onClick={(event) => {
											event.preventDefault();
											form.handleSubmit();
										}}
									>
										<Spinner loading={form.isSubmitting} />
										{tI18n(
											"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.save_1509f561",
										)}
									</Button>
								</div>
								<div className="flex flex-row items-center gap-3">
									<Switch
										id={`${id}-assign-default-org`}
										checked={form.values.organization_assign_default}
										onCheckedChange={(checked) => {
											if (!checked) {
												setIsDialogOpen(true);
											} else {
												void form.setFieldValue(
													"organization_assign_default",
													checked,
												);
												form.handleSubmit();
											}
										}}
									/>
									<span className="flex flex-row items-center gap-1">
										<Label htmlFor={`${id}-assign-default-org`}>
											{tI18n(
												"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.assign_default_organization_d4baa3b1",
											)}
										</Label>
										<AssignDefaultOrgHelpPopover />
									</span>
								</div>
							</div>
							<p className="text-content-secondary text-2xs m-0">
								{tI18n(
									"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.if_empty_organization_sync_is_deactivated_1161aa41",
								)}
							</p>
						</div>
					</div>
					{form.errors.field && (
						<p className="text-content-destructive text-sm m-0">
							{form.errors.field}
						</p>
					)}
					<div className="flex flex-col gap-7">
						<div className="flex flex-row pt-8 gap-2 justify-between items-start">
							<div className="grid items-center gap-1 w-72">
								<Label className="text-sm" htmlFor={`${id}-idp-org-name`}>
									{tI18n(
										"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.idp_organization_name_e19519db",
									)}
								</Label>

								{claimFieldValues ? (
									<Combobox
										open={open}
										onOpenChange={setOpen}
										value={idpOrgName}
										onValueChange={(value) => setIdpOrgName(value ?? "")}
									>
										<ComboboxTrigger asChild>
											<ComboboxButton
												className="w-72"
												selectedOption={
													idpOrgName
														? { label: idpOrgName, value: idpOrgName }
														: undefined
												}
												placeholder={tI18n(
													"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.select_idp_organization_9aab89f9",
												)}
											/>
										</ComboboxTrigger>
										<ComboboxContent className="w-72">
											<ComboboxInput
												value={inputValue}
												onValueChange={setInputValue}
												placeholder={tI18n(
													"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.search_7f553822",
												)}
												onKeyDown={handleKeyDown}
											/>
											<ComboboxList>
												{claimFieldValues
													.filter((value) =>
														value
															.toLowerCase()
															.includes(inputValue.toLowerCase()),
													)
													.map((value) => (
														<ComboboxItem
															key={value}
															value={value}
															onSelect={() => setInputValue("")}
														>
															{value}
														</ComboboxItem>
													))}
											</ComboboxList>
										</ComboboxContent>
									</Combobox>
								) : (
									<Input
										id={`${id}-idp-org-name`}
										value={idpOrgName}
										className="w-72"
										onChange={(event) => {
											setIdpOrgName(event.target.value);
										}}
									/>
								)}
							</div>
							<div className="grid items-center gap-1 flex-1">
								<Label className="text-sm" htmlFor={`${id}-coder-org`}>
									{tI18n(
										"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.coder_organization_f877cf32",
									)}
								</Label>
								<MultiSelectCombobox
									inputProps={{
										id: `${id}-coder-org`,
									}}
									className="min-w-60 max-w-3xl"
									value={coderOrgs}
									onChange={setCoderOrgs}
									options={organizations.map((org) => ({
										label: org.display_name,
										value: org.id,
									}))}
									hidePlaceholderWhenSelected
									placeholder={tI18n(
										"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.select_organization_99e5009d",
									)}
									emptyIndicator={
										<p className="text-center text-md text-content-primary">
											{tI18n(
												"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.no_organizations_found_538995db",
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
									disabled={!idpOrgName || coderOrgs.length === 0}
									onClick={async () => {
										const newSyncSettings = {
											...form.values,
											mapping: {
												...form.values.mapping,
												[idpOrgName]: coderOrgs.map((org) => org.value),
											},
										};
										void form.setFieldValue("mapping", newSyncSettings.mapping);
										form.handleSubmit();
										setIdpOrgName("");
										setCoderOrgs([]);
									}}
								>
									<Spinner loading={form.isSubmitting}>
										<PlusIcon />
									</Spinner>
									{tI18n(
										"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.add_idp_organization_7173680e",
									)}
								</Button>
							</div>
						</div>
						{form.errors.mapping && (
							<p className="text-content-destructive text-sm m-0">
								{Object.values(form.errors.mapping || {})}
							</p>
						)}
						<IdpMappingTable isEmpty={organizationMappingCount === 0}>
							{form.values.mapping &&
								Object.entries(form.values.mapping)
									.sort(([a], [b]) =>
										a.toLowerCase().localeCompare(b.toLowerCase()),
									)
									.map(([idpOrg, organizations]) => (
										<OrganizationRow
											key={idpOrg}
											idpOrg={idpOrg}
											coderOrgs={getOrgNames(organizations)}
											onDelete={handleDelete}
											exists={claimFieldValues?.includes(idpOrg)}
										/>
									))}
						</IdpMappingTable>
					</div>
				</fieldset>
			</form>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="flex flex-col gap-12 max-w-lg">
					<DialogHeader className="flex flex-col gap-4">
						<DialogTitle>
							{tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.switch_off_default_organization_assignment_7860a8c1",
							)}
						</DialogTitle>
						<DialogDescription>
							{tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.warning_this_will_remove_all_users_from_the_defa_e95b8e7f",
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex flex-row">
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							{tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.cancel_19766ed6",
							)}
						</Button>
						<Button
							onClick={() => {
								void form.setFieldValue("organization_assign_default", false);
								setIsDialogOpen(false);
								form.handleSubmit();
							}}
							type="submit"
						>
							<Spinner loading={form.isSubmitting} />
							{tI18n(
								"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.confirm_eebdd24a",
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

interface IdpMappingTableProps {
	isEmpty: boolean;
	children: React.ReactNode;
}

const IdpMappingTable: FC<IdpMappingTableProps> = ({ isEmpty, children }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-2/5">
						{tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.idp_organization_0b952944",
						)}
					</TableHead>
					<TableHead className="w-3/5">
						{tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.coder_organization_f877cf32",
						)}
					</TableHead>
					<TableHead className="w-auto" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{isEmpty ? (
					<TableEmpty
						message={tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.no_organization_mappings_f3622fd9",
						)}
						isCompact
						cta={
							<Link href={docs("/admin/users/idp-sync#organization-sync")}>
								{tI18n(
									"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.how_to_set_up_idp_organization_sync_f1de16e2",
								)}
							</Link>
						}
					/>
				) : (
					children
				)}
			</TableBody>
		</Table>
	);
};

interface OrganizationRowProps {
	idpOrg: string;
	exists: boolean | undefined;
	coderOrgs: readonly string[];
	onDelete: (idpOrg: string) => void;
}

const OrganizationRow: FC<OrganizationRowProps> = ({
	idpOrg,
	exists = true,
	coderOrgs,
	onDelete,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<TableRow data-testid={`idp-org-${idpOrg}`}>
			<TableCell>
				<div className="flex flex-row items-center gap-2 text-content-primary">
					{idpOrg}
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
									"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.this_value_has_not_be_seen_in_the_specified_clai_69d1ded4",
								)}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</TableCell>
			<TableCell>
				<OrganizationPills organizations={coderOrgs} />
			</TableCell>
			<TableCell>
				<Button
					variant="outline"
					size="icon"
					className="text-content-primary"
					aria-label={tI18n(
						"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.delete_61975955",
					)}
					onClick={() => onDelete(idpOrg)}
				>
					<TrashIcon />
					<span className="sr-only">
						{tI18n(
							"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.delete_idp_mapping_8c31481a",
						)}
					</span>
				</Button>
			</TableCell>
		</TableRow>
	);
};

const AssignDefaultOrgHelpPopover: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<HelpPopover>
			<HelpPopoverIconTrigger />
			<HelpPopoverContent>
				<HelpPopoverText>
					{tI18n(
						"DeploymentSettingsPage.IdpOrgSyncPage.IdpOrgSyncPageView.disabling_will_remove_all_users_from_the_default_6bed71ea",
					)}
				</HelpPopoverText>
			</HelpPopoverContent>
		</HelpPopover>
	);
};
