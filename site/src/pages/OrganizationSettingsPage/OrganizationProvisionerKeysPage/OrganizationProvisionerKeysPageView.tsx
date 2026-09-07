import type { FC } from "react";
import { useTranslation } from "react-i18next";
import {
	type ProvisionerKeyDaemons,
	ProvisionerKeyIDBuiltIn,
	ProvisionerKeyIDPSK,
	ProvisionerKeyIDUserAuth,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
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
import { TableLoader } from "#/components/TableLoader/TableLoader";
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import { ProvisionerKeyRow } from "./ProvisionerKeyRow";

// If the user using provisioner keys for external provisioners you're unlikely to
// want to keep the built-in provisioners.
const HIDDEN_PROVISIONER_KEYS = [
	ProvisionerKeyIDBuiltIn,
	ProvisionerKeyIDUserAuth,
	ProvisionerKeyIDPSK,
];

interface OrganizationProvisionerKeysPageViewProps {
	showPaywall: boolean | undefined;
	provisionerKeyDaemons: ProvisionerKeyDaemons[] | undefined;
	error: unknown;
	permissions: Permissions;
	onRetry: () => void;
}

export const OrganizationProvisionerKeysPageView: FC<
	OrganizationProvisionerKeysPageViewProps
> = ({ showPaywall, provisionerKeyDaemons, error, permissions, onRetry }) => {
	const { t: tI18n } = useTranslation("administration");

	const filteredProvisionerKeyDaemons = provisionerKeyDaemons?.filter(
		(pkd) => !HIDDEN_PROVISIONER_KEYS.includes(pkd.key.id),
	);

	return (
		<section className="w-full max-w-(--breakpoint-2xl) pb-10">
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.provisioner_keys_3c2d4e86",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.manage_provisioner_keys_used_to_authenticate_pro_e96c9692",
					)}{" "}
					<SettingsHeaderDocsLink href={docs("/admin/provisioners")} />
				</SettingsHeaderDescription>
			</SettingsHeader>
			{showPaywall ? (
				<PremiumPaywall
					source="provisioner_keys"
					message={tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.provisioners_82d4a12e",
					)}
					description={tI18n(
						"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.scoped_authentication_keys_for_org_provisioners_758e4685",
					)}
					features={[
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.scoped_per_organization_tag_4a40599a",
						),
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.recommended_provisioner_authentication_456d0fae",
						),
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.rotate_keys_without_downtime_514151cc",
						),
						tI18n(
							"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.fully_isolated_per_organization_897f8b10",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			) : (
				<Table className="mt-6">
					<TableHeader>
						<TableRow>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.name_dcd1d522",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.tags_1331275b",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.active_provisioners_0cc63c4e",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.created_d70b9e24",
								)}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredProvisionerKeyDaemons ? (
							filteredProvisionerKeyDaemons.length === 0 ? (
								<TableEmpty
									message={tI18n(
										"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.no_provisioner_keys_68c4769b",
									)}
									description={tI18n(
										"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.create_your_first_provisioner_key_to_authenticat_c041923a",
									)}
								/>
							) : (
								filteredProvisionerKeyDaemons.map((pkd) => (
									<ProvisionerKeyRow
										key={pkd.key.id}
										provisionerKey={pkd.key}
										provisioners={pkd.daemons}
										defaultIsOpen={false}
									/>
								))
							)
						) : error ? (
							<TableEmpty
								message={tI18n(
									"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.error_loading_provisioner_keys_3b4d253e",
								)}
								cta={
									<Button onClick={onRetry} size="sm">
										{tI18n(
											"OrganizationSettingsPage.OrganizationProvisionerKeysPage.OrganizationProvisionerKeysPageView.retry_942087cc",
										)}
									</Button>
								}
							/>
						) : (
							<TableLoader />
						)}
					</TableBody>
				</Table>
			)}
		</section>
	);
};
