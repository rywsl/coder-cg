import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { useFeatureVisibility } from "#/modules/dashboard/useFeatureVisibility";
import { RequirePermission } from "#/modules/permissions/RequirePermission";
import { pageTitle } from "#/utils/page";
import { CreateOrganizationPageView } from "./CreateOrganizationPageView";

const CreateOrganizationPage: FC = () => {
	const { t: tI18n } = useTranslation("administration");

	const feats = useFeatureVisibility();
	const { permissions } = useAuthenticated();

	return (
		<RequirePermission isFeatureVisible={permissions.createOrganization}>
			<title>
				{pageTitle(
					tI18n(
						"OrganizationSettingsPage.CreateOrganizationPage.new_organization_4876e647",
					),
				)}
			</title>
			<CreateOrganizationPageView
				isEntitled={feats.multiple_organizations}
				permissions={permissions}
			/>
		</RequirePermission>
	);
};

export default CreateOrganizationPage;
