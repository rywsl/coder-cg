import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import type {
	Group,
	GroupSyncSettings,
	Organization,
	Role,
	RoleSyncSettings,
} from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#/components/Tabs/Tabs";
import { IdpGroupSyncForm } from "./IdpGroupSyncForm";
import { IdpRoleSyncForm } from "./IdpRoleSyncForm";

interface IdpSyncPageViewProps {
	tab: string;
	groupSyncSettings: GroupSyncSettings | undefined;
	roleSyncSettings: RoleSyncSettings | undefined;
	claimFieldValues: readonly string[] | undefined;
	groups: Group[] | undefined;
	groupsMap: Map<string, string>;
	roles: Role[] | undefined;
	organization: Organization;
	onGroupSyncFieldChange: (value: string) => void;
	onRoleSyncFieldChange: (value: string) => void;
	error?: unknown;
	onSubmitGroupSyncSettings: (data: GroupSyncSettings) => void;
	onSubmitRoleSyncSettings: (data: RoleSyncSettings) => void;
}

const IdpSyncPageView: FC<IdpSyncPageViewProps> = ({
	tab,
	groupSyncSettings,
	roleSyncSettings,
	claimFieldValues,
	groups,
	groupsMap,
	roles,
	organization,
	onGroupSyncFieldChange,
	onRoleSyncFieldChange,
	error,
	onSubmitGroupSyncSettings,
	onSubmitRoleSyncSettings,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const [_, setSearchParams] = useSearchParams();
	const groupMappingCount = groupSyncSettings?.mapping
		? Object.entries(groupSyncSettings.mapping).length
		: 0;
	const legacyGroupMappingCount = groupSyncSettings?.legacy_group_name_mapping
		? Object.entries(groupSyncSettings.legacy_group_name_mapping).length
		: 0;
	const roleMappingCount = roleSyncSettings?.mapping
		? Object.entries(roleSyncSettings.mapping).length
		: 0;

	if (!groupSyncSettings || !roleSyncSettings || !groups) {
		return <Loader />;
	}

	return (
		<div className="flex flex-col gap-4">
			{Boolean(error) && <ErrorAlert error={error} />}
			<Tabs
				value={tab}
				onValueChange={(value: string) => {
					setSearchParams({ tab: value });
				}}
			>
				<TabsList>
					<TabsTrigger value="groups">
						{tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpSyncPageView.group_sync_settings_bd08e5c8",
						)}
					</TabsTrigger>
					<TabsTrigger value="roles">
						{tI18n(
							"OrganizationSettingsPage.IdpSyncPage.IdpSyncPageView.role_sync_settings_4d06808c",
						)}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="groups">
					<IdpGroupSyncForm
						groupSyncSettings={groupSyncSettings}
						claimFieldValues={claimFieldValues}
						groupMappingCount={groupMappingCount}
						legacyGroupMappingCount={legacyGroupMappingCount}
						groups={groups}
						groupsMap={groupsMap}
						organization={organization}
						onSubmit={onSubmitGroupSyncSettings}
						onSyncFieldChange={onGroupSyncFieldChange}
					/>
				</TabsContent>
				<TabsContent value="roles">
					<IdpRoleSyncForm
						roleSyncSettings={roleSyncSettings}
						claimFieldValues={claimFieldValues}
						roleMappingCount={roleMappingCount}
						roles={roles || []}
						organization={organization}
						onSubmit={onSubmitRoleSyncSettings}
						onSyncFieldChange={onRoleSyncFieldChange}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default IdpSyncPageView;
