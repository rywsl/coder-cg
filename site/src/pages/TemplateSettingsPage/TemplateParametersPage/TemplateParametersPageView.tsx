import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateVersion } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { Checkbox } from "#/components/Checkbox/Checkbox";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { Label } from "#/components/Label/Label";
import { Link } from "#/components/Link/Link";
import { Separator } from "#/components/Separator/Separator";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	StackLabel,
	StackLabelHelperText,
} from "#/components/StackLabel/StackLabel";
import { docs } from "#/utils/docs";
import { formatDate } from "#/utils/time";

type TemplateParametersPageViewProps = {
	activeVersion: TemplateVersion;
	useClassicParameterFlow: boolean;
	canUpdate: boolean;
	isSaving: boolean;
	isRefreshing: boolean;
	error?: unknown;
	onChangeClassicParameterFlow: (useClassicParameterFlow: boolean) => void;
	onRefresh: () => void;
};

export const TemplateParametersPageView: React.FC<
	TemplateParametersPageViewProps
> = ({
	activeVersion,
	useClassicParameterFlow,
	canUpdate,
	isSaving,
	isRefreshing,
	error,
	onChangeClassicParameterFlow,
	onRefresh,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const [isConfirmingRefresh, setIsConfirmingRefresh] = useState(false);
	const refreshButtonRef = useRef<HTMLButtonElement>(null);
	const importedAt = activeVersion.job.completed_at;

	return (
		<div className="flex max-w-prose flex-col gap-8">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.parameters_e68b36b1",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.control_how_this_template_s_parameters_are_resol_4f1ce625",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			{error ? <ErrorAlert error={error} /> : null}
			{!canUpdate && (
				<p className="m-0 text-sm text-content-secondary">
					{tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.you_need_permission_to_update_this_template_to_c_3a82a2f7",
					)}
				</p>
			)}
			<div className="flex items-start">
				{/* sm + m-1 keeps the layout from shifting */}
				<Spinner
					size="sm"
					className="m-1 shrink-0"
					loading={isSaving}
					label={tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.saving_parameter_compatibility_mode_497f0679",
					)}
				>
					<Checkbox
						id="use_classic_parameter_flow"
						name="use_classic_parameter_flow"
						checked={useClassicParameterFlow}
						onCheckedChange={(checked) => {
							onChangeClassicParameterFlow(checked === true);
						}}
						disabled={!canUpdate}
					/>
				</Spinner>
				<StackLabel>
					<Label htmlFor="use_classic_parameter_flow">
						<span className="flex flex-row items-center gap-2">
							{tI18n(
								"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.use_parameter_compatibility_mode_for_workspace_b_282bd94b",
							)}
							<Badge size="sm" variant="warning">
								{tI18n(
									"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.deprecated_6b2e8f83",
								)}
							</Badge>
						</span>
					</Label>
					<StackLabelHelperText>
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.turn_this_on_only_if_this_template_does_not_work_8756d1e3",
						)}
					</StackLabelHelperText>
					<StackLabelHelperText>
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.dynamic_parameters_are_the_default_since_coder_2_9aa2ee5a",
						)}
					</StackLabelHelperText>
					<Link
						className="self-start text-xs"
						href={docs(
							"/admin/templates/extending-templates/dynamic-parameters",
						)}
					>
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.learn_more_1445799c",
						)}
					</Link>
				</StackLabel>
			</div>
			<Separator className="my-2" />
			<section className="flex flex-col gap-4">
				<SettingsHeaderTitle level="h2" hierarchy="secondary">
					{tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.template_data_4aed743d",
					)}
				</SettingsHeaderTitle>

				<p className="m-0 text-sm text-content-secondary">
					{tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.coder_caches_certain_values_like_terraform_59f63b6a",
					)}
					<code>data</code>
					{tI18n(
						"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.sources_when_a_new_template_version_is_created_a_3ebfb414",
					)}
				</p>

				<dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
					<dt className="text-content-secondary">
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.active_version_44e1ea1c",
						)}
					</dt>
					<dd className="m-0">{activeVersion.name}</dd>
					<dt className="text-content-secondary">
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.last_imported_74ffc732",
						)}
					</dt>
					<dd className="m-0">
						{importedAt
							? formatDate(new Date(importedAt))
							: tI18n(
									"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.unknown_b764cdc0",
								)}
					</dd>
				</dl>

				<div className="pt-2">
					<Button
						ref={refreshButtonRef}
						disabled={!canUpdate || isRefreshing}
						onClick={() => setIsConfirmingRefresh(true)}
					>
						<Spinner loading={isRefreshing} />
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.refresh_template_data_31dc6d66",
						)}
					</Button>
				</div>
			</section>
			<ConfirmDialog
				open={isConfirmingRefresh}
				type="info"
				hideCancel={false}
				title={tI18n(
					"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.refresh_template_data_31dc6d66",
				)}
				description={
					<>
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.this_creates_a_new_template_version_from_the_sam_d6116c27",
						)}{" "}
						<strong>{activeVersion.name}</strong>
						{tI18n(
							"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.and_makes_it_the_active_version_new_workspaces_w_71f20bb1",
						)}
					</>
				}
				confirmText={tI18n(
					"TemplateSettingsPage.TemplateParametersPage.TemplateParametersPageView.refresh_0e916101",
				)}
				onClose={() => setIsConfirmingRefresh(false)}
				onConfirm={() => {
					setIsConfirmingRefresh(false);
					onRefresh();
				}}
				// Radix returns focus to its trigger on close, and this dialog has
				// none, so focus would land on <body>.
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					refreshButtonRef.current?.focus();
				}}
			/>
		</div>
	);
};
