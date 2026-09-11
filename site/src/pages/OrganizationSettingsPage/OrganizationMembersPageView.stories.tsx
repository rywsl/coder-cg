import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { mockSuccessResult } from "#/components/PaginationWidget/PaginationContainer.mocks";
import type { UsePaginatedQueryResult } from "#/hooks/usePaginatedQuery";
import {
	MockOrganizationMember,
	MockOrganizationMember2,
	MockOwnerRole,
	MockUserAdminRole,
	MockUserOwner,
} from "#/testHelpers/entities";
import { OrganizationMembersPageView } from "./OrganizationMembersPageView";

const meta: Meta<typeof OrganizationMembersPageView> = {
	title: "pages/OrganizationMembersPageView",
	component: OrganizationMembersPageView,
	args: {
		error: undefined,
		filterProps: {
			filter: {
				query: "",
				values: {},
				update: () => {},
				debounceUpdate: () => {},
				cancelDebounce: () => {},
				used: false,
			},
		},
		organizationName: "friends",
		membersQuery: {
			...mockSuccessResult,
			totalRecords: 2,
		} as UsePaginatedQueryResult,
		members: [
			{
				...MockOrganizationMember,
				global_roles: [MockOwnerRole, MockUserAdminRole],
			},
			MockOrganizationMember2,
		],
		addMembers: () => Promise.resolve(),
		onEditMemberRoles: () => Promise.resolve(),
		isUpdatingMemberRoles: false,
		removeMember: () => Promise.resolve(),
		me: MockUserOwner.id,
		canEditMembers: true,
		canViewMembers: true,
	},
};

export default meta;
type Story = StoryObj<typeof OrganizationMembersPageView>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.queryByRole("columnheader", { name: "Groups" }),
		).not.toBeInTheDocument();
		const [menuButton] = canvas.getAllByRole("button", { name: "Open menu" });
		if (!menuButton) {
			throw new Error("Expected a member actions menu");
		}
		await userEvent.click(menuButton);
		const body = within(canvasElement.ownerDocument.body);
		await expect(
			body.queryByRole("menuitem", { name: /activity/i }),
		).not.toBeInTheDocument();
	},
};

export const Loading: Story = {
	args: {
		members: undefined,
	},
};

export const NoMembers: Story = {
	args: {
		members: [],
		membersQuery: { ...mockSuccessResult, totalRecords: 0 },
	},
};

export const WithError: Story = {
	args: {
		error: "Something went wrong",
	},
};

export const NoEdit: Story = {
	args: {
		canEditMembers: false,
	},
};

export const UpdatingMember: Story = {
	args: {
		isUpdatingMemberRoles: true,
	},
};
