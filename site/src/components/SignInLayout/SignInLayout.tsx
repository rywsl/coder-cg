import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { LanguageMenu } from "#/components/LanguageMenu/LanguageMenu";

export const SignInLayout: FC<PropsWithChildren> = ({ children }) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<div className="relative grow basis-0 h-screen flex justify-center items-center">
			<div className="absolute right-4 top-4">
				<LanguageMenu />
			</div>
			<div className="flex flex-col items-center">
				<div className="max-w-[385px] flex flex-col items-center">
					{children}
				</div>
				<div className="text-xs text-content-secondary pt-6">
					&copy; {new Date().getFullYear()}
					{tI18n("SignInLayout.SignInLayout.coder_technologies_inc_6f4648e4")}
				</div>
			</div>
		</div>
	);
};
