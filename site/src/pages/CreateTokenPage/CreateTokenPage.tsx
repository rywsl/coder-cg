import { useFormik } from "formik";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { API } from "#/api/api";
import { getErrorDetail } from "#/api/errors";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { ConfirmDialog } from "#/components/Dialog/ConfirmDialog/ConfirmDialog";
import { FullPageHorizontalForm } from "#/components/FullPageForm/FullPageHorizontalForm";
import { Loader } from "#/components/Loader/Loader";
import { pageTitle } from "#/utils/page";
import { CreateTokenForm } from "./CreateTokenForm";
import { type CreateTokenData, NANO_HOUR } from "./utils";

const initialValues: CreateTokenData = {
	name: "",
	lifetime: 30,
};

type CreateTokenPageProps = {
	now?: Date;
};

const CreateTokenPage: FC<CreateTokenPageProps> = ({ now }) => {
	const { t: tI18n } = useTranslation("pages");

	const navigate = useNavigate();

	const {
		mutate: saveToken,
		isPending: isCreating,
		isError: creationFailed,
		isSuccess: creationSuccessful,
		data: newToken,
	} = useMutation({ mutationFn: API.createToken });
	const {
		data: tokenConfig,
		isLoading: fetchingTokenConfig,
		isError: tokenFetchFailed,
		error: tokenFetchError,
	} = useQuery({
		queryKey: ["tokenconfig"],
		queryFn: API.getTokenConfig,
	});

	const [formError, setFormError] = useState<unknown>(undefined);

	const onCreateSuccess = () => {
		toast.success(
			tI18n("CreateTokenPage.CreateTokenPage.token_has_been_created_f26a3ba4"),
		);
		navigate("/settings/tokens");
	};

	const onCreateError = (error: unknown) => {
		setFormError(error);
		toast.error(
			tI18n("CreateTokenPage.CreateTokenPage.failed_to_create_token_8cec121b"),
			{
				description: getErrorDetail(error),
			},
		);
	};

	const form = useFormik<CreateTokenData>({
		initialValues,
		onSubmit: (values) => {
			saveToken(
				{
					lifetime: values.lifetime * 24 * NANO_HOUR,
					token_name: values.name,
					scope: "all", // tokens are currently unscoped
				},
				{
					onError: onCreateError,
				},
			);
		},
	});

	const tokenDescription = (
		<>
			<p>
				{tI18n(
					"CreateTokenPage.CreateTokenPage.make_sure_you_copy_the_below_token_before_procee_af6f4996",
				)}
			</p>
			<CodeExample
				secret={false}
				code={newToken?.key ?? ""}
				className="min-h-0 select-all w-full mt-6"
			/>
		</>
	);

	if (fetchingTokenConfig) {
		return <Loader />;
	}

	return (
		<>
			<title>
				{pageTitle(
					tI18n("CreateTokenPage.CreateTokenPage.create_token_eda3d6ef"),
				)}
			</title>
			{tokenFetchFailed && <ErrorAlert error={tokenFetchError} />}
			<FullPageHorizontalForm
				title={tI18n("CreateTokenPage.CreateTokenPage.create_token_eda3d6ef")}
				detail={tI18n(
					"CreateTokenPage.CreateTokenPage.all_tokens_are_unscoped_and_therefore_have_full__aa0d2adc",
				)}
			>
				<CreateTokenForm
					form={form}
					maxTokenLifetime={tokenConfig?.max_token_lifetime}
					formError={formError}
					setFormError={setFormError}
					isCreating={isCreating}
					creationFailed={creationFailed}
					now={now}
				/>

				<ConfirmDialog
					type="info"
					hideCancel
					title={tI18n(
						"CreateTokenPage.CreateTokenPage.creation_successful_2fa3d74c",
					)}
					description={tokenDescription}
					open={creationSuccessful && Boolean(newToken.key)}
					confirmLoading={isCreating}
					onConfirm={onCreateSuccess}
					onClose={onCreateSuccess}
				/>
			</FullPageHorizontalForm>
		</>
	);
};

export default CreateTokenPage;
