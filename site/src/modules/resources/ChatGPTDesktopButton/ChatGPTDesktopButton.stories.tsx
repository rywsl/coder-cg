import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";
import { reactRouterParameters } from "storybook-addon-remix-react-router";
import { API } from "#/api/api";
import { deploymentSSHConfigQueryKey } from "#/api/queries/deployment";
import { workspaceSSHKeysQueryKey } from "#/api/queries/workspaceSSH";
import type { WorkspaceSSHBootstrapResponse } from "#/api/typesGenerated";
import {
	MockDeploymentWorkspaceSSH,
	MockNoPermissions,
	MockUserMember,
	MockUserOwner,
	MockWorkspace,
	MockWorkspaceAgentReady,
	MockWorkspaceSSHKey,
} from "#/testHelpers/entities";
import { withAuthProvider, withToaster } from "#/testHelpers/storybook";
import {
	ChatGPTDesktopButton,
	chatGPTDesktopDeepLink,
	chatGPTDesktopDeviceStorageKey,
} from "./ChatGPTDesktopButton";

const workspaceWithUnicodePath = {
	...MockWorkspaceAgentReady,
	expanded_directory: "/home/coder/My 项目",
};

const expectedAlias = `${MockWorkspaceAgentReady.name}.${MockWorkspace.name}.${MockWorkspace.owner_name}.ssh.coder`;
const expectedDeepLink = chatGPTDesktopDeepLink(
	expectedAlias,
	workspaceWithUnicodePath.expanded_directory,
);
const deviceStorageKey = chatGPTDesktopDeviceStorageKey(
	MockWorkspace,
	MockWorkspaceAgentReady.name,
);

const bootstrap: WorkspaceSSHBootstrapResponse = {
	enrollment_id: "ca287b02-7c93-4014-b875-3513d33cf5a7",
	bash_command: "bash -c setup-chatgpt",
	powershell_command: "iex setup-chatgpt",
	alias: expectedAlias,
	project_path: workspaceWithUnicodePath.expanded_directory,
	deep_link: expectedDeepLink,
	expires_at: "2026-09-08T00:10:00Z",
};
const workspaceSSHKey = {
	...MockWorkspaceSSHKey,
	device_name: "开发笔记本",
};
const enrolledKey = {
	...workspaceSSHKey,
	id: "2405f04c-c524-4ac9-a121-f191de559a80",
	device_name: "此设备",
};

const meta: Meta<typeof ChatGPTDesktopButton> = {
	title: "modules/resources/ChatGPTDesktopButton",
	component: ChatGPTDesktopButton,
	decorators: [withAuthProvider, withToaster],
	globals: { locale: "zh-CN" },
	args: {
		agent: workspaceWithUnicodePath,
		workspace: MockWorkspace,
		browserOnly: false,
		deepLinkFallbackDelayMs: 0,
		enrollmentPollIntervalMs: 10,
		now: () => new Date("2026-09-08T00:00:00Z").getTime(),
		openDeepLink: fn(),
	},
	parameters: {
		user: MockUserMember,
		queries: [
			{
				key: deploymentSSHConfigQueryKey,
				data: MockDeploymentWorkspaceSSH,
			},
			{
				key: workspaceSSHKeysQueryKey(MockWorkspace.organization_name),
				data: [workspaceSSHKey],
			},
		],
	},
};

export default meta;
type Story = StoryObj<typeof ChatGPTDesktopButton>;

