import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ProvisionerDaemon } from "#/api/typesGenerated";
import { ChevronDownIcon } from "#/components/AnimatedIcons/ChevronDown";
import { FormSection, VerticalForm } from "#/components/Form/Form";
import { TopbarButton } from "#/components/FullPageLayout/Topbar";
import { Link } from "#/components/Link/Link";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/Popover/Popover";
import { ProvisionerTagsField } from "#/modules/provisioners/ProvisionerTagsField";
import { docs } from "#/utils/docs";

interface ProvisionerTagsPopoverProps {
	tags: ProvisionerDaemon["tags"];
	onTagsChange: (values: ProvisionerDaemon["tags"]) => void;
}

export const ProvisionerTagsPopover: FC<ProvisionerTagsPopoverProps> = ({
	tags,
	onTagsChange,
}) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<Popover>
			<PopoverTrigger asChild>
				<TopbarButton color="neutral" size="icon">
					<ChevronDownIcon className="size-icon-xs" />
					<span className="sr-only">
						{tI18n(
							"TemplateVersionEditorPage.ProvisionerTagsPopover.expand_provisioner_tags_f11a0d4c",
						)}
					</span>
				</TopbarButton>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-[300px] bg-surface-secondary border-surface-quaternary"
			>
				<div className="text-content-secondary p-5">
					<VerticalForm>
						<FormSection
							classes={{
								// Override lg:gap-6 from FormSection defaults. The
								// lg:flex-col counters the default FormContext
								// direction ("horizontal") which adds lg:flex-row.
								root: "flex-col lg:flex-col gap-4 lg:gap-4",
							}}
							title={tI18n(
								"TemplateVersionEditorPage.ProvisionerTagsPopover.provisioner_tags_3d69e439",
							)}
							description={
								<>
									{tI18n(
										"TemplateVersionEditorPage.ProvisionerTagsPopover.tags_are_a_way_to_control_which_provisioner_daem_45f8d89d",
									)}
									<Link
										href={docs("/admin/provisioners")}
										target="_blank"
										rel="noreferrer"
										className="p-0"
										showExternalIcon={false}
									>
										{tI18n(
											"TemplateVersionEditorPage.ProvisionerTagsPopover.learn_more_0bfa7ffe",
										)}
									</Link>
								</>
							}
						>
							<ProvisionerTagsField value={tags} onChange={onTagsChange} />
						</FormSection>
					</VerticalForm>
				</div>
			</PopoverContent>
		</Popover>
	);
};
