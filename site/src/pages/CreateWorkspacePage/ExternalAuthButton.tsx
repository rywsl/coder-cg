import { CheckIcon, RedoIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateVersionExternalAuth } from "#/api/typesGenerated";
import { Badge } from "#/components/Badge/Badge";
import { Button } from "#/components/Button/Button";
import { ExternalImage } from "#/components/ExternalImage/ExternalImage";
import { Spinner } from "#/components/Spinner/Spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";

interface ExternalAuthButtonProps {
	auth: TemplateVersionExternalAuth;
	displayRetry: boolean;
	isLoading: boolean;
	onStartPolling: () => void;
	error?: unknown;
	/**
	 * Users can only connect external auth for themselves. An admin creating a
	 * workspace for someone else should just be shown the status.
	 */
	canAuthenticate?: boolean;
}

export const ExternalAuthButton: FC<ExternalAuthButtonProps> = ({
	auth,
	displayRetry,
	isLoading,
	onStartPolling,
	error,
	canAuthenticate = true,
}) => {
	const { t: tI18n } = useTranslation("workspaces");

	return (
		<div className="flex items-center gap-2 border border-border border-solid rounded-md p-3 justify-between">
			<span className="flex flex-row items-center gap-2">
				{auth.display_icon && (
					<ExternalImage
						className="size-5"
						src={auth.display_icon}
						alt={tI18n(
							"CreateWorkspacePage.ExternalAuthButton.value0_icon_456d71b2",
							{
								value0: auth.display_name,
							},
						)}
					/>
				)}
				<p className="font-semibold text-sm m-0">{auth.display_name}</p>
				{!auth.authenticated && !auth.optional && (
					<Badge size="sm" variant={error ? "destructive" : "warning"}>
						{tI18n("CreateWorkspacePage.ExternalAuthButton.required_4850b174")}
					</Badge>
				)}
			</span>
			<span className="flex flex-row items-center gap-2">
				{auth.authenticated ? (
					<>
						<CheckIcon className="size-4 text-content-success" />
						<p className="text-xs font-semibold text-content-secondary m-0">
							{tI18n(
								"CreateWorkspacePage.ExternalAuthButton.authenticated_6ab694cf",
							)}
						</p>
					</>
				) : canAuthenticate ? (
					<>
						<Button
							variant="default"
							size="sm"
							disabled={isLoading || auth.authenticated}
							onClick={() => {
								window.open(
									auth.authenticate_url,
									"_blank",
									"width=900,height=600",
								);
								onStartPolling();
							}}
						>
							<Spinner loading={isLoading} />
							{tI18n(
								"CreateWorkspacePage.ExternalAuthButton.login_with_11939094",
							)}
							{auth.display_name}
						</Button>

						{displayRetry && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={onStartPolling}
									>
										<RedoIcon />
										<span className="sr-only">
											{tI18n(
												"CreateWorkspacePage.ExternalAuthButton.refresh_external_auth_69c1481f",
											)}
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{tI18n(
										"CreateWorkspacePage.ExternalAuthButton.retry_login_with_7a19f72c",
									)}
									{auth.display_name}
								</TooltipContent>
							</Tooltip>
						)}
					</>
				) : (
					<p className="text-xs font-semibold text-content-secondary m-0">
						{tI18n(
							"CreateWorkspacePage.ExternalAuthButton.not_connected_0303e182",
						)}
					</p>
				)}
			</span>
		</div>
	);
};
