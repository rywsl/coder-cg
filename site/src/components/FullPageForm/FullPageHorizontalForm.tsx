import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/Button/Button";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderSubtitle,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";

interface FullPageHorizontalFormProps {
	title: string;
	detail?: ReactNode;
	onCancel?: () => void;
	children?: ReactNode;
}

export const FullPageHorizontalForm: FC<FullPageHorizontalFormProps> = ({
	title,
	detail,
	onCancel,
	children,
}) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Margins size="medium">
			<PageHeader
				actions={
					onCancel && (
						<Button variant="outline" onClick={onCancel}>
							{tI18n("FullPageForm.FullPageHorizontalForm.cancel_19766ed6")}
						</Button>
					)
				}
			>
				<PageHeaderTitle>{title}</PageHeaderTitle>
				{detail && <PageHeaderSubtitle>{detail}</PageHeaderSubtitle>}
			</PageHeader>
			<div>{children}</div>
		</Margins>
	);
};
