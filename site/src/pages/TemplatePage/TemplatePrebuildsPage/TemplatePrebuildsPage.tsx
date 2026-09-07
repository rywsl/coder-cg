import { RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { toast } from "sonner";
import { API } from "#/api/api";
import type { InvalidatePresetsResponse } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { useTemplateLayoutContext } from "#/pages/TemplatePage/TemplateLayout";
import { pageTitle } from "#/utils/page";

const TemplatePrebuildsPage: FC = () => {
	const { t: tI18n } = useTranslation("templates");

	const { template } = useTemplateLayoutContext();

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"TemplatePage.TemplatePrebuildsPage.TemplatePrebuildsPage.value0_prebuilds_b1d4842c",
						{
							value0: template.name,
						},
					),
				)}
			</title>
			<TemplatePrebuildsPageView templateId={template.id} />
		</>
	);
};

interface TemplatePrebuildsPageViewProps {
	templateId: string;
}

export const TemplatePrebuildsPageView: FC<TemplatePrebuildsPageViewProps> = ({
	templateId,
}) => {
	const { t: tI18n } = useTranslation("templates");

	const invalidateMutation = useMutation({
		mutationFn: () => API.invalidateTemplatePresets(templateId),
		onSuccess: (data: InvalidatePresetsResponse) => {
			if (data.invalidated.length === 0) {
				toast.success(
					tI18n(
						"TemplatePage.TemplatePrebuildsPage.TemplatePrebuildsPage.no_template_presets_required_invalidation_3592f047",
					),
				);
				return;
			}

			// They all have the same template version
			const { template_version_name } = data.invalidated[0];
			const count = data.invalidated.length;

			toast.success(
				tI18n(
					"TemplatePage.TemplatePrebuildsPage.TemplatePrebuildsPage.invalidated_value0_value1_for_version_value2_7900e169",
					{
						value0: count,
						value1: count === 1 ? "preset" : "presets",
						value2: template_version_name,
					},
				),
			);
		},
	});

	return (
		<div className="flex">
			<div className="max-w-xl space-y-6">
				{invalidateMutation.error && (
					<ErrorAlert error={invalidateMutation.error} />
				)}
				<div>
					<h3 className="text-xl text-content-primary m-0">
						{tI18n(
							"TemplatePage.TemplatePrebuildsPage.TemplatePrebuildsPage.invalidate_presets_bfb31fd9",
						)}
					</h3>
					<p className="text-sm text-content-secondary">
						{tI18n(
							"TemplatePage.TemplatePrebuildsPage.TemplatePrebuildsPage.all_prebuilt_workspaces_for_the_active_template__10ea0a3d",
						)}
					</p>
				</div>

				<div>
					<Button
						onClick={() => invalidateMutation.mutate()}
						disabled={invalidateMutation.isPending}
						className="gap-2"
					>
						<RefreshCwIcon className="size-4" />
						{tI18n(
							"TemplatePage.TemplatePrebuildsPage.TemplatePrebuildsPage.invalidate_now_03f4edd7",
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default TemplatePrebuildsPage;
