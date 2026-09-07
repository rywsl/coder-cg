import { cn } from "cn";
import { Building2Icon, UserIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { HealthMessage, ProvisionerDaemon } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";
import { createDayString } from "#/utils/createDayString";
import { ProvisionerTag } from "./ProvisionerTag";

interface ProvisionerProps {
	readonly provisioner: ProvisionerDaemon;
	readonly warnings?: readonly HealthMessage[];
}

export const Provisioner: FC<ProvisionerProps> = ({
	provisioner,
	warnings,
}) => {
	const { t: tI18n } = useTranslation("administration");

	const daemonScope = provisioner.tags.scope || "organization";
	const iconScope =
		daemonScope === "organization" ? (
			<Building2Icon className="size-icon-sm" />
		) : (
			<UserIcon className="size-icon-sm" />
		);

	const extraTags = Object.entries(provisioner.tags).filter(
		([key]) => key !== "scope" && key !== "owner",
	);
	const isWarning = warnings && warnings.length > 0;
	return (
		<div
			key={provisioner.name}
			className={cn(
				"rounded-lg border border-solid border-border text-sm",
				isWarning && "border-border-warning",
			)}
		>
			<header className="p-6 flex items-center justify-between gap-6">
				<div className="flex items-center gap-6 object-fill">
					<div className="leading-relaxed">
						<h4 className="font-medium m-0">{provisioner.name}</h4>
						<span className="text-content-secondary">
							<code>{provisioner.version}</code>
						</span>
					</div>
				</div>
				<div className="ml-auto flex flex-wrap gap-3 justify-end">
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge size="md">
								{iconScope}
								<span className="first-letter:uppercase">{daemonScope}</span>
							</Badge>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{tI18n("provisioners.Provisioner.scope_b073f6c6")}
						</TooltipContent>
					</Tooltip>
					{extraTags.map(([key, value]) => (
						<ProvisionerTag key={key} tagName={key} tagValue={value} />
					))}
				</div>
			</header>
			<div className="border-solid border-0 border-t border-border flex items-center justify-between py-3 px-6 text-xs text-content-secondary">
				{warnings && warnings.length > 0 ? (
					<div className="flex flex-col">
						{warnings.map((warning) => (
							<span key={warning.code}>{warning.message}</span>
						))}
					</div>
				) : (
					<span>{tI18n("provisioners.Provisioner.no_warnings_3a1134d5")}</span>
				)}
				{provisioner.last_seen_at && (
					<span className="text-content-primary" data-pixel="ignore">
						{tI18n("provisioners.Provisioner.last_seen_af14468f")}
						{createDayString(provisioner.last_seen_at)}
					</span>
				)}
			</div>
		</div>
	);
};
