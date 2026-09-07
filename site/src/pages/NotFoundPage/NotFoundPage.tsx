import type { FC } from "react";
import { useTranslation } from "react-i18next";

const NotFoundPage: FC = () => {
	const { t: tI18n } = useTranslation("pages");

	return (
		<div className="w-full h-full flex flex-row justify-center items-center">
			<p className="flex gap-4">
				<span className="font-bold">404</span>
				{tI18n(
					"NotFoundPage.NotFoundPage.this_page_could_not_be_found_4197828a",
				)}
			</p>
		</div>
	);
};

export default NotFoundPage;
