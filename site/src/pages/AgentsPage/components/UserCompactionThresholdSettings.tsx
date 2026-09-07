import { cn } from "cn";
import { RotateCcwIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "#/api/errors";
import type * as TypesGen from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { Input } from "#/components/Input/Input";
import {
	getOrganizationLabel,
	OrganizationAutocomplete,
} from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import {
	TemporarySavedState,
	useTemporarySavedState,
} from "#/components/TemporarySavedState/TemporarySavedState";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { formatProviderLabel } from "#/utils/aiProviders";
import { ProviderIcon } from "./ChatModelAdminPanel/ProviderIcon";

interface UserCompactionThresholdSettingsProps {
	models: readonly TypesGen.ChatModel[];
	providerTypeByID: ReadonlyMap<string, string>;
	organizations: readonly TypesGen.Organization[];
	modelsError?: unknown;
	isLoadingModels?: boolean;
	thresholds: readonly TypesGen.UserChatCompactionThreshold[] | undefined;
	isThresholdsLoading: boolean;
	thresholdsError: unknown;
	onSaveThreshold: (
		modelId: string,
		thresholdPercent: number,
	) => Promise<unknown>;
	onResetThreshold: (modelId: string) => Promise<unknown>;
}

const parseThresholdDraft = (value: string): number | null => {
	const trimmedValue = value.trim();
	if (!/^\d+$/.test(trimmedValue)) {
		return null;
	}

	const parsedValue = Number(trimmedValue);
	if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > 100) {
		return null;
	}

	return parsedValue;
};

const ContextCompactionHeader: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div className="flex flex-col gap-2">
			<h3 className="m-0 text-sm font-semibold text-content-primary">
				{tI18n(
					"AgentsPage.components.UserCompactionThresholdSettings.context_compaction_3820cab0",
				)}
			</h3>
			<p className="mt-0.5! m-0 text-xs text-content-secondary">
				{tI18n(
					"AgentsPage.components.UserCompactionThresholdSettings.control_when_conversation_context_is_automatical_0115f7a0",
				)}
			</p>
		</div>
	);
};

export const UserCompactionThresholdSettings: FC<
	UserCompactionThresholdSettingsProps
