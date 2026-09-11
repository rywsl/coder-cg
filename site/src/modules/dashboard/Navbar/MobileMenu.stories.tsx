import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FC } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
	MockSupportLinks,
	MockUserMember,
	MockUserOwner,
} from "#/testHelpers/entities";
import { MobileMenu } from "./MobileMenu";

const meta: Meta<typeof MobileMenu> = {
	title: "modules/dashboard/MobileMenu",
	parameters: {
		layout: "fullscreen",
		viewport: {
			defaultViewport: "iphone12",
		},
	},
	component: MobileMenu,
	args: {
		user: MockUserOwner,
		supportLinks: MockSupportLinks,
		onSignOut: fn(),
		isDefaultOpen: true,
		adminPermissions: {
			canViewDeployment: true,
			canViewOrganizations: true,
			canViewAISettings: true,
			canViewHealth: true,
		},
	},
	decorators: [withNavbarMock],
};

export default meta;
type Story = StoryObj<typeof MobileMenu>;

export const Closed: Story = {
	args: {
		isDefaultOpen: false,
	},
};

export const Admin: Story = {
	play: async (context) => {
		await openAdminSettings(context);
		const body = within(context.canvasElement.ownerDocument.body);
		await expect(body.queryByText(/workspace proxy/i)).not.toBeInTheDocument();
		await expect(body.queryByText(/audit/i)).not.toBeInTheDocument();
		await expect(body.queryByText(/connection log/i)).not.toBeInTheDocument();
		await expect(body.queryByText(/AI sessions/i)).not.toBeInTheDocument();
	},
};

export const OrgAdmin: Story = {
	args: {
		user: MockUserMember,
		adminPermissions: {
			canViewOrganizations: true,
		},
	},
	play: openAdminSettings,
};

export const Member: Story = {
	args: {
		user: MockUserMember,
		adminPermissions: {},
	},
};

export const UserSettings: Story = {
	play: async ({ canvasElement }) => {
		const user = userEvent.setup();
		const body = within(canvasElement.ownerDocument.body);
		const menuItem = await body.findByRole("menuitem", {
			name: /user settings/i,
		});
		await user.click(menuItem);
	},
};

function withNavbarMock(Story: FC) {
	return (
		<div className="h-[72px] border-0 border-b border-solid px-6 flex items-center justify-end">
			<Story />
		</div>
	);
}

async function openAdminSettings({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}) {
	const user = userEvent.setup();
	const body = within(canvasElement.ownerDocument.body);
	const menuItem = await body.findByRole("menuitem", {
		name: /admin settings/i,
	});
	await user.click(menuItem);
}
