import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type {
	SerpentGroup,
	WorkspaceSSHGatewayRuntimeConfig,
	WorkspaceSSHGatewayStatus,
} from "#/api/typesGenerated";
import { Button } from "#/components/Button/Button";
import { docs } from "#/utils/docs";
import { NetworkSettingsPageView } from "./NetworkSettingsPageView";

const group: SerpentGroup = {
	name: "Networking",
	description: "",
};

const gatewayConfig: WorkspaceSSHGatewayRuntimeConfig = {
	listen_address: "0.0.0.0:2222",
	advertise_host: "ssh.coder.example.com",
	advertise_port: 2222,
	codex_base_url: "https://api.example.com/v1",
	codex_model: "gpt-5.3-codex",
	max_connections: 1024,
	max_pending_connections: 128,
	max_pending_connections_per_ip: 16,
	max_connections_per_user: 32,
	max_channels_per_connection: 64,
	auth_attempts_per_minute: 120,
	auth_attempts_burst: 20,
};

const stoppedGateway: WorkspaceSSHGatewayStatus = {
	config: gatewayConfig,
	configured: true,
	desired_enabled: false,
	state: "stopped",
	api_key_configured: true,
	host_public_key: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest",
	host_key_fingerprint: "SHA256:gateway-fingerprint",
	bound_address: "",
	error_code: "",
};

const meta: Meta<typeof NetworkSettingsPageView> = {
	title: "pages/DeploymentSettingsPage/NetworkSettingsPageView",
	component: NetworkSettingsPageView,
	args: {
		options: [
			{
				name: "DERP Server Enable",
				description:
					"Whether to enable or disable the embedded DERP relay server.",
				value: true,
				group,
				flag: "derp-server-enable",
				flag_shorthand: "d",
				hidden: false,
			},
			{
				name: "DERP Server Region Name",
				description: "Region name that for the embedded DERP server.",
				value: "aws-east",
				group,
				flag: "derp-server-region-name",
				flag_shorthand: "d",
				hidden: false,
			},
			{
				name: "DERP Server STUN Addresses",
				description:
					"Addresses for STUN servers to establish P2P connections. Set empty to disable P2P connections.",
				value: ["stun.l.google.com:19302", "stun.l.google.com:19301"],
				group,
				flag: "derp-server-stun-addresses",
				flag_shorthand: "d",
				hidden: false,
			},
			{
				name: "DERP Config URL",
				description:
					"URL to fetch a DERP mapping on startup. See: https://tailscale.com/kb/1118/custom-derp-servers/",
				value: "https://coder.com",
				group,
				flag: "derp-config-url",
				flag_shorthand: "d",
				hidden: false,
			},
			{
				name: "Wildcard Access URL",
				description: "",
				value: "https://coder.com",
				group,
				flag: "wildcard-access-url",
				flag_shorthand: "d",
				hidden: false,
			},
		],
		gateway: stoppedGateway,
		isGatewayLoading: false,
		isGatewaySaving: false,
		isGatewayStarting: false,
		isGatewayStopping: false,
		onSaveGateway: fn(),
		onStartGateway: fn(),
		onStopGateway: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof NetworkSettingsPageView>;

export const Stopped: Story = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const docsLinks = canvas.getAllByRole("link", { name: /View docs/ });
		await expect(docsLinks).toHaveLength(2);
		await expect(docsLinks[0]).toHaveAttribute(
			"href",
			docs("/admin/networking"),
		);
		await expect(docsLinks[1]).toHaveAttribute(
			"href",
			docs("/admin/networking/port-forwarding"),
		);

		const publicHost = canvas.getByRole("textbox", { name: /Public host/ });
		await userEvent.clear(publicHost);
		await userEvent.type(publicHost, "ssh.changed.example.com");
		await userEvent.click(
			canvas.getByRole("button", { name: "Save configuration" }),
		);
		await waitFor(() => {
			expect(args.onSaveGateway).toHaveBeenCalledWith(
				expect.objectContaining({
					config: expect.objectContaining({
						advertise_host: "ssh.changed.example.com",
					}),
					clear_codex_api_key: false,
				}),
				expect.any(Function),
			);
		});
	},
};

export const NotConfigured: Story = {
	args: {
		gateway: {
			...stoppedGateway,
			configured: false,
			api_key_configured: false,
			host_public_key: "",
			host_key_fingerprint: "",
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("button", { name: "Start" })).toBeDisabled();
		await expect(
			canvas.getByText(
				"The API key is stored as a deployment secret and is never returned by the API.",
			),
		).toBeVisible();
	},
};

