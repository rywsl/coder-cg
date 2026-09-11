import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { mockApiError } from "#/testHelpers/entities";
import { SetupPageView } from "./SetupPageView";

const meta: Meta<typeof SetupPageView> = {
	title: "pages/SetupPage",
	component: SetupPageView,
};

export default meta;
type Story = StoryObj<typeof SetupPageView>;

export const Ready: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("textbox", { name: "Email" })).toBeVisible();
		await expect(canvas.queryByText(/trial/i)).not.toBeInTheDocument();
		await expect(canvas.queryByText(/premium/i)).not.toBeInTheDocument();
		await expect(canvas.queryByText(/contact sales/i)).not.toBeInTheDocument();
	},
};

export const WithGitHub: Story = {
	args: {
		authMethods: {
			github: { enabled: true, default_provider_configured: false },
			oidc: { enabled: false, signInText: "", iconUrl: "" },
			password: { enabled: true },
		},
	},
};

export const FormError: Story = {
	args: {
		error: mockApiError({
			validations: [{ field: "username", detail: "Username taken" }],
		}),
	},
};

export const Loading: Story = {
	args: {
		isLoading: true,
	},
};
