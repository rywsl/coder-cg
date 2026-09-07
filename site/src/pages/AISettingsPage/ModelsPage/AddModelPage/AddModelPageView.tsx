import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import type * as TypesGen from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Loader } from "#/components/Loader/Loader";
import { OrganizationField } from "#/components/OrganizationAutocomplete/OrganizationAutocomplete";
import type { ProviderState } from "#/modules/aiModels/providerStates";
import { ModelForm } from "../components/ModelForm";
import { ModelFormBackLink } from "../components/ModelFormHeader";
import {
	creatableModelOrganizations,
	selectModelOrganizationPath,
	useOrganizationModels,
} from "../organizationModels";

interface AddModelPageViewProps {
	isLoading: boolean;
	loadError: unknown;
	refetchError: unknown;
	providerStates: readonly ProviderState[];
	selectedProviderState: ProviderState | null;
	duplicateSourceModel?: TypesGen.ChatModel;
	currentDefaultModel?: TypesGen.ChatModel;
	isSaving: boolean;
	onProviderChange: (providerKey: string) => void;
	onCreateModel: (req: TypesGen.CreateChatModelRequest) => Promise<unknown>;
}

const AddModelPageView: FC<AddModelPageViewProps> = ({
	isLoading,
	loadError,
	refetchError,
	providerStates,
	selectedProviderState,
	duplicateSourceModel,
	currentDefaultModel,
	isSaving,
	onProviderChange,
	onCreateModel,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const { organization, accessibleOrganizations, permissionsByOrganization } =
		useOrganizationModels();
	const location = useLocation();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const creatableOrganizations = creatableModelOrganizations(
		accessibleOrganizations,
		permissionsByOrganization,
	);
	const organizationPicker = creatableOrganizations.length > 1 && (
		<OrganizationField
			id="add-model-organization"
			organization={organization}
			organizations={creatableOrganizations}
			labelOrganizations={accessibleOrganizations}
			className="w-60"
			optionsTabbable
			onChange={(nextOrganization) => {
				void navigate(
					selectModelOrganizationPath(
						location.pathname,
						nextOrganization,
						searchParams,
					),
				);
			}}
		/>
	);

	if (isLoading) {
		return <Loader fullscreen />;
	}

	if (loadError) {
		return (
			<div className="flex flex-col items-start gap-4">
				<ModelFormBackLink />
				<ErrorAlert error={loadError} />
				{organizationPicker}
			</div>
		);
	}

	if (!selectedProviderState) {
		return (
			<div className="flex flex-col items-start gap-4">
				<ModelFormBackLink />
				<Alert severity="warning">
					<AlertTitle>
						{tI18n(
							"AISettingsPage.ModelsPage.AddModelPage.AddModelPageView.provider_not_found_90c36c40",
						)}
					</AlertTitle>
					<AlertDescription>
						{tI18n(
							"AISettingsPage.ModelsPage.AddModelPage.AddModelPageView.the_provider_you_are_trying_to_add_a_model_for_i_5ec54655",
						)}
					</AlertDescription>
				</Alert>
				{organizationPicker}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{refetchError != null && <ErrorAlert error={refetchError} />}
			<ModelForm
				duplicateSourceModel={duplicateSourceModel}
				currentDefaultModel={currentDefaultModel}
				providerStates={providerStates}
				selectedProviderState={selectedProviderState}
				onProviderChange={onProviderChange}
				isSaving={isSaving}
				isDeleting={false}
				onCreateModel={onCreateModel}
				onUpdateModel={async () => {}}
			/>
		</div>
	);
};

export default AddModelPageView;
