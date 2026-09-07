import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "react-query";
import { toast } from "sonner";
import { API } from "#/api/api";
import { authMethods, updatePassword } from "#/api/queries/users";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { SecurityForm } from "./SecurityForm";
import {
	SingleSignOnSection,
	useSingleSignOnSection,
} from "./SingleSignOnSection";

const SecurityPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { user: me } = useAuthenticated();
	const updatePasswordMutation = useMutation(updatePassword());
	const authMethodsQuery = useQuery(authMethods());
	const { data: userLoginType } = useQuery({
		queryKey: ["loginType"],
		queryFn: API.getUserLoginType,
	});
	const singleSignOnSection = useSingleSignOnSection();

	if (!authMethodsQuery.data || !userLoginType) {
		return <Loader />;
	}

	return (
		<SecurityPageView
			security={{
				form: {
					disabled: userLoginType.login_type !== "password",
					error: updatePasswordMutation.error,
					isLoading: updatePasswordMutation.isPending,
					onSubmit: async (data) => {
						await updatePasswordMutation.mutateAsync({
							userId: me.id,
							...data,
						});
						toast.success(
							tI18n(
								"UserSettingsPage.SecurityPage.SecurityPage.updated_password_caa322d0",
							),
						);
						// Refresh the browser session. We need to improve the AuthProvider
						// to include better API to handle these scenarios
						location.href = location.origin;
					},
				},
			}}
			oidc={{
				section: {
					authMethods: authMethodsQuery.data,
					userLoginType,
					...singleSignOnSection,
				},
			}}
		/>
	);
};

interface SecurityPageViewProps {
	security: {
		form: ComponentProps<typeof SecurityForm>;
	};
	oidc?: {
		section: ComponentProps<typeof SingleSignOnSection>;
	};
}

export const SecurityPageView: FC<SecurityPageViewProps> = ({
	security,
	oidc,
}) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<div className="flex flex-col gap-12">
			<div>
				<SettingsHeader>
					<SettingsHeaderTitle>
						{tI18n(
							"UserSettingsPage.SecurityPage.SecurityPage.security_8f6fb4eb",
						)}
					</SettingsHeaderTitle>
				</SettingsHeader>
				<SecurityForm {...security.form} />
			</div>
			{oidc && <SingleSignOnSection {...oidc.section} />}
		</div>
	);
};

export default SecurityPage;
