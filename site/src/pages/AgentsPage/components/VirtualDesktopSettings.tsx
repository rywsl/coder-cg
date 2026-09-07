import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { Link } from "#/components/Link/Link";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { useTemporarySavedState } from "#/components/TemporarySavedState/TemporarySavedState";
import { i18n } from "#/i18n";
import { AgentSettingLayout } from "#/pages/AISettingsPage/CoderAgentsPage/components/AgentSettingLayout";

interface MutationCallbacks {
	onSuccess?: () => void;
	onError?: () => void;
}

interface VirtualDesktopSettingsProps {
	computerUseProviderData: TypesGen.ChatComputerUseProviderResponse | undefined;
	isLoadingComputerUseProvider: boolean;
	onSaveComputerUseProvider: (
		req: TypesGen.UpdateChatComputerUseProviderRequest,
		options?: MutationCallbacks,
	) => void;
	isSavingComputerUseProvider: boolean;
	computerUseProviderSaveError: Error | null;
}

const computerUseProviderOptions = [
	{
		label: i18n.t(
			"agents:AgentsPage.components.VirtualDesktopSettings.anthropic_744205e4",
		),
		value: "anthropic",
	},
	{
		label: i18n.t(
			"agents:AgentsPage.components.VirtualDesktopSettings.openai_8b7d1a31",
		),
		value: "openai",
	},
] as const;

const getComputerUseProviderLabel = (provider: string) => {
	return (
		computerUseProviderOptions.find((option) => option.value === provider)
			?.label ?? provider
	);
};

export const VirtualDesktopSettings: FC<VirtualDesktopSettingsProps> = ({
	computerUseProviderData,
	isLoadingComputerUseProvider,
	onSaveComputerUseProvider,
	isSavingComputerUseProvider,
	computerUseProviderSaveError,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { isSavedVisible, showSavedState } = useTemporarySavedState();
	const serverProvider = computerUseProviderData?.provider ?? "";
	const hasLoaded = computerUseProviderData !== undefined;

	const form = useFormik<{ provider: TypesGen.ChatComputerUseProvider | "" }>({
		enableReinitialize: true,
		initialValues: {
			provider: serverProvider,
		},
		onSubmit: (values, helpers) => {
			if (!values.provider) {
				return;
			}
			onSaveComputerUseProvider(
				{ provider: values.provider },
				{
					onSuccess: () => {
						showSavedState();
						helpers.resetForm({ values });
					},
				},
			);
		},
	});

	const isFormDisabled =
		isSavingComputerUseProvider || isLoadingComputerUseProvider || !hasLoaded;
	const canSave = hasLoaded && form.dirty;

	return (
		<AgentSettingLayout
			title={tI18n(
				"AgentsPage.components.VirtualDesktopSettings.virtual_desktop_009e9166",
			)}
			description={
				<>
					{tI18n(
						"AgentsPage.components.VirtualDesktopSettings.allow_agents_to_use_a_virtual_graphical_desktop__5e7e17d5",
					)}{" "}
					<Link
						href="https://registry.coder.com/modules/coder/portabledesktop"
						target="_blank"
						size="sm"
					>
						{tI18n(
							"AgentsPage.components.VirtualDesktopSettings.portabledesktop_module_d33a8a56",
						)}
					</Link>{" "}
					{tI18n(
						"AgentsPage.components.VirtualDesktopSettings.to_be_installed_in_the_workspace_and_a_computer__79a46bc9",
					)}
				</>
			}
			showSave={canSave}
			isSaving={isSavingComputerUseProvider}
			isSavedVisible={isSavedVisible}
			saveDisabled={isFormDisabled || !canSave}
			onSubmit={form.handleSubmit}
			error={
				computerUseProviderSaveError ? (
					<p className="m-0">
						{tI18n(
							"AgentsPage.components.VirtualDesktopSettings.failed_to_save_computer_use_provider_dfa28fcc",
						)}
					</p>
				) : undefined
			}
		>
			<div className="flex w-88 max-w-full flex-col gap-2">
				<Select
					value={form.values.provider}
					onValueChange={(value) => void form.setFieldValue("provider", value)}
					disabled={isFormDisabled}
				>
					<SelectTrigger
						aria-label={tI18n(
							"AgentsPage.components.VirtualDesktopSettings.computer_use_provider_10f0fae9",
						)}
						className="h-10 w-full justify-between rounded-md border border-border border-solid bg-transparent px-3 text-sm shadow-none"
					>
						<SelectValue
							placeholder={tI18n(
								"AgentsPage.components.VirtualDesktopSettings.select_provider_644c6aae",
							)}
						>
							{isLoadingComputerUseProvider ? (
								<Skeleton className="h-4 w-20" aria-hidden="true" />
							) : form.values.provider ? (
								getComputerUseProviderLabel(form.values.provider)
							) : undefined}
						</SelectValue>
					</SelectTrigger>
					<SelectContent align="end" className="min-w-44">
						<SelectGroup>
							{computerUseProviderOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</AgentSettingLayout>
	);
};
