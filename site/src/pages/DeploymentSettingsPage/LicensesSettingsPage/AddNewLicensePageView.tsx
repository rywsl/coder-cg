import { ChevronLeftIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { toast } from "sonner";
import { getErrorDetail } from "#/api/errors";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { FileUpload } from "#/components/FileUpload/FileUpload";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { Textarea } from "#/components/Textarea/Textarea";
import { Fieldset } from "../Fieldset";
import { DividerWithText } from "./DividerWithText";

type AddNewLicenseProps = {
	onSaveLicenseKey: (license: string) => void;
	isSavingLicense: boolean;
	savingLicenseError?: unknown;
};

export const AddNewLicensePageView: FC<AddNewLicenseProps> = ({
	onSaveLicenseKey,
	isSavingLicense,
	savingLicenseError,
}) => {
	const { t: tI18n } = useTranslation("administration");

	function handleFileUploaded(files: File[]) {
		const fileReader = new FileReader();
		fileReader.onload = () => {
			const licenseKey = fileReader.result as string;

			onSaveLicenseKey(licenseKey);

			fileReader.onerror = (error) => {
				toast.error(
					tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.failed_to_read_file_cb49d251",
					),
					{
						description: getErrorDetail(error),
					},
				);
			};
		};

		fileReader.readAsText(files[0]);
	}

	const isUploading = false;

	function onUpload(file: File) {
		handleFileUploaded([file]);
	}

	return (
		<>
			<div className="flex flex-row gap-4 items-baseline justify-between">
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.add_a_license_ea3f85ca",
						)}
					</SettingsHeaderTitle>
					<SettingsHeaderDescription>
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.get_access_to_high_availability_rbac_quotas_and__177de0d9",
						)}
					</SettingsHeaderDescription>
				</SettingsHeader>

				<Button asChild variant="outline">
					<RouterLink to="/deployment/licenses">
						<ChevronLeftIcon />
						{tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.all_licenses_dc4cb25f",
						)}
					</RouterLink>
				</Button>
			</div>
			{savingLicenseError && <ErrorAlert error={savingLicenseError} />}
			<FileUpload
				isUploading={isUploading}
				onUpload={onUpload}
				removeLabel={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.remove_file_b4e51ea4",
				)}
				title={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.upload_your_license_f1485251",
				)}
				description={tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.select_a_text_file_that_contains_your_license_ke_c61358e2",
				)}
			/>
			<div className="flex flex-col gap-4 pt-10">
				<DividerWithText>
					{tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.or_7175517a",
					)}
				</DividerWithText>

				<Fieldset
					title={tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.paste_your_license_3e111530",
					)}
					onSubmit={(e) => {
						e.preventDefault();

						const form = e.target;
						const formData = new FormData(form as HTMLFormElement);

						const licenseKey = formData.get("licenseKey");

						onSaveLicenseKey(licenseKey?.toString() || "");
					}}
					button={
						<Button type="submit" disabled={isSavingLicense}>
							{tI18n(
								"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.upload_license_fb57a366",
							)}
						</Button>
					}
				>
					<Textarea
						name="licenseKey"
						placeholder={tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePageView.enter_your_license_b6f427f0",
						)}
						rows={3}
					/>
				</Fieldset>
			</div>
		</>
	);
};
