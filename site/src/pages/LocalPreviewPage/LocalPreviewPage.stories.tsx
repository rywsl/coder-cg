import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn, userEvent, within } from "storybook/test";
import { API } from "#/api/api";
import { deploymentSSHConfigQueryKey } from "#/api/queries/deployment";
import { localConnectorsKey } from "#/api/queries/localConnect";
import { localDeviceKey } from "#/modules/resources/LocalAccess/LocalAccess";
import {
	MockDeploymentWorkspaceSSH,
	MockWorkspace,
	MockWorkspaceAgentReady,
} from "#/testHelpers/entities";
import { MockLocalConnector } from "#/testHelpers/localConnect";
import { withDashboardProvider } from "#/testHelpers/storybook";
import { LocalPreview } from "./LocalPreviewPage";

const meta: Meta<typeof LocalPreview> = {
	title: "pages/LocalPreviewPage",
	component: LocalPreview,
	decorators: [withDashboardProvider],
	globals: { locale: "zh-CN" },
	args: {
		workspace: MockWorkspace,
		agent: { ...MockWorkspaceAgentReady, status: "disconnected" },
		port: 5173,
	},
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
};
export default meta;
type Story = StoryObj<typeof LocalPreview>;

export const StoppedWorkspace: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.queryByRole("link", { name: /localhost/ }),
		).not.toBeInTheDocument();
		await expect(
			canvas.getByText(
				"路径代理可能不支持根路径资源或热更新，建议使用本地访问。",
			),
		).toBeVisible();
		await userEvent.click(canvas.getByRole("button", { name: "本地访问" }));
		const dialog = within(await within(document.body).findByRole("dialog"));
		await expect(dialog.getByRole("button", { name: "重连" })).toBeDisabled();
		await expect(
			dialog.getByRole("button", { name: "撤销设备" }),
		).toBeEnabled();
	},
};
