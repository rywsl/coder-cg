import { cn } from "cn";
import {
	ArrowLeftIcon,
	CopyIcon,
	EllipsisVerticalIcon,
	ShieldIcon,
	TrashIcon,
} from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { Avatar } from "#/components/Avatar/Avatar";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { SettingsHeaderTitle } from "#/components/SettingsHeader/SettingsHeader";
import { Switch } from "#/components/Switch/Switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import type { ProviderState } from "#/modules/aiModels/providerStates";
import { getProviderIcon } from "#/pages/AISettingsPage/ProvidersPage/components/ProviderIcon";
import { useOrganizationModelsPath } from "../organizationModels";

export const ModelFormBackLink: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	const modelsPath = useOrganizationModelsPath();
	return (
		<Link to={modelsPath} className="-ml-3">
			<Button variant="subtle" type="button">
				<ArrowLeftIcon />
				<span>
					{tI18n(
						"AISettingsPage.ModelsPage.components.ModelFormHeader.back_to_models_054f9f84",
					)}
				</span>
			</Button>
		</Link>
	);
};

export const ModelFormHeader: FC<{
	title: string;
	selectedProviderState: ProviderState;
	isEditing: boolean;
	editingModel?: TypesGen.ChatModel;
	onDeleteModel?: (modelId: string) => Promise<void>;
	onDuplicate?: () => void;
	onShareModel?: () => void;
	onToggleEnabled?: (enabled: boolean) => void;
	isSaving: boolean;
	enabledToggleDisabled: boolean;
	onRequestDelete: () => void;
}> = ({
	title,
	selectedProviderState,
	isEditing,
	editingModel,
	onDeleteModel,
	onDuplicate,
	onShareModel,
	onToggleEnabled,
	isSaving,
	enabledToggleDisabled,
	onRequestDelete,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<>
			<div className="flex items-center justify-between">
				<ModelFormBackLink />
				{isEditing &&
					editingModel &&
					(onDeleteModel || onDuplicate || onShareModel) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="subtle"
									size="icon"
									type="button"
									disabled={isSaving}
									aria-label={tI18n(
										"AISettingsPage.ModelsPage.components.ModelFormHeader.model_actions_a18b4b35",
									)}
								>
									<EllipsisVerticalIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{onShareModel && (
									<DropdownMenuItem onClick={onShareModel}>
										<ShieldIcon className="size-icon-sm" />
										{tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormHeader.manage_permissions_2630ba4d",
										)}
									</DropdownMenuItem>
								)}
								{onDuplicate && (
									<DropdownMenuItem onClick={onDuplicate}>
										<CopyIcon className="size-icon-sm" />
										{tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormHeader.duplicate_model_69556f96",
										)}
									</DropdownMenuItem>
								)}
								{onDeleteModel && (onShareModel || onDuplicate) && (
									<DropdownMenuSeparator />
								)}
								{onDeleteModel && (
									<DropdownMenuItem
										className="text-content-destructive focus:text-content-destructive"
										onClick={onRequestDelete}
									>
										<TrashIcon />
										{tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormHeader.delete_9ce78fe3",
										)}
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
			</div>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-4 min-w-0">
					<Avatar
						variant="icon"
						size="lg"
						src={getProviderIcon(selectedProviderState.provider)}
					/>
					<SettingsHeaderTitle>
						<span
							className={cn(
								"block min-w-0 truncate",
								editingModel?.enabled === false && "text-content-secondary",
							)}
						>
							{title}
						</span>
					</SettingsHeaderTitle>
					{isEditing && editingModel?.is_default && (
						<Badge variant="default">
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormHeader.default_21b111cb",
							)}
						</Badge>
					)}
					{isEditing &&
						editingModel &&
						!editingModel.is_default &&
						!editingModel.enabled && (
							<Badge variant="default">
								{tI18n(
									"AISettingsPage.ModelsPage.components.ModelFormHeader.disabled_75081b59",
								)}
							</Badge>
						)}
				</div>
				{isEditing && editingModel && onToggleEnabled && (
					<div className="flex shrink-0 items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex">
									<Switch
										checked={editingModel.enabled}
										onCheckedChange={onToggleEnabled}
										disabled={enabledToggleDisabled}
										aria-label={tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormHeader.model_enabled_d3dcce89",
										)}
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{editingModel.is_default && editingModel.enabled
									? tI18n(
											"AISettingsPage.ModelsPage.components.ModelFormHeader.default_model_cannot_be_disabled_set_another_mod_4d5b4837",
										)
									: editingModel.enabled
										? tI18n(
												"AISettingsPage.ModelsPage.components.ModelFormHeader.disable_this_model_it_will_be_hidden_from_users_70aa0ddf",
											)
										: tI18n(
												"AISettingsPage.ModelsPage.components.ModelFormHeader.enable_this_model_it_will_be_visible_to_users_87e5e785",
											)}
							</TooltipContent>
						</Tooltip>
						<span className="text-sm">
							{tI18n(
								"AISettingsPage.ModelsPage.components.ModelFormHeader.enable_5342e09f",
							)}
						</span>
					</div>
				)}
			</div>
		</>
	);
};
