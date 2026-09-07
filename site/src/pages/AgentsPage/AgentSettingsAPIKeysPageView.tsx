import type { FC, FormEvent } from "react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChatModel, UserChatProviderConfig } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "#/components/EmptyState/EmptyState";
import { Input } from "#/components/Input/Input";
import { Loader } from "#/components/Loader/Loader";
import { i18n } from "#/i18n";
import { passwordManagerIgnoreProps } from "#/utils/formUtils";
import { SectionHeader } from "./components/SectionHeader";

const API_KEY_PLACEHOLDER = "••••••••••••••••";

type ProviderStatus = {
	label: string;
	variant: "default" | "green" | "warning";
	note?: string;
};

const getProviderStatus = (
	provider: UserChatProviderConfig,
): ProviderStatus => {
	if (!provider.byok_enabled) {
		return {
			label: i18n.t(
				"agents:AgentsPage.AgentSettingsAPIKeysPageView.user_keys_disabled_fcffb3cd",
			),
			variant: "default",
			note: i18n.t(
				"agents:AgentsPage.AgentSettingsAPIKeysPageView.personal_api_keys_are_disabled_by_your_admin_0d1580d5",
			),
		};
	}

	if (provider.has_user_api_key) {
		return {
			label: i18n.t(
				"agents:AgentsPage.AgentSettingsAPIKeysPageView.key_saved_a45a97cb",
			),
			variant: "green",
		};
	}

	if (provider.has_central_api_key_fallback) {
		return {
			label: i18n.t(
				"agents:AgentsPage.AgentSettingsAPIKeysPageView.shared_key_cd0ab13a",
			),
			variant: "default",
			note: i18n.t(
				"agents:AgentsPage.AgentSettingsAPIKeysPageView.the_shared_deployment_key_is_being_used_add_a_pe_18173e30",
			),
		};
	}

	return {
		label: i18n.t(
			"agents:AgentsPage.AgentSettingsAPIKeysPageView.no_key_e867868d",
		),
		variant: "warning",
		note: i18n.t(
			"agents:AgentsPage.AgentSettingsAPIKeysPageView.you_must_add_a_personal_api_key_to_use_this_prov_1e680364",
		),
	};
};

interface ProviderKeyPanelProps {
	provider: UserChatProviderConfig;
	models: readonly ChatModel[];
	isModelsLoading: boolean;
	areModelsUnavailable: boolean;
	isSaving: boolean;
	isRemoving: boolean;
	onSave: (providerConfigId: string, apiKey: string) => void;
	onRemove: (providerConfigId: string) => void;
}