export const GatewayStopped: Story = {
	parameters: {
		user: MockUserOwner,
		permissions: { ...MockNoPermissions, editDeploymentConfig: true },
		reactRouter: reactRouterParameters({
			location: { path: "/" },
			routing: [
				{ path: "/", useStoryElement: true },
				{
					path: "/deployment/network",
					element: <h1>工作区 SSH 网关</h1>,
				},
			],
		}),
		queries: [
			{
				key: deploymentSSHConfigQueryKey,
				data: {
					...MockDeploymentWorkspaceSSH,
					workspace_ssh_gateway: {
						...MockDeploymentWorkspaceSSH.workspace_ssh_gateway,
						enabled: false,
						chatgpt_desktop_available: false,
					},
				},
			},
			{
				key: workspaceSSHKeysQueryKey(MockWorkspace.organization_name),
				data: [workspaceSSHKey],
			},
		],
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const button = await canvas.findByRole("button", {
			name: "在 ChatGPT 中打开",
		});
		await expect(button).toHaveAttribute("aria-disabled", "true");
		await userEvent.hover(button);
		await expect(
			await within(document.body).findByRole("tooltip"),
		).toHaveTextContent("工作区 SSH 网关尚未启用，请联系管理员配置并启动。");
		await userEvent.click(button);
		await expect(args.openDeepLink).not.toHaveBeenCalled();
		await userEvent.click(
			canvas.getByRole("button", { name: "管理 ChatGPT Desktop 连接" }),
		);
		const body = within(document.body);
		await expect(
			body.getByRole("menuitem", { name: "配置工作区 SSH 网关" }),
		).toHaveAttribute("href", "/deployment/network");
		await expect(
			body.getByRole("menuitem", { name: "撤销 开发笔记本" }),
		).not.toHaveAttribute("data-disabled");
		await userEvent.click(
			body.getByRole("menuitem", { name: "配置工作区 SSH 网关" }),
		);
		await expect(
			await canvas.findByRole("heading", { name: "工作区 SSH 网关" }),
		).toBeVisible();
	},
};

export const GatewayStoppedForMember: Story = {
	...GatewayStopped,
	parameters: {
		...GatewayStopped.parameters,
		user: MockUserMember,
		permissions: MockNoPermissions,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			await canvas.findByRole("button", { name: "在 ChatGPT 中打开" }),
		).toHaveAttribute("aria-disabled", "true");
		await userEvent.click(
			canvas.getByRole("button", { name: "管理 ChatGPT Desktop 连接" }),
		);
		await expect(
			within(document.body).queryByRole("menuitem", {
				name: "配置工作区 SSH 网关",
			}),
		).not.toBeInTheDocument();
	},
};

export const Loading: Story = {
	beforeEach: () => {
		spyOn(API, "getDeploymentSSHConfig").mockReturnValue(
			new Promise(() => undefined),
		);
	},
	parameters: { queries: [] },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button", {
			name: "在 ChatGPT 中打开",
		});
		await expect(button).toHaveAttribute("aria-disabled", "true");
		button.focus();
		await expect(button).toHaveFocus();
		await userEvent.click(button);
		await expect(args.openDeepLink).not.toHaveBeenCalled();
	},
};

export const Disabled: Story = {
	args: {
		agent: {
			...workspaceWithUnicodePath,
			status: "disconnected",
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button", {
			name: "在 ChatGPT 中打开",
		});
		await expect(button).toHaveAttribute("aria-disabled", "true");
		button.focus();
		await expect(button).toHaveFocus();
		await userEvent.click(button);
		await expect(args.openDeepLink).not.toHaveBeenCalled();
		await userEvent.hover(button);
		await expect(
			await within(document.body).findByRole("tooltip"),
		).toHaveTextContent("ChatGPT Desktop 需要正在运行且已就绪的 Linux Agent。");
	},
};

export const ConnectionError: Story = {
	beforeEach: () => {
		spyOn(API, "getDeploymentSSHConfig").mockRejectedValue(
			new Error("connection failed"),
		);
	},
	parameters: { queries: [] },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = await canvas.findByRole("button", {
			name: "在 ChatGPT 中打开",
		});
		await userEvent.hover(button);
		await expect(
			await within(document.body).findByRole("tooltip"),
		).toHaveTextContent("ChatGPT Desktop 连接不可用。");
	},
};

