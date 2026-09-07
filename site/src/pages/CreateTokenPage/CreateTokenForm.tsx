import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { FormikContextType } from "formik";
import { type FC, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "#/components/Button/Button";
import {
	FormFields,
	FormFooter,
	FormSection,
	HorizontalForm,
} from "#/components/Form/Form";
import { FormField } from "#/components/FormField/FormField";
import { Input } from "#/components/Input/Input";
import { Label } from "#/components/Label/Label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/Select/Select";
import { Spinner } from "#/components/Spinner/Spinner";
import { getFormHelpers, onChangeTrimmed } from "#/utils/formUtils";
import {
	type CreateTokenData,
	customLifetimeDay,
	determineDefaultLtValue,
	filterByMaxTokenLifetime,
	NANO_HOUR,
} from "./utils";

dayjs.extend(utc);

interface CreateTokenFormProps {
	form: FormikContextType<CreateTokenData>;
	maxTokenLifetime?: number;
	formError: unknown;
	setFormError: (arg0: unknown) => void;
	isCreating: boolean;
	creationFailed: boolean;
	now?: Date;
}

export const CreateTokenForm: FC<CreateTokenFormProps> = ({
	form,
	maxTokenLifetime,
	formError,
	setFormError,
	isCreating,
	creationFailed,
	now,
}) => {
	const { t: tI18n } = useTranslation("pages");

	const navigate = useNavigate();
	const lifetimeId = useId();
	const expiresOnId = useId();

	const [expDays, setExpDays] = useState<number>(1);
	const [lifetimeDays, setLifetimeDays] = useState<number | string>(
		determineDefaultLtValue(maxTokenLifetime),
	);
	const currentTime = dayjs(now ?? new Date());

	useEffect(() => {
		if (lifetimeDays !== "custom") {
			void form.setFieldValue("lifetime", lifetimeDays);
		} else {
			void form.setFieldValue("lifetime", expDays);
		}
	}, [lifetimeDays, expDays]);

	const getFieldHelpers = getFormHelpers<CreateTokenData>(form, formError);

	return (
		<HorizontalForm onSubmit={form.handleSubmit}>
			<FormSection
				title={tI18n("CreateTokenPage.CreateTokenForm.name_dcd1d522")}
				description={tI18n(
					"CreateTokenPage.CreateTokenForm.what_is_this_token_for_c3a54cf3",
				)}
				classes={{ sectionInfo: "min-w-[300px]" }}
			>
				<FormFields>
					<FormField
						field={getFieldHelpers("name")}
						label={tI18n("CreateTokenPage.CreateTokenForm.name_dcd1d522")}
						required
						onChange={onChangeTrimmed(form, () => setFormError(undefined))}
						autoFocus
						className="w-full"
					/>
				</FormFields>
			</FormSection>
			<FormSection
				title={tI18n("CreateTokenPage.CreateTokenForm.expiration_f38d6e0e")}
				description={
					form.values.lifetime ? (
						<>
							{tI18n(
								"CreateTokenPage.CreateTokenForm.the_token_will_expire_on_b44b2698",
							)}{" "}
							<span data-pixel="ignore">
								{currentTime
									.add(form.values.lifetime, "days")
									.utc()
									.format("MMMM DD, YYYY")}
							</span>
						</>
					) : (
						tI18n(
							"CreateTokenPage.CreateTokenForm.please_set_a_token_expiration_fa6fae74",
						)
					)
				}
				classes={{ sectionInfo: "min-w-[300px]" }}
			>
				<FormFields>
					<div className="flex flex-row gap-4">
						<div className="flex flex-col gap-2 flex-1">
							<Label htmlFor={lifetimeId}>
								{tI18n("CreateTokenPage.CreateTokenForm.lifetime_bdcd897a")}{" "}
								<span className="text-xs font-bold text-content-destructive">
									*
								</span>
							</Label>
							<Select
								value={String(lifetimeDays)}
								onValueChange={setLifetimeDays}
							>
								<SelectTrigger id={lifetimeId} className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{filterByMaxTokenLifetime(maxTokenLifetime).map((lt) => (
										<SelectItem key={lt.label} value={String(lt.value)}>
											{lt.label}
										</SelectItem>
									))}
									<SelectItem value={String(customLifetimeDay.value)}>
										{customLifetimeDay.label}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{lifetimeDays === "custom" && (
							<div className="flex flex-col gap-2 flex-1">
								<Label htmlFor={expiresOnId}>
									{tI18n("CreateTokenPage.CreateTokenForm.expires_on_71712ec2")}{" "}
									<span className="text-xs font-bold text-content-destructive">
										*
									</span>
								</Label>
								<Input
									id={expiresOnId}
									type="date"
									data-pixel="ignore"
									defaultValue={dayjs()
										.add(expDays, "day")
										.format("YYYY-MM-DD")}
									min={dayjs().add(1, "day").format("YYYY-MM-DD")}
									max={
										maxTokenLifetime
											? dayjs()
													.add(maxTokenLifetime / NANO_HOUR / 24, "day")
													.format("YYYY-MM-DD")
											: undefined
									}
									required
									onChange={(event) => {
										const lt = Math.ceil(
											dayjs(event.target.value).diff(dayjs(), "day", true),
										);
										setExpDays(lt);
									}}
								/>
							</div>
						)}
					</div>
				</FormFields>
			</FormSection>
			<FormFooter>
				<Button onClick={() => navigate("/settings/tokens")} variant="outline">
					{tI18n("CreateTokenPage.CreateTokenForm.cancel_19766ed6")}
				</Button>
				<Button type="submit" disabled={isCreating}>
					<Spinner loading={isCreating} />
					{creationFailed
						? tI18n("CreateTokenPage.CreateTokenForm.retry_942087cc")
						: tI18n("CreateTokenPage.CreateTokenForm.create_token_5d8e8e30")}
				</Button>
			</FormFooter>
		</HorizontalForm>
	);
};
