import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LanguageMenu } from "./LanguageMenu";

const meta: Meta<typeof LanguageMenu> = {
	title: "components/LanguageMenu",
	component: LanguageMenu,
};

export default meta;
type Story = StoryObj<typeof LanguageMenu>;

export const SwitchToSimplifiedChinese: Story = {
	play: async ({ canvasElement }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await user.click(
			await canvas.findByRole("button", { name: "Change language" }),
		);
		await user.click(
			await within(document.body).findByRole("menuitemradio", {
				name: "Simplified Chinese",
			}),
		);

		await waitFor(() => {
			expect(document.documentElement.lang).toBe("zh-CN");
			expect(canvas.getByRole("button", { name: "切换语言" })).toBeVisible();
			expect(document.cookie).toContain("coder_locale=zh-CN");
		});
	},
};
