import { ExternalLinkIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { Loader } from "#/components/Loader/Loader";
import { Margins } from "#/components/Margins/Margins";
import {
	PageHeader,
	PageHeaderTitle,
} from "#/components/PageHeader/PageHeader";
import type { StarterTemplatesByTag } from "#/utils/starterTemplates";
import { StarterTemplates } from "./StarterTemplates";

interface CreateTemplateGalleryPageViewProps {
	starterTemplatesByTag?: StarterTemplatesByTag;
	templateBuilderEnabled: boolean;
	error?: unknown;
}

export const CreateTemplateGalleryPageView: FC<
	CreateTemplateGalleryPageViewProps
> = ({ starterTemplatesByTag, templateBuilderEnabled, error }) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<Margins className="pb-12">
			<PageHeader
				actions={
					<div className="flex flex-col items-end gap-2">
						<Button asChild size="sm" variant="outline">
							<a
								href="https://registry.coder.com/templates"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center"
							>
								{tI18n(
									"CreateTemplateGalleryPage.CreateTemplateGalleryPageView.browse_other_templates_on_the_coder_registry_d375756b",
								)}
								<ExternalLinkIcon className="size-icon-sm ml-1" />
							</a>
						</Button>
						<Button asChild size="sm" variant="outline">
							<a
								href="https://registry.coder.com/skills/coder-templates"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center"
							>
								{tI18n(
									"CreateTemplateGalleryPage.CreateTemplateGalleryPageView.use_our_template_agent_skill_2a2460f8",
								)}
								<ExternalLinkIcon className="size-icon-sm ml-1" />
							</a>
						</Button>
					</div>
				}
			>
				<PageHeaderTitle>
					{tI18n(
						"CreateTemplateGalleryPage.CreateTemplateGalleryPageView.create_a_template_c0794aff",
					)}
				</PageHeaderTitle>
			</PageHeader>
			<div className="flex flex-col gap-16">
				<div className="flex flex-row gap-8">
					<div className="w-[202px]">
						<h2 className="m-0 text-base font-normal text-content-primary">
							{tI18n(
								"CreateTemplateGalleryPage.CreateTemplateGalleryPageView.choose_a_starting_point_for_your_new_template_16732005",
							)}
						</h2>
					</div>
					<div className="flex h-max flex-wrap gap-8">
						<RouterLink
							to="/templates/new"
							className="flex h-[115px] w-[320px] items-center gap-6 rounded-md border border-solid border-border p-4 text-inherit no-underline hover:bg-surface-secondary"
						>
							<div className="size-8 shrink-0">
								<ExternalImage
									src="/emojis/1f4e1.png"
									className="h-full w-full"
								/>
							</div>
							<div>
								<h4 className="m-0 mb-1 text-sm font-semibold text-content-secondary">
									{tI18n(
										"CreateTemplateGalleryPage.CreateTemplateGalleryPageView.upload_template_3e79263d",
									)}
								</h4>
								<span className="block text-xs font-normal leading-[1.6] text-content-secondary">
									{tI18n(
										"CreateTemplateGalleryPage.CreateTemplateGalleryPageView.get_started_by_uploading_an_existing_template_044d0296",
									)}
								</span>
							</div>
						</RouterLink>
					</div>
				</div>

				{Boolean(error) && <ErrorAlert error={error} />}

				{Boolean(!starterTemplatesByTag) && <Loader />}

				<StarterTemplates
					starterTemplatesByTag={starterTemplatesByTag}
					templateBuilderEnabled={templateBuilderEnabled}
				/>
			</div>
		</Margins>
	);
};
