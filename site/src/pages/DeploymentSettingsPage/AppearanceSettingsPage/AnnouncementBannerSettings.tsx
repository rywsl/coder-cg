import { PlusIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BannerConfig } from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { Link } from "#/components/Link/Link";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { AnnouncementBannerDialog } from "./AnnouncementBannerDialog";
import { AnnouncementBannerItem } from "./AnnouncementBannerItem";

const DEFAULT_BANNER: BannerConfig = {
	enabled: true,
	message: "",
	background_color: "#ABB8C3",
};

type NewBannerButtonProps = {
	onClick: () => void;
};

const NewBannerButton: FC<NewBannerButtonProps> = ({ onClick }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Button onClick={onClick} variant="outline">
			<PlusIcon />
			{tI18n(
				"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.new_announcement_93bff012",
			)}
		</Button>
	);
};

interface AnnouncementBannersettingsProps {
	isEntitled: boolean;
	announcementBanners: readonly BannerConfig[];
	onSubmit: (banners: readonly BannerConfig[]) => Promise<void>;
}

type EditingBanner = {
	/** `null` means creating a new banner. */
	index: number | null;
	banner: BannerConfig;
};

export const AnnouncementBannerSettings: FC<
	AnnouncementBannersettingsProps
> = ({ isEntitled, announcementBanners, onSubmit }) => {
	const { t: tI18n } = useTranslation("administration");

	const [banners, setBanners] = useState(announcementBanners);
	const [editingBanner, setEditingBanner] = useState<EditingBanner | null>(
		null,
	);
	const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);

	const openCreateDialog = () =>
		setEditingBanner({ index: null, banner: DEFAULT_BANNER });

	const updateBanner = (i: number, banner: Partial<BannerConfig>) => {
		const newBanners = [...banners];
		newBanners[i] = { ...banners[i], ...banner };
		setBanners(newBanners);
		return newBanners;
	};

	const removeBanner = (i: number) => {
		const newBanners = [...banners];
		newBanners.splice(i, 1);
		setBanners(newBanners);
		return newBanners;
	};

	const deletingBanner = deletingBannerId !== null && banners[deletingBannerId];

	return (
		<>
			<div>
				<SettingsHeader
					actions={
						isEntitled ? (
							<NewBannerButton onClick={openCreateDialog} />
						) : undefined
					}
				>
					<SettingsHeaderTitle hierarchy="secondary" level="h2">
						{tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.announcement_banners_aa164e15",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.display_message_banners_to_all_users_1928dc5a",
						)}
						{!isEntitled && (
							<>
								{" "}
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.your_license_does_not_include_service_banners_3dbb17e4",
								)}{" "}
								<Link href="mailto:sales@coder.com" showExternalIcon={false}>
									{tI18n(
										"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.contact_sales_604abea3",
									)}
								</Link>{" "}
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.to_learn_more_f4ee0f23",
								)}
							</>
						)}
					</SettingsHeaderDescription>
				</SettingsHeader>

				<Table
					aria-label={tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.announcement_banners_1efdc71c",
					)}
				>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[1%] pl-5">
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.enabled_92c1cdfd",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.message_2f77668a",
								)}
							</TableHead>
							<TableHead className="w-[2%]">
								{tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.color_6b73191a",
								)}
							</TableHead>
							<TableHead className="w-[1%]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{!isEntitled || banners.length < 1 ? (
							<TableEmpty
								message={tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.no_announcement_banners_e1ca4de0",
								)}
								description={tI18n(
									"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.create_a_banner_to_display_a_message_to_all_user_f7cc929e",
								)}
								cta={
									isEntitled ? (
										<NewBannerButton onClick={openCreateDialog} />
									) : undefined
								}
							/>
						) : (
							banners.map((banner, i) => (
								<AnnouncementBannerItem
									key={banner.message}
									enabled={banner.enabled && Boolean(banner.message)}
									backgroundColor={banner.background_color}
									message={banner.message}
									onEdit={() => setEditingBanner({ index: i, banner })}
									onUpdate={async (banner) => {
										const newBanners = updateBanner(i, banner);
										await onSubmit(newBanners);
									}}
									onDelete={() => setDeletingBannerId(i)}
								/>
							))
						)}
					</TableBody>
				</Table>
			</div>
			{editingBanner && (
				<AnnouncementBannerDialog
					banner={editingBanner.banner}
					onCancel={() => setEditingBanner(null)}
					onUpdate={async (banner) => {
						const nextBanner = { ...editingBanner.banner, ...banner };
						const newBanners =
							editingBanner.index === null
								? [...banners, nextBanner]
								: banners.map((existing, i) =>
										i === editingBanner.index ? nextBanner : existing,
									);
						setBanners(newBanners);
						setEditingBanner(null);
						await onSubmit(newBanners);
					}}
				/>
			)}
			{deletingBanner && (
				<ConfirmDialog
					type="delete"
					open
					title={tI18n(
						"DeploymentSettingsPage.AppearanceSettingsPage.AnnouncementBannerSettings.delete_this_banner_23ed05d9",
					)}
					description={deletingBanner.message}
					onClose={() => setDeletingBannerId(null)}
					onConfirm={async () => {
						const newBanners = removeBanner(deletingBannerId);
						setDeletingBannerId(null);
						await onSubmit(newBanners);
					}}
				/>
			)}
		</>
	);
};
