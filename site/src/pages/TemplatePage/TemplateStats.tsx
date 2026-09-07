import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { Template, TemplateVersion } from "#/api/typesGenerated";
import { Stats, StatsItem } from "#/components/Stats/Stats";
import { createDayString } from "#/utils/createDayString";
import {
	formatTemplateActiveDevelopers,
	formatTemplateBuildTime,
} from "#/utils/templates";

interface TemplateStatsProps {
	template: Template;
	activeVersion: TemplateVersion;
}

export const TemplateStats: FC<TemplateStatsProps> = ({
	template,
	activeVersion,
}) => {
	const { t: tI18n } = useTranslation("templates");

	return (
		<Stats>
			<StatsItem
				label={tI18n("TemplatePage.TemplateStats.used_by_681bf81a")}
				value={
					<>
						{formatTemplateActiveDevelopers(template.active_user_count)}{" "}
						{template.active_user_count === 1
							? tI18n("TemplatePage.TemplateStats.developer_88fa0d75")
							: tI18n("TemplatePage.TemplateStats.developers_ee0b1e6a")}
					</>
				}
			/>
			<StatsItem
				label={tI18n("TemplatePage.TemplateStats.build_time_8e28a482")}
				value={formatTemplateBuildTime(template.build_time_stats.start.P50)}
			/>
			<StatsItem
				label={tI18n("TemplatePage.TemplateStats.active_version_44e1ea1c")}
				value={
					<Link to={`versions/${activeVersion.name}`}>
						{activeVersion.name}
					</Link>
				}
			/>
			<StatsItem
				label={tI18n("TemplatePage.TemplateStats.last_updated_382ac5f3")}
				value={createDayString(template.updated_at)}
			/>
			<StatsItem
				label={tI18n("TemplatePage.TemplateStats.created_by_374cd9d2")}
				value={template.created_by_name}
			/>
		</Stats>
	);
};
