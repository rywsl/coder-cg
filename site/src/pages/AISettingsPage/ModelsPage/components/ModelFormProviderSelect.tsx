import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "#/components/Label/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import type { ProviderState } from "#/modules/aiModels/providerStates";
import { ProviderIcon } from "#/pages/AISettingsPage/ProvidersPage/components/ProviderIcon";

export const ModelFormProviderSelect: FC<{
	providerStates: readonly ProviderState[];
	selectedProviderKey: string;
	onProviderChange: (providerKey: string) => void;
	disabled: boolean;
	isEditing: boolean;
}> = ({
	providerStates,
	selectedProviderKey,
	onProviderChange,
	disabled,
	isEditing,
}) => {
	const { t: tI18n } = useTranslation("agents");

	// Hide disabled providers; the backend rejects new model configs under
	// them. When editing, keep the selected provider visible so a config
	// whose provider was disabled afterwards still renders.
	const selectableProviderStates = providerStates.filter(
		(ps) =>
			ps.providerDescriptor.enabled ||
			(isEditing && ps.key === selectedProviderKey),
	);
	return (
		<div className="grid gap-1.5">
			<Label
				htmlFor="providerSelect"
				className="flex items-center gap-1 leading-6 text-content-primary"
			>
				{tI18n(
					"AISettingsPage.ModelsPage.components.ModelFormProviderSelect.provider_472590ae",
				)}{" "}
				<span className="text-xs font-bold text-content-destructive">*</span>
			</Label>
			<p className="m-0 text-xs text-content-secondary">
				{tI18n(
					"AISettingsPage.ModelsPage.components.ModelFormProviderSelect.the_provider_this_model_belongs_to_57152f02",
				)}
			</p>
			<Select
				value={selectedProviderKey}
				onValueChange={onProviderChange}
				disabled={disabled}
			>
				<SelectTrigger
					id="providerSelect"
					className="text-content-primary shadow-none"
				>
					<SelectValue
						placeholder={tI18n(
							"AISettingsPage.ModelsPage.components.ModelFormProviderSelect.select_provider_644c6aae",
						)}
					/>
				</SelectTrigger>
				<SelectContent>
					{selectableProviderStates.map((ps) => (
						<SelectItem key={ps.key} value={ps.key}>
							<span className="flex items-center gap-2">
								<ProviderIcon provider={ps.provider} />
								{ps.label}
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
