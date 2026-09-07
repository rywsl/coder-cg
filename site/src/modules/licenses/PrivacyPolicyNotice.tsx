import type { FC } from "react";
import { useTranslation } from "react-i18next";

export const PrivacyPolicyNotice: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<>
			{tI18n(
				"licenses.PrivacyPolicyNotice.the_information_you_provide_will_be_treated_in_a_d76f092d",
			)}{" "}
			<a
				href="https://coder.com/legal/privacy-policy"
				target="_blank"
				rel="noreferrer"
				className="text-content-link hover:underline"
			>
				{tI18n("licenses.PrivacyPolicyNotice.coder_privacy_policy_99dec88b")}
			</a>
			.
		</>
	);
};
