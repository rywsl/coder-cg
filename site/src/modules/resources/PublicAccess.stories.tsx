import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import { API } from "#/api/api";
import { MockWorkspace, MockWorkspaceAgentReady } from "#/testHelpers/entities";
import { MockPublicPortMapping } from "#/testHelpers/publicPorts";
import { PublicAccess } from "./PublicAccess";

const meta: Meta<typeof PublicAccess> = {
	title: "modules/resources/PublicAccess",
	component: PublicAccess,
	globals: { locale: "zh-CN" },
	args: {
		workspace: MockWorkspace,
		agent: MockWorkspaceAgentReady,
		browserOnly: false,
	},
	beforeEach: () => {
		spyOn(API, "getWorkspacePublicPortMappings").mockResolvedValue({
			enabled: true,
			mappings: [],
		});
		spyOn(API, "getAgentListeningPorts").mockResolvedValue({
			ports: [{ port: 5173, process_name: "node", network: "tcp" }],
		});
	},
};
export default meta;
type Story = StoryObj<typeof PublicAccess>;

export const PublishWithConsent: Story = {
	play: async ({ canvasElement }) => {
		const create = spyOn(
			API,
			"createWorkspacePublicPortMapping",
		).mockResolvedValue(MockPublicPortMapping);
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "公网访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await waitFor(() =>
			expect(dialog.getByText("此 Agent 尚未公开任何端口。")).toBeVisible(),
		);
		await userEvent.type(
			dialog.getByRole("spinbutton", { name: "远端 Web 端口" }),
			"5173",
		);
		await expect(
			dialog.getByRole("button", { name: "公开端口" }),
		).toBeDisabled();
		await userEvent.click(
			dialog.getByRole("checkbox", { name: "允许任何人免登录访问此端口" }),
		);
		await userEvent.click(dialog.getByRole("button", { name: "公开端口" }));
		await expect(create).toHaveBeenCalledWith(MockWorkspace.id, {
			agent_name: MockWorkspaceAgentReady.name,
			remote_port: 5173,
			protocol: "http",
			share_level: "public",
		});
	},
};

export const PublicAndOffline: Story = {
	args: { agent: { ...MockWorkspaceAgentReady, status: "disconnected" } },
	beforeEach: () => {
		spyOn(API, "getWorkspacePublicPortMappings").mockResolvedValue({
			enabled: true,
			mappings: [
				MockPublicPortMapping,
				{
					...MockPublicPortMapping,
					id: "b9d1dfe3-5240-4d02-aa6b-2ba8ba4dd2e0",
					remote_port: 8088,
					public_port: 18001,
					url: "https://212.64.22.217:18001",
				},
			],
		});
	},
	play: async ({ canvasElement }) => {
		const remove = spyOn(
			API,
			"deleteWorkspacePublicPortMapping",
		).mockResolvedValue();
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "公网访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(
			await dialog.findByRole("link", { name: MockPublicPortMapping.url }),
		).toHaveAttribute("href", MockPublicPortMapping.url);
		await expect(
			dialog.getByRole("button", { name: "公开端口" }),
		).toBeDisabled();
		await userEvent.click(
			dialog.getByRole("button", { name: "关闭端口 5173 的公网访问" }),
		);
		await expect(remove).toHaveBeenCalledWith(
			MockWorkspace.id,
			MockPublicPortMapping.id,
		);
		await expect(
			dialog.getByRole("link", { name: "https://212.64.22.217:18001" }),
		).toBeVisible();
	},
};

export const Disabled: Story = {
	beforeEach: () => {
		spyOn(API, "getWorkspacePublicPortMappings").mockResolvedValue({
			enabled: false,
			mappings: [],
		});
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "公网访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await waitFor(() =>
			expect(
				dialog.getByText(
					"部署尚未启用公网端口池，请联系管理员配置 HTTPS 和 FRP。",
				),
			).toBeVisible(),
		);
		await expect(
			dialog.queryByRole("button", { name: "公开端口" }),
		).not.toBeInTheDocument();
	},
};

export const BrowserOnly: Story = {
	args: { browserOnly: true },
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "公网访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await waitFor(() =>
			expect(
				dialog.getByText(
					"当前部署仅允许浏览器访问，不能创建公网分享。已有分享仍可关闭。",
				),
			).toBeVisible(),
		);
		await expect(
			dialog.getByRole("button", { name: "公开端口" }),
		).toBeDisabled();
	},
};

export const Loading: Story = {
	beforeEach: () => {
		spyOn(API, "getWorkspacePublicPortMappings").mockImplementation(
			() => new Promise(() => {}),
		);
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "公网访问" }),
		);
		await expect(
			await within(document.body).findByRole("status"),
		).toHaveTextContent("正在读取公开端口");
	},
};

export const Failure: Story = {
	beforeEach: () => {
		spyOn(API, "getWorkspacePublicPortMappings").mockRejectedValue(
			new Error("公网代理暂时不可用"),
		);
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(
			within(canvasElement).getByRole("button", { name: "公网访问" }),
		);
		const dialog = within(await within(document.body).findByRole("dialog"));
		await waitFor(() => expect(dialog.getByRole("alert")).toBeVisible());
		await expect(dialog.getByRole("button", { name: "重试" })).toBeEnabled();
	},
};
