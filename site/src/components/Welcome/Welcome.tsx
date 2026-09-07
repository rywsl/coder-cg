import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { ProductLogo } from "../Icons/ProductLogo";

type WelcomeProps = Readonly<
	PropsWithChildren<{
		className?: string;
	}>
>;
export const Welcome: FC<WelcomeProps> = ({ children, className }) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<div className={className}>
			<div className="flex justify-center pb-1">
				<ProductLogo />
			</div>
			<h1 className="text-3xl font-semibold m-0 flex justify-center items-center text-center leading-snug">
				{children || tI18n("Welcome.Welcome.welcome_to_coder_2518b393")}
			</h1>
		</div>
	);
};
