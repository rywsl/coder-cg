import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getErrorDetail, getErrorMessage } from "#/api/errors";
import { updateProfile, user } from "#/api/queries/users";
import type { UpdateUserProfileRequest } from "#/api/typesGenerated";
import { Loader } from "#/components/Loader/Loader";
import { Margins } from "#/components/Margins/Margins";
import { pageTitle } from "#/utils/page";
import { isUUID } from "#/utils/uuid";
import { EditUserForm } from "./EditUserForm";

const EditUserPage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { user: usernameOrId } = useParams() as { user: string };
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const userQuery = useQuery(user(usernameOrId));
	const updateProfileMutation = useMutation(
		updateProfile(userQuery.data?.id ?? ""),
	);

	if (!userQuery.data) {
		return <Loader />;
	}

	const userData = userQuery.data;

	const handleSubmit = async (values: UpdateUserProfileRequest) => {
		const mutation = updateProfileMutation.mutateAsync(values, {
			onSuccess: (updatedUser) => {
				// Invalidate the user cache so other parts of the UI reflect the change.
				void queryClient.invalidateQueries({
					queryKey: ["user", usernameOrId],
				});
				void queryClient.invalidateQueries({ queryKey: ["users"] });

				// If the URL currently uses the username (not a UUID) and the username
				// has changed, rewrite the URL so the page doesn't 404 on refresh.
				if (!isUUID(usernameOrId) && updatedUser.username !== usernameOrId) {
					navigate(`../${updatedUser.username}`, {
						relative: "path",
						replace: true,
					});
				}
			},
		});

		toast.promise(mutation, {
			loading: tI18n("EditUserPage.EditUserPage.saving_user_value0_3c53abe8", {
				value0: values.username,
			}),
			success: tI18n(
				"EditUserPage.EditUserPage.user_value0_updated_successfully_d330e1c6",
				{
					value0: values.username,
				},
			),
			error: (e) => ({
				message: getErrorMessage(
					e,
					tI18n(
						"EditUserPage.EditUserPage.failed_to_update_user_value0_0d713cb0",
						{
							value0: values.username,
						},
					),
				),
				description: getErrorDetail(e),
			}),
		});
	};

	return (
		<Margins>
			<title>
				{pageTitle(
					tI18n("EditUserPage.EditUserPage.edit_user_e8a88353"),
					tI18n("EditUserPage.EditUserPage.value0_84322da2", {
						value0: userData.username,
					}),
				)}
			</title>
			<EditUserForm
				error={updateProfileMutation.error}
				isLoading={updateProfileMutation.isPending}
				initialValues={{
					username: userData.username,
					name: userData.name ?? "",
					avatar_url: userData.avatar_url ?? "",
				}}
				canEditAvatar={
					userData.login_type === "password" || userData.login_type === "none"
				}
				onSubmit={handleSubmit}
				onCancel={() => {
					navigate("..", { relative: "path" });
				}}
			/>
		</Margins>
	);
};

export default EditUserPage;
