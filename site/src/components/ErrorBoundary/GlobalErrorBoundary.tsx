import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type ErrorResponse,
	isRouteErrorResponse,
	useLocation,
	useRouteError,
} from "react-router";
import { Button } from "#/components/Button/Button";
import { ProductLogo } from "#/components/Icons/ProductLogo";
import { Link } from "#/components/Link/Link";
import { useEmbeddedMetadata } from "#/hooks/useEmbeddedMetadata";
import { i18n } from "#/i18n";

const errorPageTitle = i18n.t(
	"components:ErrorBoundary.GlobalErrorBoundary.something_went_wrong_ab827e3f",
);

// Mocking React Router's error-handling logic is a pain; the next best thing is
// to split it off from the rest of the code, and pass the value via props
export const GlobalErrorBoundary: FC = () => {
	const error = useRouteError();
	return <GlobalErrorBoundaryInner error={error} />;
};

type GlobalErrorBoundaryInnerProps = Readonly<{ error: unknown }>;
export const GlobalErrorBoundaryInner: FC<GlobalErrorBoundaryInnerProps> = ({
	error,
}) => {
	const { t: tI18n } = useTranslation("components");

	const [showErrorMessage, setShowErrorMessage] = useState(false);
	const { metadata } = useEmbeddedMetadata();
	const location = useLocation();

	const coderVersion = metadata["build-info"].value?.version;
	const isRenderableError =
		error instanceof Error || isRouteErrorResponse(error);

	return (
		<div className="bg-surface-primary text-center w-full h-full flex justify-center items-center">
			<title>{errorPageTitle}</title>
			<main className="flex gap-6 w-full max-w-prose p-4 flex-col flex-nowrap">
				<div className="flex gap-2 flex-col items-center">
					<ProductLogo />

					<div className="text-content-primary flex flex-col gap-1">
						<h1 className="text-2xl font-semibold m-0">{errorPageTitle}</h1>
						<p className="leading-6 m-0 text-content-secondary text-sm">
							{tI18n(
								"ErrorBoundary.GlobalErrorBoundary.please_try_reloading_the_page_if_reloading_does__31285c23",
							)}{" "}
							<Link
								href="https://discord.gg/coder"
								target="_blank"
								rel="noreferrer"
							>
								{tI18n(
									"ErrorBoundary.GlobalErrorBoundary.coder_discord_community_f85d6920",
								)}
								<span className="sr-only">
									{tI18n(
										"ErrorBoundary.GlobalErrorBoundary.link_opens_in_a_new_tab_f5cbda09",
									)}
								</span>
							</Link>{" "}
							{tI18n("ErrorBoundary.GlobalErrorBoundary.or_7175517a")}{" "}
							<Link
								target="_blank"
								rel="noreferrer"
								href={publicGithubIssueLink(
									coderVersion,
									location.pathname,
									error,
								)}
							>
								{tI18n(
									"ErrorBoundary.GlobalErrorBoundary.open_an_issue_on_github_860e531b",
								)}
								<span className="sr-only">
									{tI18n(
										"ErrorBoundary.GlobalErrorBoundary.link_opens_in_a_new_tab_f5cbda09",
									)}
								</span>
							</Link>
							.
						</p>
					</div>
				</div>

				<div className="flex flex-row flex-nowrap justify-center gap-2">
					<Button asChild className="min-w-32 ">
						<a href={location.pathname}>
							{tI18n("ErrorBoundary.GlobalErrorBoundary.reload_page_437d0d63")}
						</a>
					</Button>

					{isRenderableError && (
						<Button
							variant="outline"
							className="min-w-32"
							onClick={() => setShowErrorMessage(!showErrorMessage)}
						>
							{showErrorMessage
								? tI18n("ErrorBoundary.GlobalErrorBoundary.hide_error_85c5803b")
								: tI18n(
										"ErrorBoundary.GlobalErrorBoundary.show_error_f2ec9ead",
									)}
						</Button>
					)}
				</div>

				{isRenderableError && showErrorMessage && <ErrorStack error={error} />}
			</main>
		</div>
	);
};

type ErrorStackProps = Readonly<{ error: Error | ErrorResponse }>;
const ErrorStack: FC<ErrorStackProps> = ({ error }) => {
	return (
		<aside className="p-4 text-left rounded-md border border-content-tertiary border-solid">
			{isRouteErrorResponse(error) ? (
				<>
					<h2 className="text-base font-bold text-content-primary m-0">
						HTTP {error.status} - {error.statusText}
					</h2>
					<pre className="m-0 py-2 px-0 overflow-x-auto text-xs">
						<code data-testid="code">{serializeDataAsJson(error.data)}</code>
					</pre>
				</>
			) : (
				<>
					<h2 className="text-base font-bold text-content-primary m-0">
						{error.name}
					</h2>
					<p data-testid="description" className="pb-4 leading-5 m-0">
						{error.message}
					</p>
					{error.stack && (
						<pre className="m-0 py-2 px-0 overflow-x-auto text-xs">
							<code data-testid="code" data-pixel="ignore">
								{error.stack}
							</code>
						</pre>
					)}
				</>
			)}
		</aside>
	);
};

function serializeDataAsJson(data: unknown): string | null {
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return null;
	}
}

function publicGithubIssueLink(
	coderVersion: string | undefined,
	pathName: string,
	error: unknown,
): string {
	const baseLink = "https://github.com/coder/coder/issues/new";

	// Anytime you see \`\`\`txt, that's wrapping the text in a GitHub codeblock
	let printableDetails: string;
	if (error instanceof Error) {
		printableDetails = [
			`${error.name}: ${error.message}`,
			error.stack ? `\`\`\`txt\n${error.stack}\n\`\`\`` : "No stack",
		].join("\n");
	} else if (isRouteErrorResponse(error)) {
		const serialized = serializeDataAsJson(error.data);
		printableDetails = [
			`HTTP ${error.status} - ${error.statusText}`,
			serialized ? `\`\`\`txt\n${serialized}\n\`\`\`` : "(No data)",
		].join("\n");
	} else {
		printableDetails = "No error message available";
	}

	const messageBody = `\
**Version**
${coderVersion ?? "-- Set version --"}

**Path**
\`${pathName}\`

**Error**
${printableDetails}`;

	return `${baseLink}?body=${encodeURIComponent(messageBody)}`;
}
