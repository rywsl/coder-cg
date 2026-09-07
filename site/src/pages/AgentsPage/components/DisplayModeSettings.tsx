import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
	preferenceSettings,
	updatePreferenceSettings,
} from "#/api/queries/users";
import type {
	UpdateUserPreferenceSettingsRequest,
	UserPreferenceSettings,
} from "#/api/typesGenerated";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { i18n } from "#/i18n";

type DisplayModeOption<T extends string> = { value: T; label: string };

type ThinkingDisplayMode = UserPreferenceSettings["thinking_display_mode"];
type AgentDisplayMode = UserPreferenceSettings["code_diff_display_mode"];

const thinkingDisplayOptions: DisplayModeOption<ThinkingDisplayMode>[] = [
	{
		value: "auto",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.auto_02862497",
		),
	},
	{
		value: "preview",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.preview_324b134f",
		),
	},
	{
		value: "always_expanded",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.always_expanded_cb32471e",
		),
	},
	{
		value: "always_collapsed",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.always_collapsed_dc324558",
		),
	},
];

const agentDisplayOptions: DisplayModeOption<AgentDisplayMode>[] = [
	{
		value: "auto",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.auto_02862497",
		),
	},
	{
		value: "always_expanded",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.always_expanded_cb32471e",
		),
	},
	{
		value: "always_collapsed",
		label: i18n.t(
			"agents:AgentsPage.components.DisplayModeSettings.always_collapsed_dc324558",
		),
	},
];

type DisplayModeSettingsProps<T extends string> = {
	title: string;
	description: string;
	ariaLabel: string;
	errorMessage: string;
	defaultValue: T;
	options: DisplayModeOption<T>[];
	getMode: (settings: UserPreferenceSettings) => T;
	updateSettings: (value: T) => UpdateUserPreferenceSettingsRequest;
};

const DisplayModeSettings = <T extends string>({
	title,
	description,
	ariaLabel,
	errorMessage,
	defaultValue,
	options,
	getMode,
	updateSettings,
}: DisplayModeSettingsProps<T>) => {
	const queryClient = useQueryClient();
	const query = useQuery(preferenceSettings());
	const mutation = useMutation(updatePreferenceSettings(queryClient));

	const mode = query.data ? getMode(query.data) : defaultValue;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="m-0 text-sm font-semibold text-content-primary">
				{title}
			</h3>
			<div className="flex items-center justify-between gap-4">
				<p className="m-0 flex-1 text-xs text-content-secondary">
					{description}
				</p>
				<Select
					value={mode}
					disabled={query.isLoading || !query.data}
					onValueChange={(value: string) => {
						const selected = options.find((opt) => opt.value === value);
						if (!query.data || !selected) return;
						mutation.mutate(updateSettings(selected.value));
					}}
				>
					<SelectTrigger className="w-44 shrink-0" aria-label={ariaLabel}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{mutation.isError && (
				<p className="m-0 text-xs text-content-destructive">{errorMessage}</p>
			)}
		</div>
	);
};

export const ThinkingDisplaySettings: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<DisplayModeSettings
			title={tI18n(
				"AgentsPage.components.DisplayModeSettings.thinking_display_a030f314",
			)}
			description={tI18n(
				"AgentsPage.components.DisplayModeSettings.how_thinking_blocks_should_be_displayed_by_defau_eba881f2",
			)}
			ariaLabel={tI18n(
				"AgentsPage.components.DisplayModeSettings.thinking_display_mode_fc783d2c",
			)}
			errorMessage={tI18n(
				"AgentsPage.components.DisplayModeSettings.failed_to_save_your_thinking_display_preference_2eae099b",
			)}
			defaultValue="auto"
			options={thinkingDisplayOptions}
			getMode={(settings) => settings.thinking_display_mode}
			updateSettings={(value) => ({
				thinking_display_mode: value,
			})}
		/>
	);
};

export const ShellToolDisplaySettings: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<DisplayModeSettings
			title={tI18n(
				"AgentsPage.components.DisplayModeSettings.shell_output_display_533a0528",
			)}
			description={tI18n(
				"AgentsPage.components.DisplayModeSettings.how_shell_command_output_should_be_displayed_by__7b0d3b27",
			)}
			ariaLabel={tI18n(
				"AgentsPage.components.DisplayModeSettings.shell_output_display_mode_6d7d08cb",
			)}
			errorMessage={tI18n(
				"AgentsPage.components.DisplayModeSettings.failed_to_save_your_shell_output_display_prefere_0fe10225",
			)}
			defaultValue="auto"
			options={agentDisplayOptions}
			getMode={(settings) => settings.shell_tool_display_mode}
			updateSettings={(value) => ({
				shell_tool_display_mode: value,
			})}
		/>
	);
};

export const CodeDiffDisplaySettings: FC = () => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<DisplayModeSettings
			title={tI18n(
				"AgentsPage.components.DisplayModeSettings.code_diff_display_ab2ddf81",
			)}
			description={tI18n(
				"AgentsPage.components.DisplayModeSettings.controls_how_code_edit_diffs_appear_auto_starts__e84d712b",
			)}
			ariaLabel={tI18n(
				"AgentsPage.components.DisplayModeSettings.code_diff_display_mode_ffce6941",
			)}
			errorMessage={tI18n(
				"AgentsPage.components.DisplayModeSettings.failed_to_save_your_code_diff_display_preference_7c005052",
			)}
			defaultValue="auto"
			options={agentDisplayOptions}
			getMode={(settings) => settings.code_diff_display_mode}
			updateSettings={(value) => ({
				code_diff_display_mode: value,
			})}
		/>
	);
};
