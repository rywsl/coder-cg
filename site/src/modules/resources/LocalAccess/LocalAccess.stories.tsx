import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import { API } from "#/api/api";
import { deploymentSSHConfigQueryKey } from "#/api/queries/deployment";
import {
	localConnectorReleaseKey,
	localConnectorsKey,
} from "#/api/queries/localConnect";
import {
	MockDeploymentWorkspaceSSH,
	MockWorkspace,
	MockWorkspaceAgentReady,
} from "#/testHelpers/entities";
import {
	MockLocalConnector,
	MockLocalConnectorEnrollment,
} from "#/testHelpers/localConnect";
import { LocalAccess, localDeviceKey } from "./LocalAccess";

const meta: Meta<typeof LocalAccess> = {
	title: "modules/resources/LocalAccess",
	component: LocalAccess,
	globals: { locale: "zh-CN" },
	args: {
		workspace: MockWorkspace,
		agent: MockWorkspaceAgentReady,
		browserOnly: false,
	},
	beforeEach: () => {
		localStorage.removeItem(localDeviceKey(MockWorkspace.organization_id));
		spyOn(API, "getLocalConnectors").mockResolvedValue([]);
	},
	parameters: {
		queries: [
			{ key: localConnectorsKey(MockWorkspace.organization_id), data: [] },
			{ key: deploymentSSHConfigQueryKey, data: MockDeploymentWorkspaceSSH },
			{
				key: localConnectorReleaseKey,
				data: { version: "test", artifacts: [] },
			},
		],
	},
};
export default meta;
type Story = StoryObj<typeof LocalAccess>;

export const Unconfigured: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole("button", { name: "本地访问" }));
		const dialog = within(await within(document.body).findByRole("dialog"));
		await waitFor(() =>
			expect(dialog.getByText("此账号尚未注册本地连接器。")).toBeVisible(),
		);
		await expect(
			dialog.getByRole("button", { name: "设置此设备" }),
		).toBeEnabled();
	},
};

export const ConnectedWithPortConflict: Story = {
	beforeEach: () => {
		spyOn(API, "getLocalConnectors").mockResolvedValue([MockLocalConnector]);
		localStorage.setItem(
			localDeviceKey(MockWorkspace.organization_id),
			MockLocalConnector.id,
		);
	},
	parameters: {
		queries: [
			{
				key: localConnectorsKey(MockWorkspace.organization_id),
				data: [MockLocalConnector],
			},
			{ key: deploymentSSHConfigQueryKey, data: MockDeploymentWorkspaceSSH },
		],
	},
	play: async ({ canvasElement }) => {
		const update = spyOn(API, "updateLocalConnector").mockResolvedValue({
			...MockLocalConnector,
			desired: [],
		});
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(
			dialog.getByRole("link", { name: "打开 http://localhost:5174" }),
		).toHaveAttribute("href", "http://localhost:5174/");
		await userEvent.type(
			dialog.getByRole("textbox", { name: "远端 TCP 端口" }),
			"99999",
		);
		await userEvent.click(dialog.getByRole("button", { name: "添加端口" }));
		await expect(dialog.getByRole("alert")).toHaveTextContent(
			"请输入 1 至 65535 的整数端口。",
		);
		await expect(update).not.toHaveBeenCalled();
		await userEvent.click(
			dialog.getByRole("button", { name: "停止此工作区转发" }),
		);
		await expect(update).toHaveBeenCalledWith(
			MockWorkspace.organization_id,
			MockLocalConnector.id,
			{ revision: 1, desired: [] },
		);
	},
};

export const StoppedCanRevoke: Story = {
	...ConnectedWithPortConflict,
	args: { agent: { ...MockWorkspaceAgentReady, status: "disconnected" } },
	play: async ({ canvasElement }) => {
		const revoke = spyOn(API, "deleteWorkspaceSSHKey").mockResolvedValue();
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(
			dialog.getByRole("button", { name: "设置此设备" }),
		).toBeDisabled();
		await userEvent.click(dialog.getByRole("button", { name: "撤销设备" }));
		await expect(revoke).toHaveBeenCalledWith(
			MockWorkspace.organization_id,
			MockLocalConnector.workspace_ssh_key_id,
		);
	},
};

