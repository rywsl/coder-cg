import dayjs from "dayjs";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { Button } from "#/components/Button/Button";
import type { DateRangeValue } from "#/components/DateRangePicker/DateRangePicker";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/DropdownMenu/DropdownMenu";
import { lastWeeks } from "./utils";

// There is no point in showing the period > 6 months. We prune stats older than
// 6 months.
export const numberOfWeeksOptions = [4, 12, 24] as const;

interface WeekPickerProps {
	value: DateRangeValue;
	onChange: (value: DateRangeValue) => void;
}

export const WeekPicker: FC<WeekPickerProps> = ({ value, onChange }) => {
	const { t: tI18n } = useTranslation("templates");

	const numberOfWeeks = dayjs(value.endDate).diff(
		dayjs(value.startDate),
		"week",
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					{tI18n("TemplatePage.TemplateInsightsPage.WeekPicker.last_69862ac1")}
					{numberOfWeeks}
					{tI18n("TemplatePage.TemplateInsightsPage.WeekPicker.weeks_8941244d")}
					<ChevronDownIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup
					value={String(numberOfWeeks)}
					onValueChange={(v) => onChange(lastWeeks(Number(v)))}
				>
					{numberOfWeeksOptions.map((option) => (
						<DropdownMenuRadioItem key={option} value={String(option)}>
							{tI18n(
								"TemplatePage.TemplateInsightsPage.WeekPicker.last_69862ac1",
							)}
							{option}
							{tI18n(
								"TemplatePage.TemplateInsightsPage.WeekPicker.weeks_8941244d",
							)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
