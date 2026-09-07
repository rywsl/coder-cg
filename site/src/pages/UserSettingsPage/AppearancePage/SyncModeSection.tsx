import { cn } from "cn";
import { MoonIcon, SunIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/Badge/Badge";
import type { ConcreteThemeName } from "#/theme";
import { ThemePreview } from "./ThemePreview";
import { ThemeSwatch } from "./ThemeSwatch";
import { SYNC_MODE_THEMES, THEME_COPY } from "./themeCopy";

interface SyncModeSectionProps {
	light: ConcreteThemeName;
	dark: ConcreteThemeName;
	activeScheme: "dark" | "light"; // The OS color scheme currently in effect
	namePrefix?: string;
	onSelect: (scheme: "light" | "dark", theme: ConcreteThemeName) => void;
}

export const SyncModeSection: FC<SyncModeSectionProps> = ({
	light,
	dark,
	activeScheme,
	namePrefix = "theme-sync",
	onSelect,
}) => {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			<SyncCard
				key="light"
				scheme="light"
				selected={light}
				active={activeScheme === "light"}
				name={`${namePrefix}-light`}
				onSelect={(theme) => onSelect("light", theme)}
			/>
			<SyncCard
				key="dark"
				scheme="dark"
				selected={dark}
				active={activeScheme === "dark"}
				name={`${namePrefix}-dark`}
				onSelect={(theme) => onSelect("dark", theme)}
			/>
		</div>
	);
};

interface SyncCardProps {
	scheme: "light" | "dark";
	selected: ConcreteThemeName;
	active: boolean;
	name: string;
	onSelect: (theme: ConcreteThemeName) => void;
}

const SyncCard: FC<SyncCardProps> = ({
	scheme,
	selected,
	active,
	name,
	onSelect,
}) => {
	const { t: tI18n } = useTranslation("users");

	const [previewTheme, setPreviewTheme] = useState<
		ConcreteThemeName | undefined
	>(undefined);
	const Icon = scheme === "light" ? SunIcon : MoonIcon;
	const title =
		scheme === "light"
			? tI18n(
					"UserSettingsPage.AppearancePage.SyncModeSection.light_theme_3669a1b2",
				)
			: tI18n(
					"UserSettingsPage.AppearancePage.SyncModeSection.dark_theme_3f11a5cc",
				);
	const displayedTheme = previewTheme ?? selected;
	const description =
		scheme === "light"
			? tI18n(
					"UserSettingsPage.AppearancePage.SyncModeSection.this_theme_will_be_active_when_your_system_is_se_51b6ebee",
				)
			: tI18n(
					"UserSettingsPage.AppearancePage.SyncModeSection.this_theme_will_be_active_when_your_system_is_se_2103e8de",
				);

	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-md border border-solid border-border p-4",
				active && "ring-2 ring-content-link",
			)}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon className="size-icon-sm text-content-secondary" />
					<span className="font-medium text-content-primary">{title}</span>
				</div>
				{active && (
					<Badge variant="info" size="sm">
						{tI18n(
							"UserSettingsPage.AppearancePage.SyncModeSection.active_92340695",
						)}
					</Badge>
				)}
			</div>
			<p className="m-0 text-sm text-content-secondary">{description}</p>
			<ThemePreview
				theme={displayedTheme}
				size="lg"
				label={THEME_COPY[displayedTheme].title}
			/>
			<fieldset className="m-0 min-w-0 border-0 p-0">
				<legend className="sr-only">
					{tI18n(
						"UserSettingsPage.AppearancePage.SyncModeSection.value0_options_c1bfbdcb",
						{
							value0: title,
						},
					)}
				</legend>
				<div className="flex flex-wrap items-center gap-3">
					{SYNC_MODE_THEMES.map((theme) => (
						<ThemeSwatch
							key={theme}
							name={name}
							theme={theme}
							selected={theme === selected}
							onSelect={() => onSelect(theme)}
							onPreview={() => setPreviewTheme(theme)}
							onPreviewEnd={() => setPreviewTheme(undefined)}
						/>
					))}
				</div>
			</fieldset>
		</div>
	);
};
