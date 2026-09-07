import { cn } from "cn";
import { ServerIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";

export const MCPServerIcon: FC<{
	iconUrl: string;
	name: string;
	className?: string;
}> = ({ iconUrl, name, className }) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded bg-surface-secondary border border-solid border-border",
				className,
			)}
		>
			{iconUrl ? (
				<ExternalImage
					src={iconUrl}
					alt={tI18n(
						"AISettingsPage.MCPServersPage.components.MCPServerIcon.value0_icon_43d0d0a9",
						{
							value0: name,
						},
					)}
					className="size-3/5"
				/>
			) : (
				<ServerIcon className="size-3/5 text-content-secondary" />
			)}
		</div>
	);
};
