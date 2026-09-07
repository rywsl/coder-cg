import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceResource } from "#/api/typesGenerated";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import {
	Sidebar,
	SidebarCaption,
	SidebarItem,
} from "#/components/FullPageLayout/Sidebar";
import { Skeleton } from "#/components/Skeleton/Skeleton";
import { getResourceIconPath } from "#/utils/workspace";

type ResourcesSidebarProps = {
	failed: boolean;
	resources: WorkspaceResource[];
	onChange: (resource: WorkspaceResource) => void;
	isSelected: (resource: WorkspaceResource) => boolean;
};

export const ResourcesSidebar: FC<ResourcesSidebarProps> = ({
	failed,
	onChange,
	isSelected,
	resources,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<Sidebar>
			<SidebarCaption>
				{tI18n("WorkspacePage.ResourcesSidebar.resources_e89b30aa")}
			</SidebarCaption>
			{failed && (
				<p className="m-0 py-4 text-sm font-normal text-content-secondary leading-normal">
					{tI18n(
						"WorkspacePage.ResourcesSidebar.your_workspace_build_failed_so_the_necessary_res_5700d562",
					)}
				</p>
			)}
			{resources.length === 0 &&
				!failed &&
				Array.from({ length: 8 }, (_, i) => (
					<SidebarItem key={i}>
						<ResourceSidebarItemSkeleton />
					</SidebarItem>
				))}
			{resources.map((r) => (
				<SidebarItem
					onClick={() => onChange(r)}
					isActive={isSelected(r)}
					key={r.id}
					className="leading-normal flex items-center gap-3"
				>
					<div className="flex items-center justify-center leading-none size-4 p-0.5">
						<ExternalImage
							className="w-full h-full object-contain"
							src={getResourceIconPath(r.type)}
							alt=""
						/>
					</div>
					<div className="flex flex-col font-medium">
						<span>{r.name}</span>
						<span className="text-sm text-content-secondary">{r.type}</span>
					</div>
				</SidebarItem>
			))}
		</Sidebar>
	);
};

const ResourceSidebarItemSkeleton: FC = () => {
	return (
		<div className="leading-normal flex items-center gap-3 pointer-events-none">
			<Skeleton variant="circular" width={16} height={16} />
			<div>
				<Skeleton variant="text" width={94} height={16} />
				<Skeleton variant="text" width={60} height={14} className="mt-0.5" />
			</div>
		</div>
	);
};
