import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
	MockBuildInfo,
	MockProvisioner,
	MockProvisionerWithTags,
	MockUserProvisioner,
	mockApiError,
} from "#/testHelpers/entities";
import { OrganizationProvisionersPageView } from "./OrganizationProvisionersPageView";

const meta: Meta<typeof OrganizationProvisionersPageView> = {
	title: "pages/OrganizationProvisionersPage",
	component: OrganizationProvisionersPageView,
	args: {
		buildVersion: MockBuildInfo.version,
		provisioners: [
			MockProvisioner,
			{
				...MockUserProvisioner,
				status: "busy",
			},
			{
				...MockProvisionerWithTags,
				version: "0.0.0",
			},
			{
				...MockUserProvisioner,
				status: "offline",
			},
		],
		filter: {
			ids: "",
			offline: true,
		},
	},
};

export default meta;
type Story = StoryObj<typeof OrganizationProvisionersPageView>;

export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("table")).toBeVisible();
		await expect(canvas.queryByText(/premium/i)).not.toBeInTheDocument();
		await expect(
			canvas.queryByRole("link", { name: "Start trial for free" }),
		).not.toBeInTheDocument();
	},
};

export const Loading: Story = {
	args: {
		provisioners: undefined,
	},
};

export const Empty: Story = {
	args: {
		provisioners: [],
	},
};

export const WithError: Story = {
	args: {
		provisioners: undefined,
		error: mockApiError({
			message: "Fern is mad",
			detail: "Frieren slept in and didn't get groceries",
		}),
	},
};

export const FilterByID: Story = {
	args: {
		provisioners: [MockProvisioner],
		filter: {
			ids: MockProvisioner.id,
			offline: true,
		},
	},
};

export const FilterByOffline: Story = {
	args: {
		provisioners: [MockProvisioner],
		filter: {
			ids: "",
			offline: false,
		},
	},
};
