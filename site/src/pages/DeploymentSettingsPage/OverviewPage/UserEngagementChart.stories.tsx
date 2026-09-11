import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { UserEngagementChart } from "./UserEngagementChart";

const meta: Meta<typeof UserEngagementChart> = {
	title: "pages/DeploymentSettingsPage/GeneralSettingsPage/UserEngagementChart",
	component: UserEngagementChart,
	args: {
		data: [
			{ date: "1/1/2024", users: 140 },
			{ date: "1/2/2024", users: 175 },
			{ date: "1/3/2024", users: 120 },
			{ date: "1/4/2024", users: 195 },
			{ date: "1/5/2024", users: 230 },
			{ date: "1/6/2024", users: 130 },
			{ date: "1/7/2024", users: 210 },
		],
	},
};

export default meta;
type Story = StoryObj<typeof UserEngagementChart>;

export const Loaded: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "How we calculate engaged users" }),
		);
		await expect(
			canvas.getByText(/interact with a workspace, template, or agent/i),
		).toBeVisible();
		await expect(
			canvas.queryByRole("link", { name: /audit|license/i }),
		).not.toBeInTheDocument();
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

export const Loading: Story = {
	args: {
		data: undefined,
	},
};
