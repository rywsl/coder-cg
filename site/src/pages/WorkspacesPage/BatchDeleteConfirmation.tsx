import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ClockIcon, UserIcon } from "lucide-react";
import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "#/api/typesGenerated";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { getResourceIconPath } from "#/utils/workspace";

dayjs.extend(relativeTime);

type BatchDeleteConfirmationProps = {
	checkedWorkspaces: readonly Workspace[];
	open: boolean;
	isLoading: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export const BatchDeleteConfirmation: FC<BatchDeleteConfirmationProps> = ({
	checkedWorkspaces,
	open,
	onClose,
	onConfirm,
	isLoading,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [stage, setStage] = useState<
		"consequences" | "workspaces" | "resources"
	>("consequences");

	const onProceed = () => {
		switch (stage) {
			case "resources":
				onConfirm();
				break;
			case "workspaces":
				setStage("resources");
				break;
			case "consequences":
				setStage("workspaces");
				break;
		}
	};

	const workspaceCount = `${checkedWorkspaces.length} ${
		checkedWorkspaces.length === 1 ? "workspace" : "workspaces"
	}`;

	let confirmText: ReactNode = (
		<>
			{tI18n(
				"WorkspacesPage.BatchDeleteConfirmation.review_selected_workspaces_0beb56b3",
			)}
		</>
	);
	if (stage === "workspaces") {
		confirmText = (
			<>
				{tI18n("WorkspacesPage.BatchDeleteConfirmation.confirm_cb98700a")}
				{workspaceCount}&hellip;
			</>
		);
	}
	if (stage === "resources") {
		const resources = checkedWorkspaces
			.map((workspace) => workspace.latest_build.resources.length)
			.reduce((a, b) => a + b, 0);
		const resourceCount = `${resources} ${
			resources === 1 ? "resource" : "resources"
		}`;
		confirmText = (
			<>
				{tI18n("WorkspacesPage.BatchDeleteConfirmation.delete_85941fb9")}
				{workspaceCount}
				{tI18n("WorkspacesPage.BatchDeleteConfirmation.and_e3ee915a")}
				{resourceCount}
			</>
		);
	}

	// The flicker of these icons is quite noticeable if they aren't loaded in advance,
	// so we insert them into the document without actually displaying them yet.
	const resourceIconPreloads = [
		...new Set(
			checkedWorkspaces.flatMap((workspace) =>
				workspace.latest_build.resources.map(
					(resource) => resource.icon || getResourceIconPath(resource.type),
				),
			),
		),
	].map((url) => (
		<img key={url} alt="" aria-hidden className="sr-only" src={url} />
	));

	return (
		<ConfirmDialog
			type="delete"
			open={open}
			onClose={() => {
				setStage("consequences");
				onClose();
			}}
			title={tI18n(
				"WorkspacesPage.BatchDeleteConfirmation.delete_value0_50256b39",
				{
					value0: workspaceCount,
				},
			)}
			confirmLoading={isLoading}
			confirmText={confirmText}
			onConfirm={onProceed}
			description={
				<>
					{stage === "consequences" && <Consequences />}
					{stage === "workspaces" && (
						<Workspaces workspaces={checkedWorkspaces} />
					)}
					{stage === "resources" && (
						<Resources workspaces={checkedWorkspaces} />
					)}
					{resourceIconPreloads}
				</>
			}
		/>
	);
};

interface StageProps {
	workspaces: readonly Workspace[];
}

const Consequences: FC = () => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<>
			<p>
				{tI18n(
					"WorkspacesPage.BatchDeleteConfirmation.deleting_workspaces_is_irreversible_3688372c",
				)}
			</p>
			<ul className="flex flex-col gap-2 pl-4 mb-0">
				<li>
					{tI18n(
						"WorkspacesPage.BatchDeleteConfirmation.terraform_resources_belonging_to_deleted_workspa_39726340",
					)}
				</li>
				<li>
					{tI18n(
						"WorkspacesPage.BatchDeleteConfirmation.any_data_stored_in_the_workspace_will_be_permane_cd59d3eb",
					)}
				</li>
			</ul>
		</>
	);
};

const Workspaces: FC<StageProps> = ({ workspaces }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const mostRecent = workspaces.reduce(
		(latestSoFar, against) => {
			if (!latestSoFar) {
				return against;
			}

			return new Date(against.last_used_at).getTime() >
				new Date(latestSoFar.last_used_at).getTime()
				? against
				: latestSoFar;
		},
		undefined as Workspace | undefined,
	);

	const owners = new Set(workspaces.map((it) => it.owner_id)).size;
	const ownersCount = `${owners} ${owners === 1 ? "owner" : "owners"}`;

	return (
		<>
			<ul className="list-none p-0 border border-solid border-border rounded-lg overflow-x-hidden overflow-y-auto max-h-48">
				{workspaces.map((workspace) => (
					<li
						key={workspace.id}
						className="py-2 px-4 border-solid border-0 border-b border-border last:border-b-0"
					>
						<div className="flex items-center justify-between gap-6">
							<span className="font-medium text-content-primary max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">
								{workspace.name}
							</span>

							<div className="flex flex-col text-sm items-end">
								<div className="flex items-center gap-2">
									<span className="whitespace-nowrap">
										{workspace.owner_name}
									</span>
									<UserIcon className="size-icon-sm -m-px" />
								</div>
								<div className="flex items-center gap-2">
									<span className="whitespace-nowrap">
										{dayjs(workspace.last_used_at).fromNow()}
									</span>
									<ClockIcon className="size-icon-xs" />
								</div>
							</div>
						</div>
					</li>
				))}
			</ul>
			<div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm">
				<div className="flex items-center gap-2">
					<UserIcon className="size-icon-sm -m-px" />
					<span>{ownersCount}</span>
				</div>
				{mostRecent && (
					<div className="flex items-center gap-2">
						<ClockIcon className="size-icon-xs" />
						<span>
							{tI18n(
								"WorkspacesPage.BatchDeleteConfirmation.last_used_d18c1db4",
							)}
							{dayjs(mostRecent.last_used_at).fromNow()}
						</span>
					</div>
				)}
			</div>
		</>
	);
};

const Resources: FC<StageProps> = ({ workspaces }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const resources: Record<string, { count: number; icon: string }> = {};
	for (const workspace of workspaces) {
		for (const resource of workspace.latest_build.resources) {
			if (!resources[resource.type]) {
				resources[resource.type] = {
					count: 0,
					icon: resource.icon || getResourceIconPath(resource.type),
				};
			}

			resources[resource.type].count++;
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<p>
				{tI18n("WorkspacesPage.BatchDeleteConfirmation.deleting_21ed2f9e")}{" "}
				{workspaces.length === 1
					? tI18n(
							"WorkspacesPage.BatchDeleteConfirmation.this_workspace_3afd67e2",
						)
					: tI18n(
							"WorkspacesPage.BatchDeleteConfirmation.these_workspaces_92f72fe8",
						)}
				{tI18n(
					"WorkspacesPage.BatchDeleteConfirmation.will_also_permanently_destroy_f2f6f3de",
				)}
			</p>
			<div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm">
				{Object.entries(resources).map(([type, summary]) => (
					<div key={type} className="flex items-center gap-2">
						<ExternalImage src={summary.icon} width={16} height={16} />
						<span>
							{summary.count} <code>{type}</code>
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