export const Running: Story = {
	args: {
		gateway: {
			...stoppedGateway,
			desired_enabled: true,
			state: "running",
			bound_address: "0.0.0.0:2222",
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("status")).toHaveTextContent("Running");
		await expect(
			canvas.getByRole("textbox", { name: /Listen address/ }),
		).toBeDisabled();
		await userEvent.click(canvas.getByRole("button", { name: "Stop" }));
		await expect(args.onStopGateway).toHaveBeenCalledOnce();
	},
};

export const StartFailed: Story = {
	args: {
		gateway: {
			...stoppedGateway,
			state: "error",
			error_code: "listen_failed",
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("alert")).toHaveTextContent(
			"The listening address is unavailable",
		);
		await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
		await expect(args.onStartGateway).toHaveBeenCalledOnce();
	},
};

export const Loading: Story = {
	args: {
		gateway: undefined,
		isGatewayLoading: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByLabelText("Loading Workspace SSH Gateway settings"),
		).toBeVisible();
	},
};

export const LoadError: Story = {
	args: {
		gateway: undefined,
		gatewayError: new Error("Gateway status unavailable"),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("alert")).toHaveTextContent(
			"Gateway status unavailable",
		);
	},
};

export const SecretConfigured: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(
				"An API key is already stored. Leave this field blank to keep it.",
			),
		).toBeVisible();
		await expect(
			canvas.getByRole("checkbox", {
				name: "Clear the stored API key when saving",
			}),
		).toBeVisible();
	},
};

export const Starting: Story = {
	args: {
		gateway: { ...stoppedGateway, state: "starting" },
		isGatewayStarting: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("status")).toHaveTextContent("Starting");
		await expect(
			canvas.getByRole("button", { name: "Save configuration" }),
		).toBeDisabled();
	},
};

export const SaveSecret: Story = {
	args: { onSaveGateway: fn((_request, onSuccess) => onSuccess()) },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const key = canvas.getByLabelText("Codex API key");
		await userEvent.type(key, "test-secret");
		await userEvent.click(
			canvas.getByRole("button", { name: "Save configuration" }),
		);
		await waitFor(() =>
			expect(args.onSaveGateway).toHaveBeenCalledWith(
				expect.objectContaining({
					codex_api_key: "test-secret",
					clear_codex_api_key: false,
				}),
				expect.any(Function),
			),
		);
		await expect(key).toHaveValue("");
	},
};

export const ClearSecret: Story = {
	args: { onSaveGateway: fn((_request, onSuccess) => onSuccess()) },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const key = canvas.getByLabelText("Codex API key");
		await userEvent.type(key, "discarded-secret");
		const clear = canvas.getByRole("checkbox", {
			name: "Clear the stored API key when saving",
		});
		await userEvent.click(clear);
		await expect(key).toBeDisabled();
		await userEvent.click(
			canvas.getByRole("button", { name: "Save configuration" }),
		);
		await waitFor(() =>
			expect(args.onSaveGateway).toHaveBeenCalledWith(
				expect.objectContaining({
					codex_api_key: undefined,
					clear_codex_api_key: true,
				}),
				expect.any(Function),
			),
		);
		await expect(clear).not.toBeChecked();
		await expect(key).toHaveValue("");
	},
};

export const Stopping: Story = {
	args: {
		gateway: { ...stoppedGateway, state: "stopping", desired_enabled: true },
		isGatewayStopping: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("button", { name: /Stop/ })).toBeDisabled();
		await expect(
			canvas.getByRole("textbox", { name: /Public host/ }),
		).toBeDisabled();
	},
};

export const SimplifiedChinese: Story = {
	globals: { locale: "zh-CN" },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole("heading", { name: "工作区 SSH 网关" }),
		).toBeVisible();
		await userEvent.click(canvas.getByRole("button", { name: "启动" }));
		await expect(args.onStartGateway).toHaveBeenCalledOnce();
	},
};

export const RefetchPreservesEdits: Story = {
	render: function Render(args) {
		const [gateway, setGateway] = useState(stoppedGateway);
		return (
			<>
				<Button
					onClick={() =>
						setGateway({
							...stoppedGateway,
							config: {
								...gatewayConfig,
								advertise_host: "changed-by-another-admin.example.com",
							},
						})
					}
				>
					Refresh status
				</Button>
				<NetworkSettingsPageView {...args} gateway={gateway} />
			</>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const host = canvas.getByRole("textbox", { name: /Public host/ });
		const key = canvas.getByLabelText("Codex API key");
		await userEvent.clear(host);
		await userEvent.type(host, "my-unsaved-host.example.com");
		await userEvent.type(key, "my-unsaved-test-key");
		await userEvent.click(
			canvas.getByRole("button", { name: "Refresh status" }),
		);
		await expect(host).toHaveValue("my-unsaved-host.example.com");
		await expect(key).toHaveValue("my-unsaved-test-key");
	},
};
