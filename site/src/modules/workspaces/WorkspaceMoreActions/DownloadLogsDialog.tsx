import { cn } from "cn";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "react-query";
import { toast } from "sonner";
import { getErrorDetail } from "#/api/errors";
import { agentLogs, buildLogs } from "#/api/queries/workspaces";
import type { Workspace, WorkspaceAgent } from "#/api/typesGenerated";
import { Alert } from "#/components/Alert/Alert";
import {
	ConfirmDialog,
	type ConfirmDialogProps,
} from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { currentIntlLocale } from "#/i18n/locale";
import { getWorkspaceAgents } from "#/utils/workspace";

type DownloadLogsDialogProps = Pick<
	ConfirmDialogProps,
	"onConfirm" | "onClose" | "open"
> & {
	workspace: Workspace;
	download?: (zip: Blob, filename: string) => void;
};

type DownloadableFile = {
	name: string;
	blob: Blob | undefined;
};

export const DownloadLogsDialog: FC<DownloadLogsDialogProps> = ({
	workspace,
	open,
	onClose,
	download = saveAs,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const buildLogsQuery = useQuery({
		...buildLogs(workspace),
		enabled: open,
	});

	const allUniqueAgents = useMemo<readonly WorkspaceAgent[]>(() => {
		const allAgents = getWorkspaceAgents(workspace);

		// Can't use the "new Set()" trick because we're not dealing with primitives
		const uniqueAgents = new Map(allAgents.map((agent) => [agent.id, agent]));
		return [...uniqueAgents.values()];
	}, [workspace]);

	const agentLogQueries = useQueries({
		queries: allUniqueAgents.map((agent) => ({
			...agentLogs(agent.id),
			enabled: open,
		})),
	});

	// Note: trying to memoize this via useMemo got really clunky. Removing all
	// memoization for now, but if we get to a point where performance matters,
	// we should make it so that this state doesn't even begin to mount until the
	// user decides to open the Logs dropdown
	const allFiles: readonly DownloadableFile[] = (() => {
		const files = allUniqueAgents.map<DownloadableFile>((a, i) => {
			const name = `${a.name}-logs.txt`;
			const txt = agentLogQueries[i]?.data?.map((l) => l.output).join("\n");

			let blob: Blob | undefined;
			if (txt) {
				blob = new Blob([txt], { type: "text/plain" });
			}

			return { name, blob };
		});

		const buildLogsFile = {
			name: `${workspace.name}-build-logs.txt`,
			blob: buildLogsQuery.data
				? new Blob([buildLogsQuery.data.map((l) => l.output).join("\n")], {
						type: "text/plain",
					})
				: undefined,
		};

		files.unshift(buildLogsFile);
		return files;
	})();

	const [isDownloading, setIsDownloading] = useState(false);
	const isWorkspaceHealthy = workspace.health.healthy;
	const isLoadingFiles = allFiles.some((f) => f.blob === undefined);

	const downloadTimeoutIdRef = useRef<number | undefined>(undefined);
	useEffect(() => {
		const clearTimeoutOnUnmount = () => {
			window.clearTimeout(downloadTimeoutIdRef.current);
		};

		return clearTimeoutOnUnmount;
	}, []);

	return (
		<ConfirmDialog
			open={open}
			onClose={onClose}
			hideCancel={false}
			title={tI18n(
				"workspaces.WorkspaceMoreActions.DownloadLogsDialog.download_logs_9af63d68",
			)}
			confirmLoading={isDownloading}
			confirmText={tI18n(
				"workspaces.WorkspaceMoreActions.DownloadLogsDialog.download_d6eafe82",
			)}
			disabled={
				isDownloading ||
				// If a workspace isn't healthy, let the user download as many logs as
				// they can. Otherwise, wait for everything to come in
				(isWorkspaceHealthy && isLoadingFiles)
			}
			onConfirm={async () => {
				setIsDownloading(true);
				const zip = new JSZip();
				for (const f of allFiles) {
					if (f.blob) {
						zip.file(f.name, f.blob);
					}
				}

				try {
					const content = await zip.generateAsync({ type: "blob" });
					download(content, `${workspace.name}-logs.zip`);
					onClose();

					downloadTimeoutIdRef.current = window.setTimeout(() => {
						setIsDownloading(false);
					}, 200);
				} catch (error) {
					setIsDownloading(false);
					toast.error(
						tI18n(
							"workspaces.WorkspaceMoreActions.DownloadLogsDialog.error_downloading_workspace_value0_logs_d1ffe842",
							{
								value0: workspace.name,
							},
						),
						{
							description: getErrorDetail(error),
						},
					);
					console.error(error);
				}
			}}
			description={
				<div className="flex flex-col gap-4 pb-4">
					<p>
						{tI18n(
							"workspaces.WorkspaceMoreActions.DownloadLogsDialog.downloading_logs_will_create_a_zip_file_containi_e86f727f",
						)}
					</p>

					{!isWorkspaceHealthy && isLoadingFiles && (
						<Alert severity="warning" prominent>
							{tI18n(
								"workspaces.WorkspaceMoreActions.DownloadLogsDialog.your_workspace_is_unhealthy_some_logs_may_be_una_65e6701c",
							)}
						</Alert>
					)}

					<ul className="list-none p-0 m-0 flex flex-col gap-2">
						{allFiles.map((f) => (
							<DownloadingItem
								key={f.name}
								file={f}
								giveUpTimeMs={isWorkspaceHealthy ? undefined : 5_000}
							/>
						))}
					</ul>
				</div>
			}
		/>
	);
};

type DownloadingItemProps = Readonly<{
	// A value of undefined indicates that the component will wait forever
	giveUpTimeMs?: number;
	file: DownloadableFile;
}>;

const DownloadingItem: FC<DownloadingItemProps> = ({ file, giveUpTimeMs }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [isWaiting, setIsWaiting] = useState(true);

	useEffect(() => {
		if (giveUpTimeMs === undefined || file.blob !== undefined) {
			setIsWaiting(true);
			return;
		}

		const timeoutId = window.setTimeout(
			() => setIsWaiting(false),
			giveUpTimeMs,
		);

		return () => window.clearTimeout(timeoutId);
	}, [giveUpTimeMs, file]);

	const { baseName, fileExtension } = extractFileNameInfo(file.name);

	return (
		<li className="w-full flex justify-between items-center gap-x-8">
			<span
				className={cn(
					"font-medium text-content-primary",
					"flex flex-row flex-nowrap gap-x-0 overflow-hidden",
					!isWaiting && "text-content-disabled",
				)}
			>
				<span className="min-w-0 shrink overflow-hidden text-ellipsis">
					{baseName}
				</span>
				<span className="shrink-0">.{fileExtension}</span>
			</span>
			<span className="shrink-0 text-sm whitespace-nowrap">
				{file.blob ? (
					humanBlobSize(file.blob.size)
				) : isWaiting ? (
					<Skeleton variant="text" width={48} height={12} />
				) : (
					<p
						className={cn(
							"flex flex-row flex-nowrap items-center gap-x-1",
							"text-content-disabled",
						)}
					>
						{tI18n(
							"workspaces.WorkspaceMoreActions.DownloadLogsDialog.not_available_67a926f7",
						)}
					</p>
				)}
			</span>
		</li>
	);
};

export function humanBlobSize(size: number) {
	const BLOB_SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;
	let i = 0;
	let sizeInUnits = size;
	while (sizeInUnits >= 1024 && i < BLOB_SIZE_UNITS.length - 1) {
		sizeInUnits /= 1024;
		i++;
	}

	const finalUnit = BLOB_SIZE_UNITS[i];

	// Round to 2 decimals and omit trailing zeros for whole numbers.
	const formattedSize = new Intl.NumberFormat(currentIntlLocale(), {
		maximumFractionDigits: 2,
	}).format(sizeInUnits);
	return `${formattedSize} ${finalUnit}`;
}

type FileNameInfo = Readonly<{
	baseName: string;
	fileExtension: string | undefined;
}>;

function extractFileNameInfo(filename: string): FileNameInfo {
	if (filename.length === 0) {
		return {
			baseName: "",
			fileExtension: undefined,
		};
	}

	const periodIndex = filename.lastIndexOf(".");
	if (periodIndex === -1) {
		return {
			baseName: filename,
			fileExtension: undefined,
		};
	}

	return {
		baseName: filename.slice(0, periodIndex),
		fileExtension: filename.slice(periodIndex + 1),
	};
}
