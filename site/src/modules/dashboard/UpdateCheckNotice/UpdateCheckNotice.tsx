import { cn } from "cn";
import { InfoIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { docs } from "#/utils/docs";

type UpdateCheckNoticeProps = {
	version: string;
	releaseNotesUrl: string;
	onDismiss: () => void;
	aboveDeploymentBanner?: boolean;
};

export const UpdateCheckNotice: FC<UpdateCheckNoticeProps> = ({
	version,
	releaseNotesUrl,
	onDismiss,
	aboveDeploymentBanner = false,
}) => {
	const { t: tI18n } = useTranslation("dashboard");

	return (
		<div
			data-testid="update-check-notice"
			role="status"
			className={cn(
				"fixed right-6 z-50 flex max-w-[420px] items-start gap-4 rounded border border-solid border-highlight-sky bg-surface-primary p-4 text-sm text-content-primary shadow-sm",
				// 60px keeps a 24px gap above the 36px deployment banner.
				aboveDeploymentBanner ? "bottom-[60px]" : "bottom-6",
			)}
		>
			<InfoIcon className="mt-0.5 size-icon-sm shrink-0 text-highlight-sky" />
			<div className="flex flex-col gap-1">
				<p className="m-0 font-semibold">
					{tI18n(
						"dashboard.UpdateCheckNotice.UpdateCheckNotice.coder_2bfab1f9",
					)}
					{version}
					{tI18n(
						"dashboard.UpdateCheckNotice.UpdateCheckNotice.is_now_available_7024daca",
					)}
				</p>
				<p className="m-0 flex-1 leading-5">
					{tI18n(
						"dashboard.UpdateCheckNotice.UpdateCheckNotice.view_the_12474878",
					)}{" "}
					<a
						href={releaseNotesUrl}
						target="_blank"
						rel="noreferrer"
						className="text-content-link underline hover:no-underline"
					>
						{tI18n(
							"dashboard.UpdateCheckNotice.UpdateCheckNotice.release_notes_03fffb85",
						)}
					</a>{" "}
					{tI18n("dashboard.UpdateCheckNotice.UpdateCheckNotice.and_6201111b")}{" "}
					<a
						href={docs("/install/upgrade")}
						target="_blank"
						rel="noreferrer"
						className="text-content-link underline hover:no-underline"
					>
						{tI18n(
							"dashboard.UpdateCheckNotice.UpdateCheckNotice.upgrade_instructions_af5792ed",
						)}
					</a>{" "}
					{tI18n(
						"dashboard.UpdateCheckNotice.UpdateCheckNotice.for_more_information_0895e3ea",
					)}
				</p>
			</div>
			<Button
				aria-label={tI18n(
					"dashboard.UpdateCheckNotice.UpdateCheckNotice.dismiss_48845bff",
				)}
				size="icon"
				variant="subtle"
				onClick={onDismiss}
				className="-m-2"
			>
				<XIcon />
			</Button>
		</div>
	);
};
