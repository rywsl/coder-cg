import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { BannerConfig } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { Switch } from "#/components/Switch/Switch";
import { TableCell, TableRow } from "#/components/Table/Table";

interface AnnouncementBannerItemProps {
	enabled: boolean;
	backgroundColor?: string;
	message?: string;
	onUpdate: (banner: Partial<BannerConfig>) => Promise<void>;
	onEdit: () => void;
	onDelete: () => void;
}

export const AnnouncementBannerItem: FC<AnnouncementBannerItemProps> = ({
	enabled,
	backgroundColor = "#004852",
	message,
	onUpdate,
	onEdit,
	onDelete,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<TableRow>
			<TableCell className="align-middle pl-5">
				<Switch
					checked={enabled}
					aria-label={tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerItem.enabled_92c1cdfd",
					)}
					onCheckedChange={(checked) => {
						void onUpdate({ enabled: checked });
					}}
				/>
			</TableCell>
			<TableCell className={!enabled ? "text-content-disabled" : ""}>
				{message || (
					<em>
						{tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerItem.no_message_f4e72a06",
						)}
					</em>
				)}
			</TableCell>
			<TableCell>
				<div className="size-6 rounded-sm" style={{ backgroundColor }} />
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="icon-lg"
							variant="subtle"
							aria-label={tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerItem.open_menu_b40b3713",
							)}
						>
							<EllipsisVerticalIcon aria-hidden="true" />
							<span className="sr-only">
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerItem.open_menu_b40b3713",
								)}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit()}>
							<PencilIcon className="size-icon-xs" />
							{tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerItem.edit_2b8a1a00",
							)}
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-content-destructive focus:text-content-destructive"
							onClick={() => onDelete()}
						>
							<TrashIcon className="size-icon-xs" />
							{tI18n(
								"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerItem.delete_9ce78fe3",
							)}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
};
