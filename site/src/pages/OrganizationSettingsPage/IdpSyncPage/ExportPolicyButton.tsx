import { saveAs } from "file-saver";
import { DownloadIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getErrorDetail } from "#/api/errors";
import type {
	GroupSyncSettings,
	Organization,
	RoleSyncSettings,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";

interface DownloadPolicyButtonProps {
	syncSettings: RoleSyncSettings | GroupSyncSettings | undefined;
	type: "groups" | "roles";
	organization: Organization;
	download?: (file: Blob, filename: string) => void;
}

export const ExportPolicyButton: FC<DownloadPolicyButtonProps> = ({
	syncSettings,
	type,
	organization,
	download = saveAs,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [isDownloading, setIsDownloading] = useState(false);

	const canCreatePolicyJson =
		syncSettings?.field && Object.keys(syncSettings?.mapping).length > 0;

	return (
		<Button
			size="sm"
			variant="outline"
			disabled={!canCreatePolicyJson || isDownloading}
			onClick={async () => {
				if (canCreatePolicyJson) {
					try {
						setIsDownloading(true);
						const file = new Blob([JSON.stringify(syncSettings, null, 2)], {
							type: "application/json",
						});
						download(file, `${organization.name}_${type}-policy.json`);
					} catch (error) {
						console.error(error);
						toast.error(
							tI18n(
								"OrganizationSettingsPage.IdpSyncPage.ExportPolicyButton.failed_to_export_policy_json_6190c9c9",
							),
							{
								description: getErrorDetail(error),
							},
						);
					} finally {
						setIsDownloading(false);
					}
				}
			}}
		>
			<DownloadIcon />
			{tI18n(
				"OrganizationSettingsPage.IdpSyncPage.ExportPolicyButton.export_policy_e7653fac",
			)}
		</Button>
	);
};