export const BrowserOnly: Story = {
	args: { browserOnly: true },
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(
			dialog.getByRole("button", { name: "设置此设备" }),
		).toBeDisabled();
	},
};

const capacityLimitedDevice = {
	...MockLocalConnector,
	reported: MockLocalConnector.reported.map((port) => ({
		...port,
		error_code: "capacity",
	})),
};

export const CapacityLimited: Story = {
	beforeEach: () => {
		spyOn(API, "getLocalConnectors").mockResolvedValue([capacityLimitedDevice]);
		localStorage.setItem(
			localDeviceKey(MockWorkspace.organization_id),
			capacityLimitedDevice.id,
		);
	},
	parameters: {
		queries: [
			{
				key: localConnectorsKey(MockWorkspace.organization_id),
				data: [capacityLimitedDevice],
			},
			{ key: deploymentSSHConfigQueryKey, data: MockDeploymentWorkspaceSSH },
		],
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(dialog.getByRole("alert")).toHaveTextContent(
			"连接或通道已达到安全上限，请稍后重试。",
		);
		await expect(
			dialog.getByRole("link", { name: "打开 http://localhost:5174" }),
		).toHaveAttribute("href", "http://localhost:5174/");
	},
};

export const Loading: Story = {
	beforeEach: () => {
		spyOn(API, "getLocalConnectors").mockReturnValue(
			new Promise(() => undefined),
		);
	},
	parameters: { queries: [] },
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(dialog.getByRole("status")).toHaveTextContent("正在加载设备");
	},
};

export const FailedRequest: Story = {
	beforeEach: () => {
		spyOn(API, "createLocalConnectorEnrollment").mockRejectedValue(
			new Error("设备授权请求失败，请重试。"),
		);
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await userEvent.click(dialog.getByRole("button", { name: "设置此设备" }));
		await expect(await dialog.findByRole("alert")).toHaveTextContent(
			"设备授权请求失败，请重试。",
		);
		await expect(dialog.getByRole("combobox")).toBeEnabled();
	},
};

export const PairExactDevice: Story = {
	beforeEach: () => {
		spyOn(API, "getLocalConnectors").mockResolvedValue([MockLocalConnector]);
	},
	parameters: {
		queries: [
			{
				key: localConnectorsKey(MockWorkspace.organization_id),
				data: [MockLocalConnector],
			},
			{ key: deploymentSSHConfigQueryKey, data: MockDeploymentWorkspaceSSH },
			{
				key: localConnectorReleaseKey,
				data: { version: "test", artifacts: [] },
			},
		],
	},
	play: async ({ canvasElement }) => {
		spyOn(API, "createLocalConnectorEnrollment").mockResolvedValue(
			MockLocalConnectorEnrollment,
		);
		spyOn(API, "getWorkspaceSSHEnrollmentStatus").mockResolvedValue({
			enrollment_id: MockLocalConnectorEnrollment.enrollment_id,
			expires_at: MockLocalConnectorEnrollment.expires_at,
			status: "complete",
			workspace_ssh_key_id: MockLocalConnector.workspace_ssh_key_id,
		});
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "本地访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await userEvent.click(dialog.getByRole("button", { name: "设置此设备" }));
		await userEvent.click(
			await dialog.findByRole("button", { name: "使用刚授权的设备" }),
		);
		await expect(
			dialog.getByRole("combobox", { name: "当前电脑对应的设备" }),
		).toHaveTextContent(MockLocalConnector.name);
		await expect(
			localStorage.getItem(localDeviceKey(MockWorkspace.organization_id)),
		).toBe(MockLocalConnector.id);
	},
};
