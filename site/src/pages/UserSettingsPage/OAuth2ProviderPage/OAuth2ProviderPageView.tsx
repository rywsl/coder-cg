import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type * as TypesGen from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Avatar } from "#/components/Avatar/Avatar";
import { Button } from "#/components/Button/Button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/Table/Table";
import { TableEmpty } from "#/components/TableEmpty/TableEmpty";
import { TableLoader } from "#/components/TableLoader/TableLoader";

type OAuth2ProviderPageViewProps = {
	isLoading: boolean;
	error: unknown;
	apps?: TypesGen.OAuth2ProviderApp[];
	revoke: (app: TypesGen.OAuth2ProviderApp) => void;
};

const OAuth2ProviderPageView: FC<OAuth2ProviderPageViewProps> = ({
	isLoading,
	error,
	apps,
	revoke,
}) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<>
			{error && <ErrorAlert error={error} />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							{tI18n(
								"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPageView.name_dcd1d522",
							)}
						</TableHead>
						<TableHead className="w-[1%]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading && <TableLoader />}
					{apps?.map((app) => (
						<OAuth2AppRow key={app.id} app={app} revoke={revoke} />
					))}
					{apps?.length === 0 && (
						<TableEmpty
							message={tI18n(
								"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPageView.no_oauth2_applications_have_been_authorized_7ae44223",
							)}
						/>
					)}
				</TableBody>
			</Table>
		</>
	);
};

type OAuth2AppRowProps = {
	app: TypesGen.OAuth2ProviderApp;
	revoke: (app: TypesGen.OAuth2ProviderApp) => void;
};

const OAuth2AppRow: FC<OAuth2AppRowProps> = ({ app, revoke }) => {
	const { t: tI18n } = useTranslation("users");

	return (
		<TableRow key={app.id} data-testid={`app-${app.id}`}>
			<TableCell>
				<div className="flex flex-row gap-2 items-center">
					<Avatar variant="icon" src={app.icon} fallback={app.name} />
					<span className="font-semibold">{app.name}</span>
				</div>
			</TableCell>
			<TableCell>
				<Button size="sm" variant="destructive" onClick={() => revoke(app)}>
					{tI18n(
						"UserSettingsPage.OAuth2ProviderPage.OAuth2ProviderPageView.revoke_585d4c41",
					)}
				</Button>
			</TableCell>
		</TableRow>
	);
};

export default OAuth2ProviderPageView;
