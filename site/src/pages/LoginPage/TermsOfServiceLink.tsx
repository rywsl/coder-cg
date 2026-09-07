import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "#/components/Link/Link";

interface TermsOfServiceLinkProps {
	url?: string;
}

export const TermsOfServiceLink: FC<TermsOfServiceLinkProps> = ({ url }) => {
	const { t: tI18n } = useTranslation("auth");

	return (
		<div className="pt-3 text-base">
			{tI18n(
				"LoginPage.TermsOfServiceLink.by_continuing_you_agree_to_the_6e55c1da",
			)}{" "}
			<Link
				className="font-medium whitespace-nowrap"
				href={url}
				target="_blank"
				rel="noreferrer"
			>
				{tI18n("LoginPage.TermsOfServiceLink.terms_of_service_4afa55bf")}
			</Link>
		</div>
	);
};
