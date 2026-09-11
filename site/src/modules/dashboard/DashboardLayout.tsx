import { cn } from "cn";
import { type FC, type HTMLAttributes, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { Loader } from "#/components/Loader/Loader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { AnnouncementBanners } from "#/modules/dashboard/AnnouncementBanners/AnnouncementBanners";
import { DeploymentBanner } from "./DeploymentBanner/DeploymentBanner";
import { Navbar } from "./Navbar/Navbar";
import { UpdateCheckNotice } from "./UpdateCheckNotice/UpdateCheckNotice";
import { useUpdateCheck } from "./useUpdateCheck";

export const DashboardLayout: FC = () => {
	const { t: tI18n } = useTranslation("dashboard");

	const { permissions } = useAuthenticated();
	const updateCheck = useUpdateCheck(permissions.viewDeploymentConfig);

	return (
		<>
			<AnnouncementBanners />
			<div className="flex flex-col min-h-screen justify-between">
				{/* biome-ignore lint/a11y/useValidAnchor: Skip links use fragment anchors by design. */}
				<a
					href="#main-content"
					onClick={(e) => {
						e.preventDefault();
						const main = document.getElementById("main-content");
						main?.focus();
					}}
					className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:z-50 focus-visible:p-4 focus-visible:bg-surface-primary focus-visible:text-content-primary"
				>
					{tI18n("dashboard.DashboardLayout.skip_to_main_content_c887f134")}
				</a>
				<Navbar />

				<main
					id="main-content"
					tabIndex={-1}
					className={cn(
						"relative flex flex-col flex-1 min-h-0",
						"focus:outline-hidden",
					)}
				>
					<Suspense fallback={<Loader />}>
						<Outlet />
					</Suspense>
				</main>

				<DeploymentBanner />

				{updateCheck.isVisible && updateCheck.data && (
					<UpdateCheckNotice
						version={updateCheck.data.version}
						releaseNotesUrl={updateCheck.data.url}
						onDismiss={updateCheck.dismiss}
						aboveDeploymentBanner={Boolean(permissions.viewDeploymentStats)}
					/>
				)}
			</div>
		</>
	);
};

export const DashboardFullPage: FC<HTMLAttributes<HTMLDivElement>> = ({
	children,
	...attrs
}) => {
	return (
		<div {...attrs} className="flex-1 flex flex-col basis-0 min-h-full">
			{children}
		</div>
	);
};
