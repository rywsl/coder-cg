import type { Meta, StoryObj } from "@storybook/react-vite";
import { action } from "storybook/actions";
import { expect, within } from "storybook/test";
import { MockTemplate, mockApiError } from "#/testHelpers/entities";
import { withDashboardProvider } from "#/testHelpers/storybook";
import { TemplateSettingsPageView } from "./TemplateSettingsPageView";

const meta: Meta<typeof TemplateSettingsPageView> = {
	title: "pages/TemplateSettingsPage",
	component: TemplateSettingsPageView,
	args: {
		template: MockTemplate,
		accessControlEnabled: true,
		advancedSchedulingEnabled: true,
		onCancel: action("onCancel"),
	},
	decorators: [withDashboardProvider],
};

export default meta;
type Story = StoryObj<typeof TemplateSettingsPageView>;

export const Example: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole("textbox", { name: "Name" })).toBeVisible();
		await expect(canvas.queryByText(/premium/i)).not.toBeInTheDocument();
		await expect(
			canvas.queryByText(/deprecation message/i),
		).not.toBeInTheDocument();
		await expect(
			canvas.queryByText(/maximum port sharing level/i),
		).not.toBeInTheDocument();
	},
};

export const AgentsNotAllowed: Story = {
	args: {
		template: {
			...MockTemplate,
			agents_allowed: false,
		},
	},
};

export const SaveTemplateSettingsError: Story = {
	args: {
		submitError: mockApiError({
			message: 'Template "test" already exists.',
			validations: [
				{
					field: "name",
					detail: "This value is already in use and should be unique.",
				},
			],
		}),
		initialTouched: {
			allow_user_cancel_workspace_jobs: true,
		},
	},
};
