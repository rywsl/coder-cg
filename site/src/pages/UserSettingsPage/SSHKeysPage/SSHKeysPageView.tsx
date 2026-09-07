import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { GitSSHKey } from "#/api/typesGenerated";
import { ErrorAlert } from "#/components/Alert/ErrorAlert";
import { Button } from "#/components/Button/Button";
import { CodeExample } from "#/components/CodeExample/CodeExample";
import { Spinner } from "#/components/Spinner/Spinner";

interface SSHKeysPageViewProps {
	isLoading: boolean;
	getSSHKeyError?: unknown;
	sshKey?: GitSSHKey;
	onRegenerateClick: () => void;
}

export const SSHKeysPageView: FC<SSHKeysPageViewProps> = ({
	isLoading,
	getSSHKeyError,
	sshKey,
	onRegenerateClick,
}) => {
	const { t: tI18n } = useTranslation("users");

	if (isLoading) {
		return (
			<div className="p-8">
				<Spinner size="lg" loading />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Regenerating the key is not an option if getSSHKey fails.
        Only one of the error messages will exist at a single time */}
			{Boolean(getSSHKeyError) && <ErrorAlert error={getSSHKeyError} />}
			{sshKey && (
				<>
					<p className="m-0 text-sm text-content-secondary">
						{tI18n(
							"UserSettingsPage.SSHKeysPage.SSHKeysPageView.the_following_public_key_is_used_to_authenticate_a5d6183d",
						)}{" "}
						<code className="rounded-sm border border-border bg-surface-secondary px-1 py-0.5 text-xs text-content-primary">
							$GIT_SSH_COMMAND
						</code>
						.
					</p>
					<CodeExample secret={false} code={sshKey.public_key.trim()} />
					<div>
						<Button
							onClick={onRegenerateClick}
							data-testid="regenerate"
							variant="outline"
						>
							{tI18n(
								"UserSettingsPage.SSHKeysPage.SSHKeysPageView.regenerate_37eb952e",
							)}
						</Button>
					</div>
				</>
			)}
		</div>
	);
};
