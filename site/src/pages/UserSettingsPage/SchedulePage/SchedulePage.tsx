import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import {
	updateUserQuietHoursSchedule,
	userQuietHoursSchedule,
} from "#/api/queries/settings";
import type { UserQuietHoursScheduleResponse } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
import { useAuthenticated } from "#/hooks/useAuthenticated";
import { ScheduleForm } from "./ScheduleForm";

const SchedulePage: FC = () => {
	const { t: tI18n } = useTranslation("users");

	const { user: me } = useAuthenticated();
	const queryClient = useQueryClient();

	const {
		data: quietHoursSchedule,
		error,
		isLoading,
		isError,
	} = useQuery(userQuietHoursSchedule(me.id));

	const {
		mutate: onSubmit,
		error: submitError,
		isPending: mutationLoading,
	} = useMutation(updateUserQuietHoursSchedule(me.id, queryClient));

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		return <ErrorAlert error={error} />;
	}

	return (
		<>
			<SettingsHeader>
				<SettingsHeaderTitle>
					{tI18n(
						"UserSettingsPage.SchedulePage.SchedulePage.quiet_hours_bf0671dd",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"UserSettingsPage.SchedulePage.SchedulePage.workspaces_may_be_automatically_updated_during_y_2ee81f31",
					)}
				</SettingsHeaderDescription>
			</SettingsHeader>
			<ScheduleForm
				isLoading={mutationLoading}
				initialValues={quietHoursSchedule as UserQuietHoursScheduleResponse}
				submitError={submitError}
				onSubmit={(values) => {
					onSubmit(values, {
						onSuccess: () => {
							toast.success(
								tI18n(
									"UserSettingsPage.SchedulePage.SchedulePage.schedule_updated_successfully_5ae2e998",
								),
							);
						},
					});
				}}
			/>
		</>
	);
};

export default SchedulePage;