export const NotConfigured: Story = {
	beforeEach: () => {
		localStorage.removeItem(deviceStorageKey);
		spyOn(API, "createWorkspaceSSHBootstrap").mockResolvedValue(bootstrap);
	},
	parameters: {
		queries: [
			{
				key: deploymentSSHConfigQueryKey,
				data: MockDeploymentWorkspaceSSH,
			},
			{
				key: workspaceSSHKeysQueryKey(MockWorkspace.organization_name),
				data: [workspaceSSHKey],
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "在 ChatGPT 中打开" }),
		);
		const dialog = await within(document.body).findByRole("dialog", {
			name: "设置 ChatGPT Desktop",
		});
		await waitFor(() =>
			expect(within(dialog).getByText(bootstrap.bash_command)).toBeVisible(),
		);
		await userEvent.click(within(dialog).getByRole("tab", { name: "Windows" }));
		await waitFor(() =>
			expect(
				within(dialog).getByText(bootstrap.powershell_command),
			).toBeVisible(),
		);
	},
};

export const OtherWorkspaceConfigured: Story = {
	beforeEach: () => {
		localStorage.removeItem(deviceStorageKey);
		const otherKey = chatGPTDesktopDeviceStorageKey(
			{ ...MockWorkspace, id: "other-workspace", name: "other" },
			MockWorkspaceAgentReady.name,
		);
		localStorage.setItem(otherKey, workspaceSSHKey.id);
		localStorage.setItem(
			`chatgptDesktop.sshKey.${MockWorkspace.organization_id}`,
			workspaceSSHKey.id,
		);
		spyOn(API, "createWorkspaceSSHBootstrap").mockResolvedValue(bootstrap);
		return () => {
			localStorage.removeItem(otherKey);
			localStorage.removeItem(
				`chatgptDesktop.sshKey.${MockWorkspace.organization_id}`,
			);
		};
	},
	parameters: {
		queries: [
			{
				key: deploymentSSHConfigQueryKey,
				data: MockDeploymentWorkspaceSSH,
			},
			{
				key: workspaceSSHKeysQueryKey(MockWorkspace.organization_name),
				data: [workspaceSSHKey],
			},
		],
	},
	play: NotConfigured.play,
};

export const SetupError: Story = {
	beforeEach: () => {
		localStorage.removeItem(deviceStorageKey);
		spyOn(API, "createWorkspaceSSHBootstrap").mockRejectedValue(
			new Error("setup failed"),
		);
	},
	parameters: {
		queries: [
			{
				key: deploymentSSHConfigQueryKey,
				data: MockDeploymentWorkspaceSSH,
			},
			{
				key: workspaceSSHKeysQueryKey(MockWorkspace.organization_name),
				data: [workspaceSSHKey],
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "在 ChatGPT 中打开" }),
		);
		const dialog = await within(document.body).findByRole("dialog", {
			name: "设置 ChatGPT Desktop",
		});
		await waitFor(() =>
			expect(within(dialog).getByText("无法创建设置命令")).toBeVisible(),
		);
		await expect(
			within(dialog).queryByText(
				"Please check the developer console for more details.",
			),
		).not.toBeInTheDocument();
		await userEvent.click(within(dialog).getByRole("button", { name: "重试" }));
		await waitFor(() =>
			expect(API.createWorkspaceSSHBootstrap).toHaveBeenCalledTimes(2),
		);
	},
};

export const Configured: Story = {
	beforeEach: () => {
		localStorage.setItem(deviceStorageKey, workspaceSSHKey.id);
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "在 ChatGPT 中打开" }),
		);
		await expect(args.openDeepLink).toHaveBeenCalledWith(expectedDeepLink);
		await expect(expectedDeepLink).toContain(
			"projectPath=%2Fhome%2Fcoder%2FMy%20%E9%A1%B9%E7%9B%AE",
		);
	},
};

export const EnrollmentDetected: Story = {
	beforeEach: () => {
		localStorage.removeItem(deviceStorageKey);
		spyOn(API, "createWorkspaceSSHBootstrap").mockResolvedValue(bootstrap);
		spyOn(API, "getWorkspaceSSHEnrollmentStatus").mockResolvedValue({
			enrollment_id: bootstrap.enrollment_id,
			status: "complete",
			workspace_ssh_key_id: enrolledKey.id,
			expires_at: bootstrap.expires_at,
		});
		spyOn(API, "getWorkspaceSSHKeys").mockResolvedValue([workspaceSSHKey]);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "在 ChatGPT 中打开" }),
		);
		await within(document.body).findByRole("dialog", {
			name: "设置 ChatGPT Desktop",
		});
		await waitFor(() =>
			expect(localStorage.getItem(deviceStorageKey)).toBe(enrolledKey.id),
		);
	},
};

