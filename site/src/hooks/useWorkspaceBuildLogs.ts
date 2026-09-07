import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { watchBuildLogsByBuildId } from "#/api/api";
import type { ProvisionerJobLog } from "#/api/typesGenerated";

export const useWorkspaceBuildLogs = (
	// buildId is optional because sometimes the build is not loaded yet
	buildId: string | undefined,
	enabled = true,
) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [logs, setLogs] = useState<ProvisionerJobLog[]>();
	const socket = useRef<WebSocket>(undefined);

	useEffect(() => {
		if (!buildId || !enabled) {
			socket.current?.close();
			return;
		}

		// Every time this hook is called reset the values
		setLogs(undefined);

		socket.current = watchBuildLogsByBuildId(buildId, {
			// Retrieve all the logs
			after: -1,
			onMessage: (log) => {
				setLogs((previousLogs) => {
					if (!previousLogs) {
						return [log];
					}
					return [...previousLogs, log];
				});
			},
			onError: () => {
				toast.error(
					tI18n(
						"useWorkspaceBuildLogs.error_on_getting_value0_build_logs_367fcc16",
						{
							value0: buildId,
						},
					),
				);
			},
		});

		return () => {
			socket.current?.close();
		};
	}, [buildId, enabled]);

	return logs;
};
