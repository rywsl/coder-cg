import { CheckIcon, PlusIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Organization } from "#/api/typesGenerated";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "#/components/Command/Command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/Popover/Popover";
import { SettingsSidebarNavItem } from "#/components/Sidebar/Sidebar";
import type { Permissions } from "#/modules/permissions";
import type { OrganizationPermissions } from "#/modules/permissions/organizations";

interface OrganizationsSettingsNavigationProps {
	/** The organization selected from the dropdown */
	activeOrganization: Organization | undefined;
	/** Permissions for the active organization */
	orgPermissions: OrganizationPermissions | undefined;
	/** Organizations and their permissions or undefined if still fetching. */
	organizations: readonly Organization[];
	/** Site-wide permissions. */
	permissions: Permissions;
}

/**
 * Displays navigation items for the active organization and a combobox to
 * switch between organizations.
 *
 * If organizations or their permissions are still loading, show a loader.
 */
export const OrganizationSidebarView: FC<
	OrganizationsSettingsNavigationProps
> = ({ activeOrganization, orgPermissions, organizations, permissions }) => {
	const { t: tI18n } = useTranslation("administration");

	const sortedOrganizations = [...organizations].sort((a, b) => {
		// active org first
		if (a.id === activeOrganization?.id) return -1;
		if (b.id === activeOrganization?.id) return 1;

		return a.display_name
			.toLowerCase()
			.localeCompare(b.display_name.toLowerCase());
	});

	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const navigate = useNavigate();

	return (
		<>
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						aria-expanded={isPopoverOpen}
						className="w-60 gap-2 justify-start"
					>
						{activeOrganization ? (
							<>
								<Avatar
									size="sm"
									src={activeOrganization.icon}
									fallback={activeOrganization.display_name}
								/>
								<span className="truncate">
									{activeOrganization.display_name || activeOrganization.name}
								</span>
							</>
						) : (
							<span className="truncate">
								{tI18n(
									"management.OrganizationSidebarView.no_organization_selected_278cd177",
								)}
							</span>
						)}
						<ChevronDownIcon className="ml-auto size-icon-sm!" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-60">
					<Command loop>
						<CommandInput
							placeholder={tI18n(
								"management.OrganizationSidebarView.find_organization_268a5563",
							)}
						/>
						<CommandList>
							<CommandEmpty>
								{tI18n(
									"management.OrganizationSidebarView.no_organization_found_1aa8362e",
								)}
							</CommandEmpty>
							<CommandGroup className="pb-2">
								<div className="flex flex-col max-h-[260px] overflow-y-auto">
									{sortedOrganizations.map((organization) => (
										<CommandItem
											key={organization.id}
											value={`${organization.display_name} ${organization.name}`}
											onSelect={() => {
												setIsPopoverOpen(false);
												navigate(urlForSubpage(organization.name));
											}}
											// There is currently an issue with the cmdk component for keyboard navigation
											// https://github.com/pacocoursey/cmdk/issues/322
											tabIndex={0}
										>
											<Avatar
												size="sm"
												src={organization.icon}
												fallback={organization.display_name}
											/>
											<span className="truncate">
												{organization?.display_name || organization?.name}
											</span>
											{activeOrganization?.name === organization.name && (
												<CheckIcon className="ml-auto" />
											)}
										</CommandItem>
									))}
								</div>
							</CommandGroup>
							{permissions.createOrganization && (
								<>
									{organizations.length > 1 && <CommandSeparator />}
									<CommandGroup>
										<CommandItem
											className="flex justify-center data-[selected=true]:bg-transparent"
											onSelect={() => {
												setIsPopoverOpen(false);
												setTimeout(() => {
													navigate("/organizations/new");
												}, 200);
											}}
										>
											<PlusIcon />
											{tI18n(
												"management.OrganizationSidebarView.create_organization_80ba4eb9",
											)}
										</CommandItem>
									</CommandGroup>
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{activeOrganization && orgPermissions && (
				<OrganizationSettingsNavigation
					key={activeOrganization.id}
					organization={activeOrganization}
					orgPermissions={orgPermissions}
				/>
			)}
		</>
	);
};

function urlForSubpage(organizationName: string, subpage = ""): string {
	return [`/organizations/${organizationName}`, subpage]
		.filter(Boolean)
		.join("/");
}

interface OrganizationSettingsNavigationProps {
	organization: Organization;
	orgPermissions: OrganizationPermissions;
}

const OrganizationSettingsNavigation: FC<
	OrganizationSettingsNavigationProps
> = ({ organization, orgPermissions }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<div className="flex flex-col gap-1 my-2">
			<SettingsSidebarNavItem end href={urlForSubpage(organization.name)}>
				{tI18n("management.OrganizationSidebarView.members_1044a4c0")}
			</SettingsSidebarNavItem>
			{orgPermissions.viewGroups && (
				<SettingsSidebarNavItem
					href={urlForSubpage(organization.name, "groups")}
				>
					{tI18n("management.OrganizationSidebarView.groups_39bbb719")}
				</SettingsSidebarNavItem>
			)}
			{orgPermissions.viewOrgRoles && (
				<SettingsSidebarNavItem
					href={urlForSubpage(organization.name, "roles")}
				>
					{tI18n("management.OrganizationSidebarView.roles_c2533705")}
				</SettingsSidebarNavItem>
			)}
			{orgPermissions.viewProvisioners &&
				orgPermissions.viewProvisionerJobs && (
					<>
						<SettingsSidebarNavItem
							href={urlForSubpage(organization.name, "provisioners")}
						>
							{tI18n(
								"management.OrganizationSidebarView.provisioners_82d4a12e",
							)}
						</SettingsSidebarNavItem>
						<SettingsSidebarNavItem
							href={urlForSubpage(organization.name, "provisioner-keys")}
						>
							{tI18n(
								"management.OrganizationSidebarView.provisioner_keys_3c2d4e86",
							)}
						</SettingsSidebarNavItem>
						<SettingsSidebarNavItem
							href={urlForSubpage(organization.name, "provisioner-jobs")}
						>
							{tI18n(
								"management.OrganizationSidebarView.provisioner_jobs_e4be4fbf",
							)}
						</SettingsSidebarNavItem>
					</>
				)}
			{orgPermissions.viewIdpSyncSettings && (
				<SettingsSidebarNavItem
					href={urlForSubpage(organization.name, "idp-sync")}
				>
					{tI18n("management.OrganizationSidebarView.idp_sync_4af5d734")}
				</SettingsSidebarNavItem>
			)}
			{orgPermissions.editSettings && (
				<SettingsSidebarNavItem
					href={urlForSubpage(organization.name, "settings")}
				>
					{tI18n("management.OrganizationSidebarView.settings_74a883a0")}
				</SettingsSidebarNavItem>
			)}
		</div>
	);
};
