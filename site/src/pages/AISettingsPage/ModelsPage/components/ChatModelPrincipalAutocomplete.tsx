import { CheckIcon } from "lucide-react";
import { type FC, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "react-query";
import { chatModelACLAvailable } from "#/api/queries/chats";
import type { Group, ReducedUser } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Autocomplete } from "#/components/Autocomplete/Autocomplete";
import { AvatarData } from "#/components/Avatar/AvatarData";
import { getGroupSubtitle, isGroup } from "#/modules/groups";
import { prepareQuery } from "#/utils/filters";

export type ChatModelPrincipalAutocompleteValue = ReducedUser | Group | null;
type AutocompleteOption = Exclude<ChatModelPrincipalAutocompleteValue, null>;

type ChatModelPrincipalAutocompleteProps = {
	value: ChatModelPrincipalAutocompleteValue;
	onChange: (value: ChatModelPrincipalAutocompleteValue) => void;
	organizationId: string;
	modelId: string;
	excludedPrincipalIds: readonly string[];
	className?: string;
};

export const ChatModelPrincipalAutocomplete: FC<
	ChatModelPrincipalAutocompleteProps
> = ({
	value,
	onChange,
	organizationId,
	modelId,
	excludedPrincipalIds,
	className,
}) => {
	const { t: tI18n } = useTranslation("agents");

	const [inputValue, setInputValue] = useState("");
	const [open, setOpen] = useState(false);
	const autocompleteId = useId();

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setInputValue("");
		}
	};

	const aclAvailableQuery = useQuery({
		...chatModelACLAvailable(organizationId, modelId, {
			q: prepareQuery(inputValue),
			limit: 25,
		}),
		enabled: open,
		placeholderData: keepPreviousData,
	});

	const options: AutocompleteOption[] = aclAvailableQuery.data
		? [
				...aclAvailableQuery.data.groups,
				...aclAvailableQuery.data.users,
			].filter((principal) => !excludedPrincipalIds.includes(principal.id))
		: [];

	return (
		<div className="flex flex-col gap-2">
			<Autocomplete
				value={value}
				onChange={onChange}
				options={options}
				getOptionValue={(option) => option.id}
				getOptionLabel={(option) =>
					isGroup(option) ? option.display_name || option.name : option.email
				}
				isOptionEqualToValue={(option, optionValue) =>
					option.id === optionValue.id
				}
				renderOption={(option, isSelected) => (
					<div className="flex w-full items-center justify-between">
						<AvatarData
							title={
								isGroup(option)
									? option.display_name || option.name
									: option.username
							}
							subtitle={
								isGroup(option) ? getGroupSubtitle(option) : option.email
							}
							src={option.avatar_url}
						/>
						{isSelected && <CheckIcon className="size-4 shrink-0" />}
					</div>
				)}
				open={open}
				onOpenChange={handleOpenChange}
				inputValue={inputValue}
				onInputChange={setInputValue}
				loading={aclAvailableQuery.isFetching}
				placeholder={tI18n(
					"AISettingsPage.ModelsPage.components.ChatModelPrincipalAutocomplete.search_for_user_or_group_0aa07b31",
				)}
				noOptionsText={
					aclAvailableQuery.error
						? tI18n(
								"AISettingsPage.ModelsPage.components.ChatModelPrincipalAutocomplete.unable_to_load_users_or_groups_4b1be748",
							)
						: tI18n(
								"AISettingsPage.ModelsPage.components.ChatModelPrincipalAutocomplete.no_users_or_groups_found_02da3b9f",
							)
				}
				className={className}
				id={autocompleteId}
			/>
			{aclAvailableQuery.error && (
				<ErrorAlert error={aclAvailableQuery.error} />
			)}
		</div>
	);
};
