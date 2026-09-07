import type { FC } from "react";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Button } from "#/components/Button/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { i18n } from "#/i18n";

const insightsIntervals = {
	day: {
		label: i18n.t(
			"templates:TemplatePage.TemplateInsightsPage.IntervalMenu.daily_b36c2611",
		),
	},
	week: {
		label: i18n.t(
			"templates:TemplatePage.TemplateInsightsPage.IntervalMenu.weekly_29751324",
		),
	},
} as const;

export type InsightsInterval = keyof typeof insightsIntervals;

interface IntervalMenuProps {
	value: InsightsInterval;
	onChange: (value: InsightsInterval) => void;
}

export const IntervalMenu: FC<IntervalMenuProps> = ({ value, onChange }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					{insightsIntervals[value].label}
					<ChevronDownIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(v) => onChange(v as InsightsInterval)}
				>
					{Object.entries(insightsIntervals).map(([interval, { label }]) => (
						<DropdownMenuRadioItem key={interval} value={interval}>
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
