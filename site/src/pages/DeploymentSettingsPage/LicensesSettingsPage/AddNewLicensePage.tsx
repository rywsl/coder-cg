import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import { pageTitle } from "#/utils/page";
import { AddNewLicensePageView } from "./AddNewLicensePageView";

const AddNewLicensePage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const navigate = useNavigate();

	const {
		mutate: saveLicenseKeyApi,
		isPending: isCreating,
		error: savingLicenseError,
	} = useMutation({
		mutationFn: API.createLicense,
		onSuccess: () => {
			toast.success(
				tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePage.you_have_successfully_added_a_license_fbfcb3f5",
				),
			);
			navigate("/deployment/licenses?success=true");
		},
		onError: (error) =>
			toast.error(
				tI18n(
					"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePage.failed_to_save_license_key_7f348cba",
				),
				{
					description: getErrorDetail(error),
				},
			),
	});

	function saveLicenseKey(licenseKey: string) {
		saveLicenseKeyApi(
			{ license: licenseKey },
			{
				onSuccess: () => {
					toast.success(
						tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePage.you_have_successfully_added_a_license_fbfcb3f5",
						),
					);
					navigate("/deployment/licenses?success=true");
				},
				onError: (error) =>
					toast.error(
						tI18n(
							"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePage.failed_to_save_license_key_7f348cba",
						),
						{
							description: getErrorDetail(error),
						},
					),
			},
		);
	}

	return (
		<>
			<title>
				{pageTitle(
					tI18n(
						"DeploymentSettingsPage.LicensesSettingsPage.AddNewLicensePage.license_settings_13bb208a",
					),
				)}
			</title>
			<AddNewLicensePageView
				isSavingLicense={isCreating}
				savingLicenseError={savingLicenseError}
				onSaveLicenseKey={saveLicenseKey}
			/>
		</>
	);
};

export default AddNewLicensePage;
