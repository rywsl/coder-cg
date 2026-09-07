import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import {
	templateVersions,
	templateVersionsQueryKey,
} from "#/api/queries/templates";
import type { TemplateVersion } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { linkToTemplate, useLinks } from "#/modules/navigation";
import { useTemplateLayoutContext } from "#/pages/TemplatePage/TemplateLayout";
import { getTemplatePageTitle } from "../utils";
import { VersionsTable } from "./VersionsTable";

const TemplateVersionsPage = () => {
	const { t: tI18n } = useTranslation("templates");

	const navigate = useNavigate();
	const getLink = useLinks();
	const { template, permissions } = useTemplateLayoutContext();
	const queryClient = useQueryClient();
	const templateLink = getLink(
		linkToTemplate(template.organization_name, template.name),
	);
	const { data } = useQuery(templateVersions(template.id));
	// We use this to update the active version in the UI without having to refetch the template
	const [latestActiveVersion, setLatestActiveVersion] = useState(
		template.active_version_id,
	);
	const [versionToPromote, setVersionToPromote] = useState<
		TemplateVersion | undefined
	>();
	const [versionToArchive, setVersionToArchive] = useState<
		TemplateVersion | undefined
	>();

	const { mutateAsync: promoteVersion, isPending: isPromoting } = useMutation({
		mutationFn: (templateVersionId: string) => {
			return API.updateActiveTemplateVersion(template.id, {
				id: templateVersionId,
			});
		},
	});

	const { mutateAsync: archiveVersion, isPending: isArchiving } = useMutation({
		mutationFn: (templateVersionId: string) => {
			return API.archiveTemplateVersion(templateVersionId);
		},
	});

	return (
		<>
			<title>
				{getTemplatePageTitle(
					tI18n(
						"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.versions_f89ea270",
					),
					template,
				)}
			</title>
			<VersionsTable
				versions={data}
				onPromoteClick={
					permissions.canUpdateTemplate ? setVersionToPromote : undefined
				}
				onArchiveClick={
					permissions.canUpdateTemplate ? setVersionToArchive : undefined
				}
				activeVersionId={latestActiveVersion}
			/>
			<ConfirmDialog
				type="info"
				hideCancel={false}
				open={Boolean(versionToPromote)}
				onConfirm={async () => {
					if (!versionToPromote) {
						return;
					}
					const { id, name } = versionToPromote;
					try {
						await promoteVersion(id);
						setLatestActiveVersion(id);
						setVersionToPromote(undefined);
						toast.success(
							tI18n(
								"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.version_value0_promoted_successfully_77e01d3b",
								{
									value0: name,
								},
							),
							{
								action: {
									label: tI18n(
										"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.view_template_b6532e54",
									),
									onClick: () => navigate(templateLink),
								},
							},
						);
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.failed_to_promote_version_value0_7351d1c9",
									{
										value0: name,
									},
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
					}
				}}
				onClose={() => setVersionToPromote(undefined)}
				title={tI18n(
					"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.promote_version_0a906639",
				)}
				confirmLoading={isPromoting}
				confirmText={tI18n(
					"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.promote_5834dab0",
				)}
				description={
					<>
						{tI18n(
							"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.are_you_sure_you_want_to_promote_version_e4961816",
						)}{" "}
						<strong>{versionToPromote?.name}</strong>
						{tI18n(
							"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.workspaces_will_be_prompted_to_update_to_this_ve_4905cb63",
						)}
					</>
				}
			/>
			<ConfirmDialog
				type="info"
				hideCancel={false}
				open={Boolean(versionToArchive)}
				onConfirm={async () => {
					if (!versionToArchive) {
						return;
					}
					const { id, name } = versionToArchive;
					try {
						await archiveVersion(id);
						await queryClient.invalidateQueries({
							queryKey: templateVersionsQueryKey(template.id),
						});
						setVersionToArchive(undefined);
						toast.success(
							tI18n(
								"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.version_value0_archived_successfully_811473d1",
								{
									value0: name,
								},
							),
						);
					} catch (error) {
						toast.error(
							getErrorMessage(
								error,
								tI18n(
									"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.failed_to_archive_version_value0_1f57254b",
									{
										value0: name,
									},
								),
							),
							{
								description: getErrorDetail(error),
							},
						);
					}
				}}
				onClose={() => setVersionToArchive(undefined)}
				title={tI18n(
					"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.archive_version_dde38162",
				)}
				confirmLoading={isArchiving}
				confirmText={tI18n(
					"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.archive_66f4804e",
				)}
				description={
					<>
						{tI18n(
							"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.are_you_sure_you_want_to_archive_version_d73f9d9e",
						)}{" "}
						<strong>{versionToArchive?.name}</strong>
						{tI18n(
							"TemplatePage.TemplateVersionsPage.TemplateVersionsPage.this_is_reversible_archived_versions_cannot_be_u_8ce1ff59",
						)}
					</>
				}
			/>
		</>
	);
};

export default TemplateVersionsPage;
