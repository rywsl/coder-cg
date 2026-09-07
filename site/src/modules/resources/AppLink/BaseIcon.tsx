import { LaptopIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceApp } from "#/api/typesGenerated";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";

interface BaseIconProps {
	app: WorkspaceApp;
	onIconPathError?: () => void;
}

export const BaseIcon: FC<BaseIconProps> = ({ app, onIconPathError }) => {
	const { t: tI18n } = useTranslation("workspaces");

	return app.icon ? (
		<ExternalImage
			alt={tI18n("resources.AppLink.BaseIcon.value0_icon_456d71b2", {
				value0: app.display_name,
			})}
			src={app.icon}
			style={{ pointerEvents: "none" }}
			onError={() => {
				console.warn(
					`Application icon for "${app.id}" has invalid source "${app.icon}".`,
				);
				onIconPathError?.();
			}}
		/>
	) : (
		<LaptopIcon />
	);
};
