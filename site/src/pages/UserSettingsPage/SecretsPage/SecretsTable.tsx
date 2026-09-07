import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";
import { type FC, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UserSecret } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
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
import { TableLoader } from "#/components/TableLoader/TableLoader";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { relativeTime } from "#/utils/time";

type SecretsTableProps = {
	secrets?: readonly UserSecret[];
	isLoading: boolean;
	hasLoaded: boolean;
	isDeleting: boolean;
	onAddSecret: (returnFocusElement?: HTMLElement | null) => void;
	onEditSecret: (
		secret: UserSecret,
		returnFocusElement?: HTMLElement | null,
	) => void;
	onDeleteSecret: (secret: UserSecret) => Promise<void> | void;
	onToggleEnabled: (
		secret: UserSecret,
		enabled: boolean,
	) => Promise<void> | void;
};

export const SecretsTable: FC<SecretsTableProps> = ({
	secrets,
	isLoading,
	hasLoaded,
	isDeleting,
	onAddSecret,
	onEditSecret,
	onDeleteSecret,
	onToggleEnabled,
}) => {
	const { t: tI18n } = useTranslation("users");

	const [secretToDelete, setSecretToDelete] = useState<UserSecret>();
	const [togglingSecretId, setTogglingSecretId] = useState<string | null>(null);

	const handleToggle = (secret: UserSecret, enabled: boolean) => {
		setTogglingSecretId(secret.id);
		void Promise.resolve()
			.then(() => onToggleEnabled(secret, enabled))
			.catch(() => {
				// onToggleEnabled reports failures with a toast before rejecting.
				// Swallow the rejection here to avoid an unhandled promise rejection warning.
			})
			.finally(() => {
				setTogglingSecretId((current) =>
					current === secret.id ? null : current,
				);
			});
	};

	return (
		<>
			<DeleteSecretDialog
				secret={secretToDelete}
				isDeleting={isDeleting}
				onCancel={() => setSecretToDelete(undefined)}
				onConfirm={(secret) => {
					void Promise.resolve()
						.then(() => onDeleteSecret(secret))
						.then(() => {
							setSecretToDelete(undefined);
						})
						.catch(() => {
							// onDeleteSecret reports failures with a toast before rejecting.
							// Swallow the rejection here to avoid an unhandled promise rejection warning.
						});
				}}
			/>
			<Table
				aria-label={tI18n(
					"UserSettingsPage.SecretsPage.SecretsTable.user_secrets_26978735",
				)}
			>
				<TableHeader>
					<TableRow>
						<TableHead className="w-9"></TableHead>
						<TableHead>
							{tI18n("UserSettingsPage.SecretsPage.SecretsTable.name_dcd1d522")}
						</TableHead>
						<TableHead>
							{tI18n(
								"UserSettingsPage.SecretsPage.SecretsTable.env_var_a806a90c",
							)}
						</TableHead>
						<TableHead className="whitespace-nowrap">
							{tI18n(
								"UserSettingsPage.SecretsPage.SecretsTable.file_path_2fb6d386",
							)}
						</TableHead>
						<TableHead>
							{tI18n("UserSettingsPage.SecretsPage.SecretsTable.type_baaddf70")}
						</TableHead>
						<TableHead className="w-full">
							{tI18n(
								"UserSettingsPage.SecretsPage.SecretsTable.description_526e0087",
							)}
						</TableHead>
						<TableHead>
							{tI18n(
								"UserSettingsPage.SecretsPage.SecretsTable.updated_3a5ecca1",
							)}
						</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading && <TableLoader />}
					{hasLoaded && !isLoading && (!secrets || secrets.length === 0) && (
						<TableEmpty
							message={tI18n(
								"UserSettingsPage.SecretsPage.SecretsTable.no_secrets_yet_5aa40906",
							)}
							description={tI18n(
								"UserSettingsPage.SecretsPage.SecretsTable.create_a_secret_to_inject_it_into_workspaces_you_efcbd454",
							)}
							cta={
								<Button onClick={(event) => onAddSecret(event.currentTarget)}>
									{tI18n(
										"UserSettingsPage.SecretsPage.SecretsTable.add_secret_f57a23c6",
									)}
								</Button>
							}
						/>
					)}
					{!isLoading &&
						secrets?.map((secret) => (
							<TableRow key={secret.id}>
								<TableCell>
									<EnabledToggle
										secret={secret}
										isPending={togglingSecretId === secret.id}
										onToggle={handleToggle}
									/>
								</TableCell>
								<TableCell className="font-semibold text-content-primary">
									<span>{secret.name}</span>
								</TableCell>
								<TableCell>
									<OptionalSecretValue value={secret.env_name} />
								</TableCell>
								<TableCell>
									<OptionalSecretValue value={secret.file_path} />
								</TableCell>
								<TableCell>
									<SecretTypeBadge secret={secret} />
								</TableCell>
								<TableCell className="max-w-0">
									{secret.description ? (
										<span className="block truncate" title={secret.description}>
											{secret.description}
										</span>
									) : (
										<span className="text-content-disabled">
											{tI18n(
												"UserSettingsPage.SecretsPage.SecretsTable.no_description_bcd8cc53",
											)}
										</span>
									)}
								</TableCell>
								<TableCell data-pixel="ignore" className="whitespace-nowrap">
									{relativeTime(secret.updated_at)}
								</TableCell>
								<TableCell>
									<div className="flex justify-end flex-1">
										<SecretRowActions
											secret={secret}
											onEditSecret={onEditSecret}
											onDeleteSecret={setSecretToDelete}
										/>
									</div>
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
		</>
	);
};

const OptionalSecretValue: FC<{ value?: string; fallback?: string }> = ({
	value,
	fallback = "Not set",
}) => {
	if (value) {
		return value;
	}

	return <span className="text-content-disabled">{fallback}</span>;
};

const SecretTypeBadge: FC<{ secret: UserSecret }> = ({ secret }) => {
	const { t: tI18n } = useTranslation("users");

	const hasEnv = Boolean(secret.env_name);
	const hasFile = Boolean(secret.file_path);

	if (hasEnv && hasFile) {
		return (
			<Badge>
				{tI18n(
					"UserSettingsPage.SecretsPage.SecretsTable.env_var_file_448cf068",
				)}
			</Badge>
		);
	}

	if (hasEnv) {
		return (
			<Badge>
				{tI18n("UserSettingsPage.SecretsPage.SecretsTable.env_var_7fcabcd7")}
			</Badge>
		);
	}

	if (hasFile) {
		return (
			<Badge>
				{tI18n("UserSettingsPage.SecretsPage.SecretsTable.file_3b9c358f")}
			</Badge>
		);
	}

	return (
		<Badge>
			{tI18n("UserSettingsPage.SecretsPage.SecretsTable.not_injected_72d29aa1")}
		</Badge>
	);
};

type EnabledToggleProps = {
	secret: UserSecret;
	isPending: boolean;
	onToggle: (secret: UserSecret, enabled: boolean) => void;
};

const EnabledToggle: FC<EnabledToggleProps> = ({
	secret,
	isPending,
	onToggle,
}) => {
	const { t: tI18n } = useTranslation("users");

	const hasTarget = Boolean(secret.env_name) || Boolean(secret.file_path);
	// An enabled secret must have at least one injection target. Prevent
	// enabling a target-less secret; the user must add a target first.
	const cannotEnable = !secret.enabled && !hasTarget;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				{/*
				 * Wrap the disabled Switch in a focusable span so the
				 * tooltip can be triggered by keyboard and pointer.
				 * biome-ignore lint/a11y/noNoninteractiveTabindex: needed to
				 * surface the tooltip on a disabled control via keyboard focus.
				 */}
				<span tabIndex={0} className="inline-flex">
					<Switch
						aria-label={tI18n(
							"UserSettingsPage.SecretsPage.SecretsTable.toggle_secret_value0_5208b2bb",
							{
								value0: secret.name,
							},
						)}
						checked={secret.enabled}
						disabled={isPending || cannotEnable}
						onCheckedChange={(checked) => onToggle(secret, checked)}
					/>
				</span>
			</TooltipTrigger>
			{cannotEnable && (
				<TooltipContent side="top">
					{tI18n(
						"UserSettingsPage.SecretsPage.SecretsTable.add_an_environment_variable_or_file_path_before__38f59ca6",
					)}
				</TooltipContent>
			)}
		</Tooltip>
	);
};

type SecretRowActionsProps = {
	secret: UserSecret;
	onEditSecret: (
		secret: UserSecret,
		returnFocusElement?: HTMLElement | null,
	) => void;
	onDeleteSecret: (secret: UserSecret) => void;
};

const SecretRowActions: FC<SecretRowActionsProps> = ({
	secret,
	onEditSecret,
	onDeleteSecret,
}) => {
	const { t: tI18n } = useTranslation("users");

	const label = tI18n(
		"UserSettingsPage.SecretsPage.SecretsTable.open_secret_actions_for_value0_0eb109b4",
		{
			value0: secret.name,
		},
	);
	const triggerRef = useRef<HTMLButtonElement>(null);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					ref={triggerRef}
					size="icon"
					variant="subtle"
					aria-label={label}
				>
					<EllipsisVerticalIcon aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onSelect={() => onEditSecret(secret, triggerRef.current)}
				>
					<PencilIcon className="size-icon-xs" />
					{tI18n(
						"UserSettingsPage.SecretsPage.SecretsTable.edit_secret_b5068d24",
					)}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-content-destructive focus:text-content-destructive"
					onSelect={() => onDeleteSecret(secret)}
				>
					<TrashIcon className="size-icon-xs" />
					{tI18n("UserSettingsPage.SecretsPage.SecretsTable.delete_e2d0a549")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

type DeleteSecretDialogProps = {
	secret?: UserSecret;
	isDeleting: boolean;
	onCancel: () => void;
	onConfirm: (secret: UserSecret) => void;
};

const DeleteSecretDialog: FC<DeleteSecretDialogProps> = ({
	secret,
	isDeleting,
	onCancel,
	onConfirm,
}) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<ConfirmDialog
			type="delete"
			open={Boolean(secret)}
			confirmLoading={isDeleting}
			title={tI18n(
				"UserSettingsPage.SecretsPage.SecretsTable.delete_secret_1a48c8c8",
			)}
			description={
				<p>
					{tI18n("UserSettingsPage.SecretsPage.SecretsTable.deleting_8c4133b4")}
					<strong>{secret?.name}</strong>
					{tI18n(
						"UserSettingsPage.SecretsPage.SecretsTable.is_irreversible_workspaces_that_depend_on_this_s_11c78669",
					)}
				</p>
			}
			onClose={() => {
				if (!isDeleting) {
					onCancel();
				}
			}}
			onConfirm={() => {
				if (secret) {
					onConfirm(secret);
				}
			}}
		/>
	);
};
