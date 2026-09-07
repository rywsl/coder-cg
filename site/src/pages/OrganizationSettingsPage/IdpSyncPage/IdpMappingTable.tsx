import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "#/components/Link/Link";
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { docs } from "#/utils/docs";

interface IdpMappingTableProps {
	type: "Role" | "Group";
	rowCount: number;
	children: React.ReactNode;
}

export const IdpMappingTable: FC<IdpMappingTableProps> = ({
	type,
	rowCount,
	children,
}) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col gap-2">
			<Table>
				<TableHeader>
					<TableRow>
						<TableCell className="w-2/5">
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.idp_8a0182a9",
							)}
							{type.toLocaleLowerCase()}
						</TableCell>
						<TableCell className="w-3/5">
							{tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.coder_2bfab1f9",
							)}
							{type.toLocaleLowerCase()}
						</TableCell>
						<TableCell className="w-auto" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{rowCount === 0 ? (
						<TableEmpty
							message={tI18n(
								"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.no_value0_mappings_60357919",
								{
									value0: type.toLocaleLowerCase(),
								},
							)}
							isCompact
							cta={
								<Link
									href={docs(
										`/admin/users/idp-sync#${type.toLocaleLowerCase()}-sync`,
									)}
								>
									{tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.how_to_setup_idp_31a5bbb2",
									)}
									{type.toLocaleLowerCase()}
									{tI18n(
										"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.sync_d88ae06a",
									)}
								</Link>
							}
						/>
					) : (
						children
					)}
				</TableBody>
			</Table>
			<div className="flex justify-end">
				<div className="text-content-secondary text-xs">
					{tI18n(
						"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.showing_7282e1fb",
					)}
					<strong className="text-content-primary">{rowCount}</strong>{" "}
					{type.toLocaleLowerCase()}
					{(rowCount === 0 || rowCount > 1) &&
						tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpMappingTable.s_043a7187",
						)}
				</div>
			</div>
		</div>
	);
};
