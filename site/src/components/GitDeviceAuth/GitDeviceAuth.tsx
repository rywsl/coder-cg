import { isAxiosError } from "axios";
import { ExternalLinkIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ApiErrorResponse } from "#/api/errors";
import type { ExternalAuthDevice } from "#/api/typesGenerated";
import { Alert, AlertDescription, AlertTitle } from "#/components/Alert/Alert";
import { CopyButton } from "#/components/CopyButton/CopyButton";
import { Link } from "#/components/Link/Link";
import { Loader } from "#/components/Loader/Loader";
import { Spinner } from "../Spinner/Spinner";

interface GitDeviceAuthProps {
	externalAuthDevice?: ExternalAuthDevice;
	deviceExchangeError?: ApiErrorResponse;
}

const DeviceExchangeError = {
	AuthorizationPending: "authorization_pending",
	SlowDown: "slow_down",
	ExpiredToken: "expired_token",
	AccessDenied: "access_denied",
} as const;

export const isExchangeErrorRetryable = (_: number, error: unknown) => {
	if (!isAxiosError(error)) {
		return false;
	}
	const detail = error.response?.data?.detail;
	return (
		detail === DeviceExchangeError.AuthorizationPending ||
		detail === DeviceExchangeError.SlowDown
	);
};

/**
 * The OAuth2 specification (https://datatracker.ietf.org/doc/html/rfc8628)
 * describes how the client should handle retries. This function returns a
 * closure that implements the retry logic described in the specification.
 * The closure should be memoized because it stores state.
 */
export const newRetryDelay = (initialInterval: number | undefined) => {
	// "If no value is provided, clients MUST use 5 as the default."
	// https://datatracker.ietf.org/doc/html/rfc8628#section-3.2
	let interval = initialInterval ?? 5;
	let lastFailureCountHandled = 0;
	return (failureCount: number, error: unknown) => {
		const isSlowDown =
			isAxiosError(error) &&
			error.response?.data.detail === DeviceExchangeError.SlowDown;
		// We check the failure count to ensure we increase the interval
		// at most once per failure.
		if (isSlowDown && lastFailureCountHandled < failureCount) {
			lastFailureCountHandled = failureCount;
			// https://datatracker.ietf.org/doc/html/rfc8628#section-3.5
			// "the interval MUST be increased by 5 seconds for this and all subsequent requests"
			interval += 5;
		}
		let extraDelay = 0;
		if (isSlowDown) {
			// I found GitHub is very strict about their rate limits, and they'll block
			// even if the request is 500ms earlier than they expect. This may happen due to
			// e.g. network latency, so it's best to cool down for longer if GitHub just
			// rejected our request.
			extraDelay = 5;
		}
		return (interval + extraDelay) * 1000;
	};
};

export const GitDeviceAuth: FC<GitDeviceAuthProps> = ({
	externalAuthDevice,
	deviceExchangeError,
}) => {
	const { t: tI18n } = useTranslation("components");

	let status = (
		<p className="flex items-center justify-center gap-2 text-content-disabled">
			<Spinner size="sm" loading />
			{tI18n(
				"GitDeviceAuth.GitDeviceAuth.checking_for_authentication_6215755a",
			)}
		</p>
	);
	if (deviceExchangeError) {
		// See https://datatracker.ietf.org/doc/html/rfc8628#section-3.5
		switch (deviceExchangeError.detail) {
			case DeviceExchangeError.AuthorizationPending:
				break;
			case DeviceExchangeError.SlowDown:
				status = (
					<div>
						{status}
						<Alert severity="warning">
							{tI18n(
								"GitDeviceAuth.GitDeviceAuth.rate_limit_reached_waiting_a_few_seconds_before__d5fd2796",
							)}
						</Alert>
					</div>
				);
				break;
			case DeviceExchangeError.ExpiredToken:
				status = (
					<Alert severity="error">
						{tI18n(
							"GitDeviceAuth.GitDeviceAuth.the_one_time_code_has_expired_refresh_to_get_a_n_cdb4a54f",
						)}
					</Alert>
				);
				break;
			case DeviceExchangeError.AccessDenied:
				status = (
					<Alert severity="error" prominent>
						{tI18n(
							"GitDeviceAuth.GitDeviceAuth.access_to_the_git_provider_was_denied_854f0636",
						)}
					</Alert>
				);
				break;
			default:
				status = (
					<Alert severity="error">
						<AlertTitle>{deviceExchangeError.message}</AlertTitle>
						{deviceExchangeError.detail && (
							<AlertDescription>{deviceExchangeError.detail}</AlertDescription>
						)}
					</Alert>
				);
				break;
		}
	}

	// If the error comes from the `externalAuthDevice` query,
	// we cannot even display the user_code.
	if (deviceExchangeError && !externalAuthDevice) {
		return <div>{status}</div>;
	}

	if (!externalAuthDevice) {
		return <Loader />;
	}

	return (
		<div>
			<p className="m-0 text-center text-base leading-relaxed text-content-secondary">
				{tI18n("GitDeviceAuth.GitDeviceAuth.copy_your_one_time_code_8f558624")}
				<span className="inline-flex items-center">
					<span className="font-bold text-content-primary">
						{externalAuthDevice.user_code}
					</span>
					&nbsp;{" "}
					<CopyButton
						text={externalAuthDevice.user_code}
						label={tI18n("GitDeviceAuth.GitDeviceAuth.copy_user_code_c2e493d4")}
					/>
				</span>
				<br />
				{tI18n(
					"GitDeviceAuth.GitDeviceAuth.then_open_the_link_below_and_paste_it_2132630a",
				)}
			</p>
			<div className="m-4 flex justify-center">
				<Link
					className="inline-flex items-center gap-2 p-0 text-base font-medium [&_svg]:size-icon-xs [&_svg]:p-0"
					href={externalAuthDevice.verification_uri}
					target="_blank"
					rel="noreferrer"
					showExternalIcon={false}
				>
					<ExternalLinkIcon className="size-icon-xs" />
					{tI18n("GitDeviceAuth.GitDeviceAuth.open_and_paste_5ae36793")}
				</Link>
			</div>
			{status}
		</div>
	);
};
