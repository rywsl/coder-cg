import dayjs from "dayjs";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import { templateByName } from "#/api/queries/templates";
import { workspaceByOwnerAndNameKey } from "#/api/queries/workspaces";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { Link } from "#/components/Link/Link";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	scheduleChanged,
	scheduleToAutostart,
} from "#/pages/WorkspaceSettingsPage/WorkspaceSchedulePage/schedule";
import { ttlMsToAutostop } from "#/pages/WorkspaceSettingsPage/WorkspaceSchedulePage/ttl";
import { docs } from "#/utils/docs";
import { pageTitle } from "#/utils/page";
import { useWorkspaceSettings } from "../useWorkspaceSettings";
import {
	formValuesToAutostartRequest,
	formValuesToTTLRequest,
} from "./formToRequest";
import { WorkspaceScheduleForm } from "./WorkspaceScheduleForm";

const WorkspaceSchedulePage: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	const params = useParams() as { username: string; workspace: string };
	const navigate = useNavigate();
	const username = params.username.replace("@", "");
	const workspaceName = params.workspace;
	const queryClient = useQueryClient();
	const { permissions, workspace } = useWorkspaceSettings();
	const { data: template, error: getTemplateError } = useQuery(
		templateByName(workspace.organization_id, workspace.template_name),
	);
	const submitScheduleMutation = useMutation({
		mutationFn: submitSchedule,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: workspaceByOwnerAndNameKey(
					params.username.replace(/^@/, ""),
					params.workspace,
				),
			});
			toast.success(
				tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.schedule_for_workspace_value0_updated_successful_197faf57",
					{
						value0: workspaceName,
					},
				),
			);
		},
		onError: (error) =>
			toast.error(
				tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.failed_to_update_schedule_for_workspace_value0_f9a57470",
					{
						value0: workspaceName,
					},
				),
				{
					description: getErrorDetail(error),
				},
			),
	});
	const error = getTemplateError;
	const isLoading = !template;

	const [isConfirmingApply, setIsConfirmingApply] = useState(false);
	const { mutate: restartWorkspace } = useMutation({
		mutationFn: () => API.restartWorkspace({ workspace }),
	});

	return (
		<div className="flex flex-col gap-12">
			<title>
				{pageTitle(
					workspaceName,
					tI18n(
						"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.schedule_f4830a1d",
					),
				)}
			</title>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.schedule_f4830a1d",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.configure_when_this_workspace_starts_and_stops_a_0c29a87e",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			{error && <ErrorAlert error={error} />}
			{isLoading && <Loader />}
			{permissions && !permissions.updateWorkspace && (
				<Alert severity="error">
					{tI18n(
						"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.you_don_t_have_permissions_to_update_the_schedul_75e126d2",
					)}
				</Alert>
			)}
			{template &&
				(workspace.is_prebuild ? (
					<Alert severity="info">
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.prebuilt_workspaces_ignore_workspace_level_sched_1859aaa0",
						)}{" "}
						<Link
							title={tI18n(
								"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.prebuilt_workspaces_scheduling_ade4d9fd",
							)}
							href={docs(
								"/admin/templates/extending-templates/prebuilt-workspaces#scheduling",
							)}
							target="_blank"
							rel="noreferrer"
						>
							{tI18n(
								"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.prebuilt_workspaces_scheduling_ade4d9fd",
							)}
						</Link>{" "}
						{tI18n(
							"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.documentation_page_c064490e",
						)}
					</Alert>
				) : (
					<WorkspaceScheduleForm
						template={template}
						error={submitScheduleMutation.error}
						initialValues={{
							...getAutostart(workspace),
							...getAutostop(workspace),
						}}
						isLoading={submitScheduleMutation.isPending}
						defaultTTL={dayjs.duration(template.default_ttl_ms, "ms").asHours()}
						onCancel={() => {
							navigate(`/@${username}/${workspaceName}`);
						}}
						onSubmit={async (values) => {
							const data = {
								workspace,
								autostart: formValuesToAutostartRequest(values),
								ttl: formValuesToTTLRequest(values),
								autostartChanged: scheduleChanged(
									getAutostart(workspace),
									values,
								),
								autostopChanged: scheduleChanged(
									getAutostop(workspace),
									values,
								),
							};

							await submitScheduleMutation.mutateAsync(data);

							// A running build's autostop deadline is calculated when the
							// build starts, so updating the TTL does not retroactively
							// change it. Prompt the user to restart so the new value takes
							// effect immediately, but only when all of the following hold:
							//   - autostop actually changed (toggled or new TTL value),
							//   - autostop is enabled after the change; disabling clears the
							//     running build's deadline server-side, so no restart is
							//     needed, and
							//   - the workspace is running; a stopped workspace picks up the
							//     new value on its next start.
							if (
								data.autostopChanged &&
								values.autostopEnabled &&
								workspace.latest_build.status === "running"
							) {
								setIsConfirmingApply(true);
							}
						}}
					/>
				))}
			<ConfirmDialog
				open={isConfirmingApply}
				title={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.restart_workspace_55e09b3f",
				)}
				description={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.would_you_like_to_restart_your_workspace_now_to__6940dbf5",
				)}
				confirmText={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.restart_6b983a81",
				)}
				cancelText={tI18n(
					"WorkspaceSettingsPage.WorkspaceSchedulePage.WorkspaceSchedulePage.apply_later_ec4934f4",
				)}
				hideCancel={false}
				onConfirm={() => {
					restartWorkspace();
					navigate(`/@${username}/${workspaceName}`);
				}}
				onClose={() => {
					// Keep the user on the schedule page; the saved value still
					// applies on the next workspace start.
					setIsConfirmingApply(false);
				}}
			/>
		</div>
	);
};

const getAutostart = (workspace: TypesGen.Workspace) =>
	scheduleToAutostart(workspace.autostart_schedule);

const getAutostop = (workspace: TypesGen.Workspace) =>
	ttlMsToAutostop(workspace.ttl_ms);

type SubmitScheduleData = {
	workspace: TypesGen.Workspace;
	autostart: TypesGen.UpdateWorkspaceAutostartRequest;
	autostartChanged: boolean;
	ttl: TypesGen.UpdateWorkspaceTTLRequest;
	autostopChanged: boolean;
};

const submitSchedule = async (data: SubmitScheduleData) => {
	const { autostartChanged, workspace, autostart, autostopChanged, ttl } = data;
	const actions: Promise<void>[] = [];

	if (autostartChanged) {
		actions.push(API.putWorkspaceAutostart(workspace.id, autostart));
	}

	if (autostopChanged) {
		actions.push(API.putWorkspaceAutostop(workspace.id, ttl));
	}

	return Promise.all(actions);
};

export default WorkspaceSchedulePage;