export const BrowserOnly: Story = {
	args: { browserOnly: true },
	beforeEach: () => {
		localStorage.setItem(deviceStorageKey, workspaceSSHKey.id);
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const launchButton = canvas.getByRole("button", {
			name: "在 ChatGPT 中打开",
		});
		await expect(launchButton).toHaveAttribute("aria-disabled", "true");
		await userEvent.click(launchButton);
		await expect(args.openDeepLink).not.toHaveBeenCalled();
		await userEvent.unhover(launchButton);
		await userEvent.hover(launchButton);
		await expect(
			await within(document.body).findByRole("tooltip"),
		).toHaveTextContent("仅浏览器模式策略已禁用 ChatGPT Desktop 连接。");
		await userEvent.click(
			canvas.getByRole("button", { name: "管理 ChatGPT Desktop 连接" }),
		);
		await expect(
			within(document.body).getByRole("menuitem", { name: "配置此设备" }),
		).toHaveAttribute("data-disabled");
		await expect(
			within(document.body).getByRole("menuitem", {
				name: `撤销 ${workspaceSSHKey.device_name}`,
			}),
		).not.toHaveAttribute("data-disabled");
	},
};

export const StoppedAgentCanRevoke: Story = {
	args: {
		agent: { ...workspaceWithUnicodePath, status: "disconnected" },
	},
	beforeEach: () => {
		localStorage.setItem(deviceStorageKey, workspaceSSHKey.id);
		spyOn(API, "deleteWorkspaceSSHKey").mockResolvedValue();
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "管理 ChatGPT Desktop 连接" }),
		);
		await userEvent.click(
			within(document.body).getByRole("menuitem", {
				name: `撤销 ${workspaceSSHKey.device_name}`,
			}),
		);
		await waitFor(() =>
			expect(API.deleteWorkspaceSSHKey).toHaveBeenCalledWith(
				MockWorkspace.organization_name,
				workspaceSSHKey.id,
			),
		);
	},
};

export const RevokeDevice: Story = {
	beforeEach: () => {
		localStorage.setItem(deviceStorageKey, workspaceSSHKey.id);
		spyOn(API, "deleteWorkspaceSSHKey").mockResolvedValue();
		spyOn(API, "getWorkspaceSSHKeys").mockResolvedValue([]);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", {
				name: "管理 ChatGPT Desktop 连接",
			}),
		);
		await userEvent.click(
			within(document.body).getByRole("menuitem", {
				name: `撤销 ${workspaceSSHKey.device_name}`,
			}),
		);
		await waitFor(() =>
			expect(API.deleteWorkspaceSSHKey).toHaveBeenCalledWith(
				MockWorkspace.organization_name,
				workspaceSSHKey.id,
			),
		);
		await waitFor(() =>
			expect(localStorage.getItem(deviceStorageKey)).toBeNull(),
		);
	},
};

export const DeepLinkFailure: Story = {
	args: { deepLinkFallbackDelayMs: 0 },
	beforeEach: () => {
		localStorage.setItem(deviceStorageKey, workspaceSSHKey.id);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "在 ChatGPT 中打开" }),
		);
		const dialog = await within(document.body).findByRole("dialog", {
			name: "ChatGPT Desktop 未能打开",
		});
		await waitFor(() =>
			expect(within(dialog).getByText(expectedAlias)).toBeVisible(),
		);
		await waitFor(() =>
			expect(
				within(dialog).getByText(workspaceWithUnicodePath.expanded_directory),
			).toBeVisible(),
		);
		await expect(
			within(dialog).getByRole("link", { name: "打开连接设置" }),
		).toHaveAttribute("href", "codex://settings/connections");
	},
};
