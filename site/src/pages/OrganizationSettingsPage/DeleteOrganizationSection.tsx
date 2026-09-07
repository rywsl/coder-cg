import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { DeleteDialog } from "#/components/Dialog/DeleteDialog/DeleteDialog";
import { FormSection, HorizontalForm } from "#/components/Form/Form";

type DeleteOrganizationSectionProps = {
	organizationName: string;
	onDeleteOrganization: () => void;
};

export const DeleteOrganizationSection: FC<DeleteOrganizationSectionProps> = ({
	organizationName,
	onDeleteOrganization,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [isDeleting, setIsDeleting] = useState(false);

	return (
		<>
			<HorizontalForm className="mt-12">
				<FormSection
					title={tI18n(
						"OrganizationSettingsPage.DeleteOrganizationSection.delete_organization_54b2edc7",
					)}
					description={tI18n(
						"OrganizationSettingsPage.DeleteOrganizationSection.delete_your_organization_permanently_e94e8c7c",
					)}
				>
					<div className="flex flex-col gap-4 grow">
						<div className="flex bg-surface-red items-center justify-between border border-solid border-border-destructive rounded-md p-3 pl-4 gap-2">
							<span>
								{tI18n(
									"OrganizationSettingsPage.DeleteOrganizationSection.deleting_an_organization_is_irreversible_3e3a7e13",
								)}
							</span>
							<Button
								variant="destructive"
								onClick={() => setIsDeleting(true)}
								className="min-w-fit"
							>
								{tI18n(
									"OrganizationSettingsPage.DeleteOrganizationSection.delete_this_organization_5c8cde83",
								)}
							</Button>
						</div>
					</div>
				</FormSection>
			</HorizontalForm>
			<DeleteDialog
				isOpen={isDeleting}
				onConfirm={async () => {
					await onDeleteOrganization();
					setIsDeleting(false);
				}}
				onCancel={() => setIsDeleting(false)}
				entity={tI18n(
					"OrganizationSettingsPage.DeleteOrganizationSection.organization_af3a1bb3",
				)}
				name={organizationName}
			/>
		</>
	);
};
