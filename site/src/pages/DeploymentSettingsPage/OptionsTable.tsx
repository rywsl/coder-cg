import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { SerpentOption } from "#/api/typesGenerated";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import {
	OptionConfig,
	OptionConfigFlag,
	OptionDescription,
	OptionName,
	OptionValue,
} from "./Option";
import { optionValue } from "./optionValue";

interface OptionsTableProps {
	options: readonly SerpentOption[];
	additionalValues?: readonly string[];
}

const OptionsTable: FC<OptionsTableProps> = ({ options, additionalValues }) => {
	const { t: tI18n } = useTranslation("administration");

	if (options.length === 0) {
		return (
			<p>
				{tI18n(
					"DeploymentSettingsPage.OptionsTable.no_options_to_configure_0c282e4f",
				)}
			</p>
		);
	}

	return (
		<Table className="options-table">
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/2">
						{tI18n("DeploymentSettingsPage.OptionsTable.option_45aaacba")}
					</TableHead>
					<TableHead className="w-1/2">
						{tI18n("DeploymentSettingsPage.OptionsTable.value_8e37953d")}
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Object.values(options).map((option) => {
					return (
						<TableRow key={option.flag} className={`option-${option.flag}`}>
							<TableCell>
								<OptionName>{option.name}</OptionName>
								<OptionDescription>{option.description}</OptionDescription>
								<div className="pt-2 flex flex-wrap gap-2">
									{option.flag && (
										<OptionConfig isSource={option.value_source === "flag"}>
											<OptionConfigFlag>CLI</OptionConfigFlag>
											--{option.flag}
										</OptionConfig>
									)}
									{option.flag_shorthand && (
										<OptionConfig isSource={option.value_source === "flag"}>
											<OptionConfigFlag>CLI</OptionConfigFlag>-
											{option.flag_shorthand}
										</OptionConfig>
									)}
									{option.env && (
										<OptionConfig isSource={option.value_source === "env"}>
											<OptionConfigFlag>
												{tI18n(
													"DeploymentSettingsPage.OptionsTable.env_416861c7",
												)}
											</OptionConfigFlag>
											{option.env}
										</OptionConfig>
									)}
									{option.yaml && (
										<OptionConfig isSource={option.value_source === "yaml"}>
											<OptionConfigFlag>YAML</OptionConfigFlag>
											{option.yaml}
										</OptionConfig>
									)}
								</div>
							</TableCell>
							<TableCell>
								<OptionValue>
									{optionValue(option, additionalValues)}
								</OptionValue>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

export default OptionsTable;
