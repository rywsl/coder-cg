import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	DetailedError,
	getErrorDetail,
	hasError,
	isApiValidationError,
} from "#/api/errors";
import type * as TypesGen from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { Button } from "#/components/Button/Button";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
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
	type TemplateFilterState,
	TemplatesFilter,
} from "#/pages/TemplatesPage/TemplatesFilter";
import { createDayString } from "#/utils/createDayString";
import { formatTemplateActiveDevelopersLabel } from "#/utils/templates";

interface TemplatesPageViewProps {
	filterState: TemplateFilterState;
	templates: TypesGen.Template[] | undefined;
	isLoading: boolean;
	error: unknown;
	onRetry: () => void;
	onToggleAgentsAllowed: (
		template: TypesGen.Template,
		agentsAllowed: boolean,
	) => void;
	pendingTemplateIDs: ReadonlySet<string>;
}

interface TemplateRowProps {
	template: TypesGen.Template;
	isPending: boolean;
	onToggleAgentsAllowed: (
		template: TypesGen.Template,
		agentsAllowed: boolean,
	) => void;
}

const TemplateRow: FC<TemplateRowProps> = ({
	template,
	isPending,
	onToggleAgentsAllowed,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const label = template.display_name || template.name;
	const organization =
		template.organization_display_name || template.organization_name;

	return (
		<TableRow>
			<TableCell className="w-full max-w-0 px-4 py-3">
				<AvatarData
					truncate
					title={<span title={label}>{label}</span>}
					subtitle={<span title={organization}>{organization}</span>}
					avatar={
						<Avatar
							size="lg"
							variant="icon"
							src={template.icon}
							fallback={label}
						/>
					}
				/>
			</TableCell>
			<TableCell
				data-pixel="ignore"
				className="whitespace-nowrap text-sm font-medium leading-6 text-content-secondary"
			>
				{createDayString(template.updated_at)}
			</TableCell>
			<TableCell className="whitespace-nowrap text-sm font-medium leading-6 text-content-secondary">
				{formatTemplateActiveDevelopersLabel(template.active_user_count)}
			</TableCell>
			<TableCell className="whitespace-nowrap pr-4 text-right">
				<Switch
					checked={template.agents_allowed}
					onCheckedChange={(agentsAllowed) =>
						onToggleAgentsAllowed(template, agentsAllowed)
					}
					disabled={isPending}
					aria-label={tI18n(
						"AISettingsPage.TemplatesPage.TemplatesPageView.allow_coder_agents_to_create_workspaces_using_va_c91b9cb4",
						{
							value0: label,
							value1: organization,
						},
					)}
				/>
			</TableCell>
		</TableRow>
	);
};

export const TemplatesPageView: FC<TemplatesPageViewProps> = ({
	filterState,
	templates,
	isLoading,
	error,
	onRetry,
	onToggleAgentsAllowed,
	pendingTemplateIDs,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const hasValidationError = isApiValidationError(error);
	const hasLoadError = hasError(error) && !hasValidationError;

	return (
		<div>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"AISettingsPage.TemplatesPage.TemplatesPageView.templates_56b564b7",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.TemplatesPage.TemplatesPageView.choose_which_templates_coder_agents_can_use_to_c_47790183",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<TemplatesFilter
				filter={filterState.filter}
				error={error}
				userMenu={filterState.menus.user}
			/>
			{hasLoadError && (
				<div className="mb-4 flex flex-col gap-4">
					<ErrorAlert
						error={
							new DetailedError(
								"Failed to load templates.",
								getErrorDetail(error),
							)
						}
					/>
					<Button variant="outline" size="sm" type="button" onClick={onRetry}>
						{tI18n(
							"AISettingsPage.TemplatesPage.TemplatesPageView.retry_942087cc",
						)}
					</Button>
				</div>
			)}
			{!hasValidationError && (!hasLoadError || templates !== undefined) && (
				<Table
					aria-label={tI18n(
						"AISettingsPage.TemplatesPage.TemplatesPageView.templates_coder_agents_can_use_to_create_workspa_96a70ae0",
					)}
					className="table-fixed"
				>
					<TableHeader>
						<TableRow>
							<TableHead className="w-1/2">
								{tI18n(
									"AISettingsPage.TemplatesPage.TemplatesPageView.template_0575f29d",
								)}
							</TableHead>
							<TableHead className="w-44">
								{tI18n(
									"AISettingsPage.TemplatesPage.TemplatesPageView.last_updated_382ac5f3",
								)}
							</TableHead>
							<TableHead className="w-44">
								{tI18n(
									"AISettingsPage.TemplatesPage.TemplatesPageView.used_by_681bf81a",
								)}
							</TableHead>
							<TableHead className="w-36 text-right">
								<span className="sr-only">
									{tI18n(
										"AISettingsPage.TemplatesPage.TemplatesPageView.coder_agents_workspace_creation_8f9e12ff",
									)}
								</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody size="lg">
						{isLoading || !templates ? (
							<TableLoader />
						) : templates.length === 0 ? (
							<TableEmpty
								message={
									filterState.filter.used
										? tI18n(
												"AISettingsPage.TemplatesPage.TemplatesPageView.no_results_matched_your_search_cf13a234",
											)
										: tI18n(
												"AISettingsPage.TemplatesPage.TemplatesPageView.no_templates_found_821a89da",
											)
								}
								description={
									filterState.filter.used
										? undefined
										: tI18n(
												"AISettingsPage.TemplatesPage.TemplatesPageView.create_a_template_before_configuring_whether_cod_4860480d",
											)
								}
								isCompact
								className="min-h-52"
							/>
						) : (
							templates.map((template) => (
								<TemplateRow
									key={template.id}
									template={template}
									isPending={pendingTemplateIDs.has(template.id)}
									onToggleAgentsAllowed={onToggleAgentsAllowed}
								/>
							))
						)}
					</TableBody>
				</Table>
			)}
		</div>
	);
};