const ProviderKeyPanel: FC<ProviderKeyPanelProps> = ({
	provider,
	models,
	isModelsLoading,
	areModelsUnavailable,
	isSaving,
	isRemoving,
	onSave,
	onRemove,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const apiKeyInputId = useId();
	const [apiKey, setApiKey] = useState(
		provider.has_user_api_key ? API_KEY_PLACEHOLDER : "",
	);
	const [apiKeyTouched, setApiKeyTouched] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const status = getProviderStatus(provider);
	const enabledModels = models.filter(
		(model) => model.enabled && model.ai_provider_id === provider.provider_id,
	);
	const hasApiKeyValue = apiKey.trim().length > 0;
	const hasAPIKeyWhitespace =
		apiKey !== API_KEY_PLACEHOLDER && apiKey.trim() !== apiKey;
	const saveDisabled =
		!provider.byok_enabled ||
		!hasApiKeyValue ||
		hasAPIKeyWhitespace ||
		apiKey === API_KEY_PLACEHOLDER ||
		isSaving ||
		isRemoving;
	const inputDisabled = !provider.byok_enabled || isSaving || isRemoving;
	const removeDisabled = isSaving || isRemoving;
	const providerName = provider.display_name || provider.provider;

	const handleApiKeyFocus = () => {
		if (!apiKeyTouched && apiKey === API_KEY_PLACEHOLDER) {
			setApiKey("");
			setApiKeyTouched(true);
		}
	};

	const handleSave = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (saveDisabled) {
			return;
		}

		onSave(provider.provider_id, apiKey);
	};

	const handleRemoveKey = () => {
		onRemove(provider.provider_id);
	};

	const deleteDescription = provider.has_central_api_key_fallback
		? tI18n(
				"AgentsPage.AgentSettingsAPIKeysPageView.this_will_remove_your_personal_api_key_requests__ee78be33",
			)
		: tI18n(
				"AgentsPage.AgentSettingsAPIKeysPageView.this_will_remove_your_personal_api_key_you_will__ed2e5378",
			);

	return (
		<article className="rounded-lg border border-solid border-border p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-2">
					<h5 className="m-0 text-lg font-medium text-content-primary">
						{providerName}
					</h5>
					{status.note && (
						<p className="m-0 text-sm text-content-secondary">{status.note}</p>
					)}
				</div>
				<Badge size="md" variant={status.variant} className="w-fit">
					{status.label}
				</Badge>
			</div>
			<form className="mt-6 flex flex-col gap-3" onSubmit={handleSave}>
				<label
					htmlFor={apiKeyInputId}
					className="text-sm font-medium text-content-primary"
				>
					{tI18n("AgentsPage.AgentSettingsAPIKeysPageView.api_key_23189d55")}
				</label>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start">
					<div className="flex flex-col gap-1.5 lg:flex-1">
						<Input
							id={apiKeyInputId}
							name={`provider-api-key-${provider.provider_id}`}
							type="password"
							{...passwordManagerIgnoreProps}
							className="h-9 font-mono text-[13px]"
							placeholder={tI18n(
								"AgentsPage.AgentSettingsAPIKeysPageView.sk_6946d3ff",
							)}
							value={apiKey}
							onFocus={handleApiKeyFocus}
							onChange={(event) => {
								setApiKey(event.target.value);
								setApiKeyTouched(true);
							}}
							disabled={inputDisabled}
						/>
						{hasAPIKeyWhitespace && (
							<p className="m-0 text-xs text-content-destructive">
								{tI18n(
									"AgentsPage.AgentSettingsAPIKeysPageView.api_key_must_not_contain_leading_or_trailing_whi_dc243daa",
								)}
							</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button type="submit" size="sm" disabled={saveDisabled}>
							{tI18n("AgentsPage.AgentSettingsAPIKeysPageView.save_1509f561")}
						</Button>
						{provider.has_user_api_key && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsDeleteDialogOpen(true)}
								disabled={removeDisabled}
							>
								{tI18n(
									"AgentsPage.AgentSettingsAPIKeysPageView.remove_c3812fc4",
								)}
							</Button>
						)}
					</div>
				</div>
			</form>
			<div className="mt-6 flex flex-col gap-2">
				<p className="m-0 text-sm font-medium text-content-primary">
					{tI18n(
						"AgentsPage.AgentSettingsAPIKeysPageView.enabled_models_f45b18a6",
					)}
				</p>
				{areModelsUnavailable && enabledModels.length > 0 && (
					<p className="m-0 text-sm text-content-secondary">
						{tI18n(
							"AgentsPage.AgentSettingsAPIKeysPageView.some_enabled_model_badges_are_temporarily_unavai_3e51a5d1",
						)}
					</p>
				)}
				{isModelsLoading ? (
					<p className="m-0 text-sm text-content-secondary">
						{tI18n(
							"AgentsPage.AgentSettingsAPIKeysPageView.loading_models_80243524",
						)}
					</p>
				) : enabledModels.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{enabledModels.map((model) => (
							<Badge key={model.id} size="md" variant="default">
								{model.display_name || model.model}
							</Badge>
						))}
					</div>
				) : areModelsUnavailable ? (
					<p className="m-0 text-sm text-content-secondary">
						{tI18n(
							"AgentsPage.AgentSettingsAPIKeysPageView.enabled_model_badges_are_temporarily_unavailable_f3ff2533",
						)}
					</p>
				) : (
					<p className="m-0 text-sm text-content-secondary">
						{tI18n(
							"AgentsPage.AgentSettingsAPIKeysPageView.no_enabled_models_configured_3d9fa1df",
						)}
					</p>
				)}
			</div>
			<ConfirmDialog
				open={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={handleRemoveKey}
				title={tI18n(
					"AgentsPage.AgentSettingsAPIKeysPageView.remove_api_key_61ca1388",
				)}
				description={deleteDescription}
				confirmText={tI18n(
					"AgentsPage.AgentSettingsAPIKeysPageView.remove_c3812fc4",
				)}
				confirmLoading={isRemoving}
				type="delete"
			/>
		</article>
	);
};

interface AgentSettingsAPIKeysProviderItem {
	provider: UserChatProviderConfig;
	renderKey: string;
	isSaving: boolean;
	isRemoving: boolean;
}

export interface AgentSettingsAPIKeysPageViewProps {
	error: unknown;
	isLoading: boolean;
	providerItems: readonly AgentSettingsAPIKeysProviderItem[];
	models: readonly ChatModel[];
	isModelsLoading: boolean;
	areModelsUnavailable: boolean;
	onSave: (providerConfigId: string, apiKey: string) => void;
	onRemove: (providerConfigId: string) => void;
}

export const AgentSettingsAPIKeysPageView: FC<
	AgentSettingsAPIKeysPageViewProps
> = ({
	error,
	isLoading,
	providerItems,
	models,
	isModelsLoading,
	areModelsUnavailable,
	onSave,
	onRemove,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div>
			<section className="flex flex-col gap-8">
				<SectionHeader
					label={tI18n(
						"AgentsPage.AgentSettingsAPIKeysPageView.secrets_api_keys_b80cf3b4",
					)}
					description={tI18n(
						"AgentsPage.AgentSettingsAPIKeysPageView.add_a_personal_api_key_for_each_provider_your_pe_53b2406c",
					)}
				/>
				<div>
					{error ? (
						<ErrorAlert error={error} />
					) : isLoading ? (
						<Loader />
					) : providerItems.length === 0 ? (
						<EmptyState
							message={tI18n(
								"AgentsPage.AgentSettingsAPIKeysPageView.no_providers_allow_personal_api_keys_1e9a5939",
							)}
							description={tI18n(
								"AgentsPage.AgentSettingsAPIKeysPageView.ask_your_administrator_to_enable_personal_api_ke_4cf659fb",
							)}
						/>
					) : (
						<div className="flex flex-col gap-4">
							{providerItems.map((item) => (
								<ProviderKeyPanel
									key={item.renderKey}
									provider={item.provider}
									models={models}
									isModelsLoading={isModelsLoading}
									areModelsUnavailable={areModelsUnavailable}
									isSaving={item.isSaving}
									isRemoving={item.isRemoving}
									onSave={onSave}
									onRemove={onRemove}
								/>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
};
