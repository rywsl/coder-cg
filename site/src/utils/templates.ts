import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { i18n } from "#/i18n";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export const formatTemplateActiveDevelopers = (num?: number): string => {
	if (num === undefined || num < 0) {
		// Loading
		return "-";
	}
	return num.toString();
};

export const formatTemplateActiveDevelopersLabel = (num?: number): string =>
	i18n.t("pages:templates.value0_developer_value1_136f2915", {
		value0: formatTemplateActiveDevelopers(num),
		value1: num === 1 ? "" : "s",
	});

export const formatTemplateBuildTime = (
	buildTimeMs?: number | null,
): string => {
	return buildTimeMs === undefined || buildTimeMs === null
		? "Unknown"
		: `${Math.round(dayjs.duration(buildTimeMs, "milliseconds").asSeconds())}s`;
};
