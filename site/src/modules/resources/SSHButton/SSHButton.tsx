import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { deploymentSSHConfig } from "#/api/queries/deployment";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import {
	HelpPopoverLink,
	HelpPopoverLinksGroup,
	HelpPopoverText,
} from "#/components/HelpPopover/HelpPopover";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/Popover/Popover";
import { docs } from "#/utils/docs";

interface AgentSSHButtonProps {
	workspaceName: string;
	agentName: string;
	workspaceOwnerUsername: string;
}

export const AgentSSHButton: FC<AgentSSHButtonProps> = ({
	workspaceName,
	agentName,
	workspaceOwnerUsername,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	const { data } = useQuery(deploymentSSHConfig());
	const sshSuffix = data?.hostname_suffix;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="sm" variant="subtle">
					{tI18n("resources.SSHButton.SSHButton.connect_via_ssh_0a39f08e")}
					<ChevronDownIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="py-4 px-6 w-80 text-content-secondary mt-[2px] bg-surface-secondary"
			>
				<HelpPopoverText>
					{tI18n(
						"resources.SSHButton.SSHButton.run_the_following_commands_to_connect_with_ssh_4e03379d",
					)}
				</HelpPopoverText>

				<ol style={{ margin: 0, padding: 0 }}>
					<div className="flex flex-col gap-1 mt-3">
						<SSHStep
							helpText={tI18n(
								"resources.SSHButton.SSHButton.configure_ssh_hosts_on_machine_fcc51a1e",
							)}
							codeExample="coder config-ssh"
						/>
						<SSHStep
							helpText={tI18n(
								"resources.SSHButton.SSHButton.connect_to_the_agent_7467e9bd",
							)}
							codeExample={`ssh ${agentName}.${workspaceName}.${workspaceOwnerUsername}.${sshSuffix}`}
						/>
					</div>
				</ol>

				<HelpPopoverLinksGroup>
					<HelpPopoverLink href="/install">
						{tI18n("resources.SSHButton.SSHButton.install_coder_cli_76f5466f")}
					</HelpPopoverLink>
					<HelpPopoverLink href={docs("/user-guides/workspace-access/vscode")}>
						{tI18n(
							"resources.SSHButton.SSHButton.connect_via_vs_code_remote_ssh_31199f6c",
						)}
					</HelpPopoverLink>
					<HelpPopoverLink
						href={docs("/user-guides/workspace-access/jetbrains")}
					>
						{tI18n(
							"resources.SSHButton.SSHButton.connect_via_jetbrains_ides_c053c46c",
						)}
					</HelpPopoverLink>
					<HelpPopoverLink href={docs("/user-guides/desktop")}>
						{tI18n(
							"resources.SSHButton.SSHButton.connect_via_coder_desktop_5456b69d",
						)}
					</HelpPopoverLink>
					<HelpPopoverLink href={docs("/user-guides/workspace-access#ssh")}>
						{tI18n("resources.SSHButton.SSHButton.ssh_configuration_0d16c84b")}
					</HelpPopoverLink>
				</HelpPopoverLinksGroup>
			</PopoverContent>
		</Popover>
	);
};

interface SSHStepProps {
	helpText: string;
	codeExample: string;
}

const SSHStep: FC<SSHStepProps> = ({ helpText, codeExample }) => (
	<li style={{ listStylePosition: "inside" }}>
		<HelpPopoverText style={{ display: "inline" }}>
			<strong className="text-xs">{helpText}</strong>
		</HelpPopoverText>
		<CodeExample secret={false} code={codeExample} />
	</li>
);
