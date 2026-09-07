import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useNavigate, useSearchParams } from "react-router";
import {
	JobError,
	template,
	templateVersion,
	templateVersionLogs,
	templateVersionPresets,
	templateVersionVariables,
} from "#/api/queries/templates";
import type { Template, TemplateVersion } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { useDashboard } from "#/modules/dashboard/useDashboard";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { CreateTemplateForm } from "./CreateTemplateForm";
import type { CreateTemplatePageViewProps } from "./types";
import { firstVersionFromFile, getFormPermissions, newTemplate } from "./utils";

export const DuplicateTemplateView: FC<CreateTemplatePageViewProps> = ({
	onCreateTemplate,
	onOpenBuildLogsDrawer,
	variablesSectionRef,
	error,
	isCreating,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const navigate = useNavigate();
	const { entitlements } = useDashboard();
	const [searchParams] = useSearchParams();
	const templateQuery = useQuery(
		template(searchParams.get("fromTemplate") as string),
	);
	const activeVersionId = templateQuery.data?.active_version_id ?? "";
	const templateVersionQuery = useQuery({
		...templateVersion(activeVersionId),
		enabled: templateQuery.isSuccess,
	});
	const templateVersionVariablesQuery = useQuery({
		...templateVersionVariables(activeVersionId),
		enabled: templateQuery.isSuccess,
	});
	const { workspace_prebuilds: prebuildsEnabled } = useFeatureVisibility();
	const presetsQuery = useQuery({
		...templateVersionPresets(activeVersionId),
		enabled: templateQuery.isSuccess && prebuildsEnabled,
	});
	const totalPrebuilds =
		presetsQuery.data?.reduce(
			(sum, preset) => sum + (preset.DesiredPrebuildInstances ?? 0),
			0,
		) ?? 0;
	const isLoading =
		templateQuery.isLoading ||
		templateVersionQuery.isLoading ||
		templateVersionVariablesQuery.isLoading;
	const loadingError =
		templateQuery.error ||
		templateVersionQuery.error ||
		templateVersionVariablesQuery.error;

	const formPermissions = getFormPermissions(entitlements);

	const isJobError = error instanceof JobError;
	const templateVersionLogsQuery = useQuery({
		...templateVersionLogs(isJobError ? error.version.id : ""),
		enabled: isJobError,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (loadingError) {
		return <ErrorAlert error={loadingError} />;
	}

	return (
		<>
			{totalPrebuilds > 0 && (
				<Alert severity="warning" className="mb-4">
					{tI18n(
						"CreateTemplatePage.DuplicateTemplateView.this_template_has_prebuilds_configured_duplicati_9684c874",
					)}
					{totalPrebuilds}{" "}
					{totalPrebuilds === 1
						? tI18n(
								"CreateTemplatePage.DuplicateTemplateView.prebuild_5d1831c5",
							)
						: tI18n(
								"CreateTemplatePage.DuplicateTemplateView.prebuilds_1d1362ce",
							)}
					{tI18n(
						"CreateTemplatePage.DuplicateTemplateView.to_be_created_e59c437c",
					)}
				</Alert>
			)}
			<CreateTemplateForm
				{...formPermissions}
				variablesSectionRef={variablesSectionRef}
				onOpenBuildLogsDrawer={onOpenBuildLogsDrawer}
				copiedTemplate={templateQuery.data as Template}
				error={error}
				isSubmitting={isCreating}
				variables={templateVersionVariablesQuery.data}
				onCancel={() => navigate(-1)}
				jobError={isJobError ? error.job.error : undefined}
				logs={templateVersionLogsQuery.data}
				onSubmit={async (formData) => {
					await onCreateTemplate({
						organization: (templateQuery.data as Template).organization_name,
						version: firstVersionFromFile(
							(templateVersionQuery.data as TemplateVersion).job.file_id,
							formData.user_variable_values,
							formData.provisioner_type,
							formData.tags,
						),
						template: newTemplate(formData),
					});
				}}
			/>
		</>
	);
};
