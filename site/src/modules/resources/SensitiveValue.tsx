import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { CopyableValue } from "#/components/CopyableValue/CopyableValue";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";

interface SensitiveValueProps {
	value: string;
}

export const SensitiveValue: FC<SensitiveValueProps> = ({ value }) => {
	const { t: tI18n } = useTranslation("workspaces");

	const [shouldDisplay, setShouldDisplay] = useState(false);
	const displayValue = shouldDisplay ? value : "••••••••";
	const buttonLabel = shouldDisplay
		? tI18n("resources.SensitiveValue.hide_value_381d9c18")
		: tI18n("resources.SensitiveValue.show_value_fad206e2");
	const icon = shouldDisplay ? (
		<EyeOffIcon className="size-icon-xs" />
	) : (
		<EyeIcon className="size-icon-xs" />
	);

	return (
		<div className="flex items-center gap-1">
			<CopyableValue
				value={value}
				className="w-[calc(100%-22px)] overflow-hidden whitespace-nowrap text-ellipsis"
			>
				{displayValue}
			</CopyableValue>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={() => {
							setShouldDisplay((value) => !value);
						}}
						size="icon"
						variant="subtle"
						className="size-6"
						aria-label={buttonLabel}
					>
						{icon}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">{buttonLabel}</TooltipContent>
			</Tooltip>
		</div>
	);
};
