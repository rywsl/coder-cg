import { cn } from "cn";
import type { FC, HTMLProps } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";

export const ProvisionerTags: FC<HTMLProps<HTMLDivElement>> = ({
	className,
	...props
}) => {
	return (
		<div
			{...props}
			className={cn(["flex items-center gap-1 flex-wrap py-0.5", className])}
		/>
	);
};

type ProvisionerTagProps = {
	label: string;
	value?: string;
};

export const ProvisionerTag: FC<ProvisionerTagProps> = ({ label, value }) => {
	const { t: tI18n } = useTranslation("administration");

	return (
		<Badge className="whitespace-nowrap">
			[{label}
			{value &&
				tI18n("provisioners.ProvisionerTags.value0_f4793e38", {
					value0: value,
				})}
			]
		</Badge>
	);
};

type ProvisionerTagsProps = {
	tags: Record<string, string>;
};

export const ProvisionerTruncateTags: FC<ProvisionerTagsProps> = ({ tags }) => {
	const keys = Object.keys(tags);

	if (keys.length === 0) {
		return null;
	}

	const firstKey = keys[0];
	const firstValue = tags[firstKey];
	const remainderCount = keys.length - 1;

	return (
		<ProvisionerTags>
			<ProvisionerTag label={firstKey} value={firstValue} />
			{remainderCount > 0 && <Badge>+{remainderCount}</Badge>}
		</ProvisionerTags>
	);
};
