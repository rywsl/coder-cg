import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
	MockBuildInfo,
	MockNoPermissions,
	MockPermissions,
} from "#/testHelpers/entities";
import { withDashboardProvider } from "#/testHelpers/storybook";
import { DeploymentSidebarView } from "./DeploymentSidebarView";

const meta: Meta<typeof DeploymentSidebarView> = {
	title: "modules/management/DeploymentSidebarView",
	component: DeploymentSidebarView,
	decorators: [withDashboardProvider],
	parameters: { showOrganizations: true },
	args: {
		permissions: MockPermissions,
		experiments: [],
		buildInfo: MockBuildInfo,
	},
};

export default meta;
type Story = StoryObj<typeof DeploymentSidebarView>;

export const NoViewUsers: Story = {
	args: {
		permissions: {
			...MockPermissions,
			viewAllUsers: false,
		},
	},
};

export const NoAuditLog: Story = {
	args: {
		permissions: {
			...MockPermissions,
			viewAnyAuditLog: false,
		},
	},
};

export const NoDeploymentValues: Story = {
	args: {
		permissions: {
			...MockPermissions,
			viewDeploymentConfig: false,
			editDeploymentConfig: false,
		},
	},
};

export const NoPermissions: Story = {
	args: {
		permissions: MockNoPermissions,
	},
};

export const CommercialEntriesHidden: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.queryByRole("link", { name: /Trial|Premium|License/ }),
		).not.toBeInTheDocument();
		await expect(
			canvas.getByRole("link", { name: "Network" }),
		).toBeInTheDocument();
	},
};
