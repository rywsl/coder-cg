import { XIcon } from "lucide-react";
import { type FC, useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";

type TagInputProps = {
	label: string;
	id?: string;
	values: string[];
	onChange: (values: string[]) => void;
};

export const TagInput: FC<TagInputProps> = ({
	label,
	id,
	values,
	onChange,
}) => {
	const { t: tI18n } = useTranslation("components");

	const baseId = useId();

	const itemIds = useMemo(() => {
		return Array.from(
			{ length: values.length },
			(_, index) => `${baseId}-item-${index}`,
		);
	}, [baseId, values.length]);

	return (
		<div>
			<div
				className="flex flex-wrap min-h-10 px-1.5 py-1.5 gap-2 border border-border border-solid relative rounded-md
				focus-within:border-content-link focus-within:border-2 focus-within:-top-px focus-within:-left-px"
			>
				{values.map((value, index) => (
					<Badge key={itemIds[index]} size="md" className="gap-1 pr-1">
						{value}
						<Button
							type="button"
							variant="subtle"
							className="p-0 min-w-0 h-auto [&_svg]:pr-0 rounded-full"
							onClick={() => {
								onChange(values.filter((oldValue) => oldValue !== value));
							}}
							aria-label={tI18n("TagInput.TagInput.remove_value0_e224cf24", {
								value0: value,
							})}
						>
							<XIcon className="size-icon-xs! pr-0!" />
						</Button>
					</Badge>
				))}
				<input
					id={id}
					aria-label={label}
					className="grow text-inherit p-0 border-none bg-transparent focus:outline-hidden"
					onKeyDown={(event) => {
						if (event.key === ",") {
							event.preventDefault();
							const newValue = event.currentTarget.value;
							onChange([...values, newValue]);
							event.currentTarget.value = "";
							return;
						}

						if (event.key === "Backspace" && event.currentTarget.value === "") {
							event.preventDefault();

							if (values.length === 0) {
								return;
							}

							const lastValue = values[values.length - 1];
							onChange(values.slice(0, -1));
							event.currentTarget.value = lastValue;
						}
					}}
					onBlur={(event) => {
						if (event.currentTarget.value !== "") {
							const newValue = event.currentTarget.value;
							onChange([...values, newValue]);
							event.currentTarget.value = "";
						}
					}}
				/>
			</div>
			<p className="text-content-secondary text-xs mt-1">
				{tI18n("TagInput.TagInput.type_to_separate_the_values_40d311be")}
			</p>
		</div>
	);
};
