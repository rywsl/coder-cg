import { useFormik } from "formik";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { isApiValidationError } from "#/api/errors";
import type { CreateAIGatewayKeyResponse } from "#/api/typesGenerated";
import { Alert, AlertDescription } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { FormField } from "#/components/FormField/FormField";
import { Spinner } from "#/components/Spinner/Spinner";
import { i18n } from "#/i18n";
import { getFormHelpers } from "#/utils/formUtils";

interface CreateGatewayKeyFormValues {
	name: string;
}

const validationSchema = Yup.object({
	name: Yup.string()
		.required(
			i18n.t(
				"agents:AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.name_is_required_f83a4bc1",
			),
		)
		.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
			excludeEmptyString: true,
			message: i18n.t(
				"agents:AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.use_lowercase_letters_and_numbers_with_optional__a0a41c23",
			),
		})
		.max(
			64,
			i18n.t(
				"agents:AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.name_cannot_be_longer_than_64_characters_c3271a77",
			),
		),
});

interface CreateGatewayKeyDialogProps {
	open: boolean;
	onClose: () => void;
	onCreate: (name: string) => void;
	createdKey?: CreateAIGatewayKeyResponse;
	submitError?: unknown;
	isSubmitting?: boolean;
}

export const CreateGatewayKeyDialog: FC<CreateGatewayKeyDialogProps> = ({
	open,
	onClose,
	onCreate,
	createdKey,
	submitError,
	isSubmitting = false,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const form = useFormik<CreateGatewayKeyFormValues>({
		initialValues: { name: "" },
		validationSchema,
		onSubmit: (values) => {
			onCreate(values.name);
		},
	});
	const getFieldHelpers = getFormHelpers(form, submitError);

	const closeDialog = () => {
		form.resetForm();
		onClose();
	};

	const isBusy = isSubmitting;
	const showSubmitError =
		Boolean(submitError) && !isApiValidationError(submitError);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && !isBusy && !createdKey) {
					closeDialog();
				}
			}}
		>
			<DialogContent
				className="max-h-[90vh] overflow-y-auto"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>
						{createdKey
							? tI18n(
									"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.save_your_ai_gateway_key_2c519f60",
								)
							: tI18n(
									"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.create_ai_gateway_key_c7be578d",
								)}
					</DialogTitle>
				</DialogHeader>

				{createdKey ? (
					<div className="flex flex-col gap-5">
						<Alert severity="warning">
							<AlertDescription>
								{tI18n(
									"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.copy_this_key_now_for_security_reasons_it_cannot_7895869e",
								)}
							</AlertDescription>
						</Alert>
						<CodeExample
							secret={false}
							code={createdKey.key}
							className="min-h-0 select-all w-full"
						/>
						<DialogFooter>
							<Button onClick={closeDialog}>
								{tI18n(
									"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.done_11a6767d",
								)}
							</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="flex flex-col gap-5">
						{showSubmitError && <ErrorAlert error={submitError} />}
						<form onSubmit={form.handleSubmit} className="flex flex-col gap-5">
							<FormField
								field={getFieldHelpers("name", {
									helperText: tI18n(
										"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.lowercase_letters_and_numbers_with_optional_sing_a1ccb6b6",
									),
								})}
								label={tI18n(
									"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.name_dcd1d522",
								)}
								placeholder={tI18n(
									"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.primary_gateway_4941da8b",
								)}
								autoFocus
								autoComplete="off"
							/>
							<DialogFooter>
								<Button
									variant="outline"
									disabled={isBusy}
									onClick={closeDialog}
								>
									{tI18n(
										"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.cancel_19766ed6",
									)}
								</Button>
								<Button type="submit" disabled={isBusy || !form.dirty}>
									<Spinner loading={isBusy} />
									{tI18n(
										"AISettingsPage.GatewayKeysPage.CreateGatewayKeyDialog.create_4759498a",
									)}
								</Button>
							</DialogFooter>
						</form>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