> = ({
	models,
	providerTypeByID,
	organizations,
	modelsError,
	isLoadingModels,
	thresholds,
	isThresholdsLoading,
	thresholdsError,
	onSaveThreshold,
	onResetThreshold,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
	const [pendingModels, setPendingModels] = useState<Set<string>>(new Set());
	const [selectedOrganizationID, setSelectedOrganizationID] = useState<
		string | null
	>(null);
	const { isSavedVisible, showSavedState } = useTemporarySavedState();

	const enabledModels = models.filter((config) => config.enabled);
	const organizationNameByID = new Map(
		organizations.map((organization) => [
			organization.id,
			organization.display_name || organization.name,
		]),
	);
	const organizationOptions = organizations.filter((organization) =>
		enabledModels.some((config) => config.organization_id === organization.id),
	);
	const activeOrganization =
		organizationOptions.find(
			(organization) => organization.id === selectedOrganizationID,
		) ??
		organizationOptions.find((organization) => organization.is_default) ??
		organizationOptions[0];
	const visibleModels = activeOrganization
		? enabledModels.filter(
				(config) => config.organization_id === activeOrganization.id,
			)
		: enabledModels;
	const overridesByModelID = new Map(
		(thresholds ?? []).map(
			(threshold: TypesGen.UserChatCompactionThreshold) => [
				threshold.model_config_id,
				threshold.threshold_percent,
			],
		),
	);

	const clearDraft = (modelID: string) => {
		setDrafts((currentDrafts) => {
			const nextDrafts = { ...currentDrafts };
			delete nextDrafts[modelID];
			return nextDrafts;
		});
	};

	const clearRowError = (modelID: string) => {
		setRowErrors((currentErrors) => {
			if (!(modelID in currentErrors)) {
				return currentErrors;
			}
			const nextErrors = { ...currentErrors };
			delete nextErrors[modelID];
			return nextErrors;
		});
	};

	const addPending = (id: string) => {
		setPendingModels((pending) => new Set(pending).add(id));
	};

	const removePending = (id: string) => {
		setPendingModels((pending) => {
			const next = new Set(pending);
			next.delete(id);
			return next;
		});
	};

	const handleReset = (modelId: string) => {
		clearRowError(modelId);
		addPending(modelId);
		onResetThreshold(modelId)
			.then(() => {
				clearDraft(modelId);
				clearRowError(modelId);
			})
			.catch((error: unknown) => {
				setRowErrors((currentErrors) => ({
					...currentErrors,
					[modelId]: getErrorMessage(
						error,
						tI18n(
							"AgentsPage.components.UserCompactionThresholdSettings.failed_to_reset_compaction_threshold_8864c2eb",
						),
					),
				}));
			})
			.finally(() => {
				removePending(modelId);
			});
	};

	// Save/cancel act only on visible rows; drafts hidden by the org
	// picker are kept untouched.
	const visibleModelIDs = new Set(visibleModels.map((config) => config.id));
	const dirtyRows: Array<{ modelId: string; value: number }> = [];
	for (const modelConfig of visibleModels) {
		const draft = drafts[modelConfig.id];
		if (draft === undefined) continue;
		const parsed = parseThresholdDraft(draft);
		if (parsed === null) continue;
		const existingOverride = overridesByModelID.get(modelConfig.id);
		if (parsed === existingOverride) continue;
		dirtyRows.push({ modelId: modelConfig.id, value: parsed });
	}

	const handleSaveAll = () => {
		const saves = dirtyRows.map(({ modelId, value }) => {
			clearRowError(modelId);
			addPending(modelId);
			return onSaveThreshold(modelId, value)
				.then(() => {
					clearDraft(modelId);
					clearRowError(modelId);
					return true;
				})
				.catch((error: unknown) => {
					setRowErrors((currentErrors) => ({
						...currentErrors,
						[modelId]: getErrorMessage(
							error,
							tI18n(
								"AgentsPage.components.UserCompactionThresholdSettings.failed_to_save_compaction_threshold_ee34a505",
							),
						),
					}));
					return false;
				})
				.finally(() => {
					removePending(modelId);
				});
		});
		void Promise.all(saves).then((results) => {
			if (results.length > 0 && results.every(Boolean)) {
				showSavedState();
			}
		});
	};

	const handleCancelAll = () => {
		setDrafts((currentDrafts) =>
			Object.fromEntries(
				Object.entries(currentDrafts).filter(
					([modelID]) => !visibleModelIDs.has(modelID),
				),
			),
		);
		setRowErrors((currentErrors) =>
			Object.fromEntries(
				Object.entries(currentErrors).filter(
					([modelID]) => !visibleModelIDs.has(modelID),
				),
			),
		);
	};

	const hasAnyPending = [...pendingModels].some((modelID) =>
		visibleModelIDs.has(modelID),
	);
	const hasAnyErrors = Object.keys(rowErrors).some((modelID) =>
		visibleModelIDs.has(modelID),
	);
	const hasAnyDrafts = Object.keys(drafts).some((modelID) =>
		visibleModelIDs.has(modelID),
	);
	const shouldShowActions =
		hasAnyDrafts || hasAnyErrors || hasAnyPending || dirtyRows.length > 0;

	if (isThresholdsLoading) {
		return (
			<div className="flex flex-col gap-2">
				<ContextCompactionHeader />
				<div className="flex items-center gap-2 text-sm text-content-secondary">
					<Spinner loading className="size-4" />
					{tI18n(
						"AgentsPage.components.UserCompactionThresholdSettings.loading_thresholds_951c3934",
					)}
				</div>
			</div>
		);
	}

	if (thresholdsError != null) {
		return (
			<div className="flex flex-col gap-2">
				<ContextCompactionHeader />
				<p className="m-0 text-xs text-content-destructive">
					{getErrorMessage(
						thresholdsError,
						tI18n(
							"AgentsPage.components.UserCompactionThresholdSettings.failed_to_load_compaction_thresholds_908a5fb9",
						),
					)}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<ContextCompactionHeader />
			{isLoadingModels ? (
				<div className="flex items-center gap-2 text-sm text-content-secondary">
					<Spinner loading className="size-4" />
					{tI18n(
						"AgentsPage.components.UserCompactionThresholdSettings.loading_models_80243524",
					)}
				</div>
			) : modelsError && enabledModels.length === 0 ? (
				<p className="m-0 text-xs text-content-destructive">
					{getErrorMessage(
						modelsError,
						tI18n(
							"AgentsPage.components.UserCompactionThresholdSettings.failed_to_load_model_configurations_077c236c",
						),
					)}
				</p>
			) : enabledModels.length === 0 ? (
				<p className="m-0 text-xs text-content-secondary">
					{tI18n(
						"AgentsPage.components.UserCompactionThresholdSettings.no_enabled_chat_models_available_an_administrato_792aa6a5",
					)}
				</p>
			) : (
				<>
					{modelsError && (
						<p className="m-0 text-xs text-content-destructive">
							{getErrorMessage(
								modelsError,
								tI18n(
									"AgentsPage.components.UserCompactionThresholdSettings.some_organization_models_could_not_be_loaded_00aac8f9",
								),
							)}
						</p>
					)}
					{organizationOptions.length > 1 && activeOrganization && (
						<div>
							<OrganizationAutocomplete
								value={activeOrganization}
								ariaLabel={tI18n(
									"AgentsPage.components.UserCompactionThresholdSettings.organization_value0_792b6bda",
									{
										value0: getOrganizationLabel(
											activeOrganization,
											organizationOptions,
										),
									},
								)}
								options={organizationOptions}
								triggerClassName="w-60"
								optionsTabbable
								onChange={(organization) => {
									if (!organization) {
										return;
									}
									setSelectedOrganizationID(organization.id);
								}}
							/>
						</div>
					)}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-content-secondary">
									{tI18n(
										"AgentsPage.components.UserCompactionThresholdSettings.model_5e2c614c",
									)}
								</TableHead>
								<TableHead className="w-0 whitespace-nowrap">
									{tI18n(
										"AgentsPage.components.UserCompactionThresholdSettings.default_21b111cb",
									)}
								</TableHead>
								<TableHead className="w-0 whitespace-nowrap">
									{tI18n(
										"AgentsPage.components.UserCompactionThresholdSettings.threshold_0da627ad",
									)}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleModels.map((modelConfig) => {
								const existingOverride = overridesByModelID.get(modelConfig.id);
								const hasOverride = overridesByModelID.has(modelConfig.id);
								const draftValue =
									drafts[modelConfig.id] ??
									(existingOverride !== undefined
										? String(existingOverride)
										: "");
								const parsedDraftValue = parseThresholdDraft(draftValue);
								const isThisModelMutating = pendingModels.has(modelConfig.id);
								const isInvalid =
									draftValue.length > 0 && parsedDraftValue === null;
								// Only warn when user-typed, not when loaded from
								// the server.
								const isDraftDisablingCompaction =
									draftValue === "100" && drafts[modelConfig.id] !== undefined;
								const rowError = rowErrors[modelConfig.id];
								const modelName = modelConfig.display_name || modelConfig.model;
								const provider =
									providerTypeByID.get(modelConfig.ai_provider_id) ?? "";
								const providerLabel = formatProviderLabel(provider);
								const organizationName =
									organizationNameByID.get(modelConfig.organization_id) ??
									modelConfig.organization_id;

								return (
									<TableRow key={modelConfig.id}>
										<TableCell className="text-sm font-medium text-content-primary">
											<Badge
												size="md"
												variant="default"
												className="w-fit"
												aria-label={tI18n(
													"AgentsPage.components.UserCompactionThresholdSettings.value0_value1_in_value2_902103f5",
													{
														value0: providerLabel,
														value1: modelName,
														value2: organizationName,
													},
												)}
											>
												<ProviderIcon provider={provider} className="size-4" />
												{modelName}
											</Badge>
											{rowError && (
												<p
													aria-live="polite"
													className="m-0 mt-0.5 text-2xs font-normal text-content-destructive"
												>
													{rowError}
												</p>
											)}
										</TableCell>
										<TableCell className="w-0 whitespace-nowrap tabular-nums">
											{modelConfig.compression_threshold}%
										</TableCell>
										<TableCell className="w-0 whitespace-nowrap">
											<div className="flex items-center gap-1.5">
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="relative">
															<Input
																aria-label={tI18n(
																	"AgentsPage.components.UserCompactionThresholdSettings.value0_compaction_threshold_for_value1_67119695",
																	{
																		value0: modelName,
																		value1: organizationName,
																	},
																)}
																aria-invalid={isInvalid || undefined}
																type="text"
																min={0}
																max={100}
																maxLength={3}
																inputMode="numeric"
																className={cn(
																	"h-7 w-16 px-2 pr-5 text-xs tabular-nums",
																	isInvalid &&
																		"border-content-destructive focus:ring-content-destructive/30",
																)}
																value={draftValue}
																placeholder={String(
																	modelConfig.compression_threshold,
																)}
																onChange={(event) => {
																	setDrafts((currentDrafts) => ({
																		...currentDrafts,
																		[modelConfig.id]: event.target.value,
																	}));
																	clearRowError(modelConfig.id);
																}}
																disabled={isThisModelMutating}
															/>
															<span
																aria-hidden="true"
																className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-content-secondary"
															>
																%
															</span>
														</div>
													</TooltipTrigger>
													{(isInvalid || isDraftDisablingCompaction) && (
														<TooltipContent>
															{isInvalid
																? tI18n(
																		"AgentsPage.components.UserCompactionThresholdSettings.enter_a_whole_number_between_0_and_100_a2756ca1",
																	)
																: tI18n(
																		"AgentsPage.components.UserCompactionThresholdSettings.setting_100_will_disable_auto_compaction_for_thi_e318ed46",
																	)}
														</TooltipContent>
													)}
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="icon"
															variant="subtle"
															className={cn(
																"size-7",
																hasOverride
																	? "opacity-100"
																	: "pointer-events-none opacity-0",
															)}
															aria-label={tI18n(
																"AgentsPage.components.UserCompactionThresholdSettings.reset_value0_for_value1_to_default_cfcb8e99",
																{
																	value0: modelName,
																	value1: organizationName,
																},
															)}
															aria-hidden={!hasOverride}
															tabIndex={hasOverride ? 0 : -1}
															disabled={isThisModelMutating || !hasOverride}
															onClick={() => handleReset(modelConfig.id)}
														>
															<RotateCcwIcon className="size-3.5" />
														</Button>
													</TooltipTrigger>
													{hasOverride && (
														<TooltipContent>
															{tI18n(
																"AgentsPage.components.UserCompactionThresholdSettings.reset_to_default_590783da",
															)}
															{modelConfig.compression_threshold}%)
														</TooltipContent>
													)}
												</Tooltip>
											</div>
											{isInvalid && (
												<span className="sr-only" aria-live="polite">
													{tI18n(
														"AgentsPage.components.UserCompactionThresholdSettings.enter_a_whole_number_between_0_and_100_a2756ca1",
													)}
												</span>
											)}
											{isDraftDisablingCompaction && (
												<span className="sr-only" aria-live="polite">
													{tI18n(
														"AgentsPage.components.UserCompactionThresholdSettings.setting_100_will_disable_auto_compaction_for_thi_e318ed46",
													)}
												</span>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
						<TableFooter className="bg-transparent">
							<TableRow className="border-0">
								<TableCell colSpan={3} className="border-0 p-0">
									<div className="mt-2 flex h-6 items-center justify-end gap-2 px-3">
										{isSavedVisible ? (
											<TemporarySavedState />
										) : (
											shouldShowActions && (
												<>
													<Button
														size="xs"
														variant="outline"
														type="button"
														onClick={handleCancelAll}
														disabled={hasAnyPending}
													>
														{tI18n(
															"AgentsPage.components.UserCompactionThresholdSettings.cancel_19766ed6",
														)}
													</Button>
													{dirtyRows.length > 0 && (
														<Button
															size="xs"
															type="button"
															className="h-6"
															disabled={hasAnyPending}
															onClick={handleSaveAll}
														>
															{hasAnyPending && <Spinner loading size="sm" />}
															{hasAnyPending
																? tI18n(
																		"AgentsPage.components.UserCompactionThresholdSettings.saving_dc85af8f",
																	)
																: tI18n(
																		"AgentsPage.components.UserCompactionThresholdSettings.save_value0_value1_68b393da",
																		{
																			value0: dirtyRows.length,
																			value1:
																				dirtyRows.length === 1
																					? tI18n(
																							"AgentsPage.components.UserCompactionThresholdSettings.change_12ea12ea",
																						)
																					: tI18n(
																							"AgentsPage.components.UserCompactionThresholdSettings.changes_d0b4ba23",
																						),
																		},
																	)}
														</Button>
													)}
												</>
											)
										)}
									</div>
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</>
			)}
		</div>
	);
};
