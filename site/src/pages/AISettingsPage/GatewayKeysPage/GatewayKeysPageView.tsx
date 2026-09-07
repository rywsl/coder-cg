import { PlusIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { AIGatewayKey } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import {
	SettingsHeader,
	SettingsHeaderDescription,
	SettingsHeaderDocsLink,
	SettingsHeaderTitle,
} from "#/components/SettingsHeader/SettingsHeader";
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
import { PremiumPaywall } from "#/modules/paywall/PremiumPaywall";
import type { Permissions } from "#/modules/permissions";
import { docs } from "#/utils/docs";
import { relativeTime } from "#/utils/time";

interface GatewayKeysPageViewProps {
	keys: AIGatewayKey[];
	isLoading: boolean;
	error: unknown;
	showPaywall: boolean;
	permissions: Permissions;
	onCreateKey: () => void;
	onDeleteKey: (key: AIGatewayKey) => void;
}

export const GatewayKeysPageView: FC<GatewayKeysPageViewProps> = ({
	keys,
	isLoading,
	error,
	showPaywall,
	permissions,
	onCreateKey,
	onDeleteKey,
}) => {
	const { t: tI18n } = useTranslation("agents");

	return (
		<div>
			<SettingsHeader
				actions={
					!showPaywall && (
						<Button variant="outline" onClick={onCreateKey}>
							<PlusIcon />
							{tI18n(
								"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.create_key_b6cde903",
							)}
						</Button>
					)
				}
			>
				<SettingsHeaderTitle>
					{tI18n(
						"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.ai_gateway_keys_a24b1342",
					)}
				</SettingsHeaderTitle>
				<SettingsHeaderDescription>
					{tI18n(
						"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.keys_authenticate_standalone_ai_gateway_replicas_d667b4ee",
					)}{" "}
					<SettingsHeaderDocsLink
						href={docs("/ai-coder/ai-gateway/standalone#create-a-gateway-key")}
					/>
				</SettingsHeaderDescription>
			</SettingsHeader>
			{showPaywall && (
				<PremiumPaywall
					source="ai_gateway_keys"
					message={tI18n(
						"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.ai_gateway_47219de2",
					)}
					description={tI18n(
						"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.authenticate_standalone_ai_gateway_replicas_secu_07fc561c",
					)}
					features={[
						tI18n(
							"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.authenticate_without_shared_secrets_859a86af",
						),
						tI18n(
							"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.works_inside_coderd_or_standalone_6ee2e224",
						),
						tI18n(
							"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.independently_scale_rotate_or_revoke_keys_per_de_cdd2fd38",
						),
					]}
					canViewPremium={permissions.viewAllLicenses}
				/>
			)}
			{!showPaywall && Boolean(error) && (
				<div className="mb-4">
					<ErrorAlert error={error} />
				</div>
			)}
			{!showPaywall && (
				<Table
					aria-label={tI18n(
						"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.ai_gateway_keys_cab8f75b",
					)}
				>
					<TableHeader>
						<TableRow>
							<TableHead>
								{tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.name_dcd1d522",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.key_prefix_ac467d48",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.last_heartbeat_40f7951c",
								)}
							</TableHead>
							<TableHead>
								{tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.created_d70b9e24",
								)}
							</TableHead>
							<TableHead className="w-8" />
						</TableRow>
					</TableHeader>
					<TableBody size="lg">
						{isLoading ? (
							<TableLoader />
						) : error ? (
							<TableEmpty
								message={tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.failed_to_fetch_ai_gateway_keys_0d914220",
								)}
							/>
						) : keys.length === 0 ? (
							<TableEmpty
								message={tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.no_ai_gateway_keys_a2dc6f7e",
								)}
								description={tI18n(
									"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.create_a_key_to_authenticate_a_standalone_ai_gat_194b80d9",
								)}
								cta={
									<Button variant="outline" onClick={onCreateKey}>
										<PlusIcon />
										{tI18n(
											"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.create_key_b6cde903",
										)}
									</Button>
								}
							/>
						) : (
							keys.map((key) => (
								<TableRow key={key.id}>
									<TableCell>{key.name}</TableCell>
									<TableCell>
										<span className="font-mono text-content-secondary">
											{key.key_prefix}
										</span>
									</TableCell>
									<TableCell>
										{key.last_heartbeat_at ? (
											<span className="block first-letter:uppercase">
												{relativeTime(new Date(key.last_heartbeat_at))}
											</span>
										) : (
											<span className="text-content-disabled">
												{tI18n(
													"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.never_6300ef80",
												)}
											</span>
										)}
									</TableCell>
									<TableCell>
										<span className="block first-letter:uppercase">
											{relativeTime(new Date(key.created_at))}
										</span>
									</TableCell>
									<TableCell>
										<Button
											variant="destructive"
											size="icon"
											aria-label={tI18n(
												"AISettingsPage.GatewayKeysPage.GatewayKeysPageView.delete_value0_50256b39",
												{
													value0: key.name,
												},
											)}
											onClick={() => onDeleteKey(key)}
										>
											<TrashIcon className="size-icon-sm" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			)}
		</div>
	);
};
