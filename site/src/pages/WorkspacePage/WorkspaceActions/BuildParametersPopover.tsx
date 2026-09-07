import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { richParameters } from "#/api/queries/templates";
import type { TemplateVersionParameter, Workspace } from "#/api/typesGenerated";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { TopbarButton } from "#/components/FullPageLayout/Topbar";
import {
	HelpPopoverLink,
	HelpPopoverLinksGroup,
	HelpPopoverText,
	HelpPopoverTitle,
} from "#/components/HelpPopover/HelpPopover";
import { Link } from "#/components/Link/Link";
import { Loader } from "#/components/Loader/Loader";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/Popover/Popover";
import { docs } from "#/utils/docs";

interface BuildParametersPopoverProps {
	workspace: Workspace;
	disabled?: boolean;
	label: string;
}

export const BuildParametersPopover: FC<BuildParametersPopoverProps> = ({
	workspace,
	disabled,
	label,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const build = workspace.latest_build;
	const { data: templateVersionParameters } = useQuery(
		richParameters(build.template_version_id),
	);
	const ephemeralParameters = templateVersionParameters?.filter(
		(p) => p.ephemeral,
	);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<TopbarButton
					data-testid="build-parameters-button"
					disabled={disabled}
					className="min-w-fit"
				>
					<ChevronDownIcon />
					<span className="sr-only">{label}</span>
				</TopbarButton>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="bg-surface-secondary border-surface-quaternary w-[304px]"
			>
				<BuildParametersPopoverContent
					workspace={workspace}
					ephemeralParameters={ephemeralParameters}
				/>
			</PopoverContent>
		</Popover>
	);
};

interface BuildParametersPopoverContentProps {
	workspace: Workspace;
	ephemeralParameters: TemplateVersionParameter[] | undefined;
}

const BuildParametersPopoverContent: FC<BuildParametersPopoverContentProps> = ({
	workspace,
	ephemeralParameters,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	if (!ephemeralParameters) {
		return <Loader />;
	}

	if (ephemeralParameters.length === 0) {
		return (
			<div className="p-5 text-content-secondary">
				<HelpPopoverTitle>
					{tI18n(
						"WorkspacePage.WorkspaceActions.BuildParametersPopover.build_options_e2604caf",
					)}
				</HelpPopoverTitle>
				<HelpPopoverText>
					{tI18n(
						"WorkspacePage.WorkspaceActions.BuildParametersPopover.this_template_has_no_ephemeral_build_options_9782bb29",
					)}
				</HelpPopoverText>
				<HelpPopoverLinksGroup>
					<HelpPopoverLink
						href={docs(
							"/admin/templates/extending-templates/parameters#ephemeral-parameters",
						)}
					>
						{tI18n(
							"WorkspacePage.WorkspaceActions.BuildParametersPopover.read_the_docs_559b1cc4",
						)}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-5">
			<p className="m-0 text-sm text-content-secondary">
				{tI18n(
					"WorkspacePage.WorkspaceActions.BuildParametersPopover.this_workspace_has_ephemeral_parameters_which_ma_d81c5f9c",
				)}
			</p>
			<div>
				<ul className="list-none pl-3 space-y-2">
					{ephemeralParameters.map((param) => (
						<li key={param.name}>
							<p className="text-content-primary m-0 font-bold">
								{param.display_name || param.name}
							</p>
							{param.description && (
								<p className="m-0 text-sm text-content-secondary">
									{param.description}
								</p>
							)}
						</li>
					))}
				</ul>
			</div>
			<Link
				href={`/@${workspace.owner_name}/${workspace.name}/settings/parameters`}
				className="self-start"
			>
				{tI18n(
					"WorkspacePage.WorkspaceActions.BuildParametersPopover.go_to_workspace_parameters_1986a430",
				)}
			</Link>
		</div>
	);
};
