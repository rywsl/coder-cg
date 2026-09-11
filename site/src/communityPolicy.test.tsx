import { matchRoutes } from "react-router";
import type { SerpentOption } from "#/api/typesGenerated";
import {
	communityUIHiddenRoutes,
	isCommunityDeploymentOption,
} from "#/communityPolicy";
import { router } from "#/router";

const hiddenPaths: readonly (readonly [string, string])[] = [
	["/audit", "/audit"],
	["/connectionlog", "/connectionlog"],
	["/deployment/premium", "/deployment/premium"],
	["/deployment/licenses", "/deployment/licenses/*"],
	["/deployment/licenses/add", "/deployment/licenses/*"],
	["/deployment/workspace-proxies", "/deployment/workspace-proxies"],
	["/deployment/groups", "/deployment/groups/*"],
	["/deployment/groups/example", "/deployment/groups/*"],
	["/deployment/idp-org-sync", "/deployment/idp-org-sync"],
	["/groups/example", "/groups/:communityPath/*"],
	["/organizations/new", "/organizations/new"],
	["/organizations/acme/groups", "/organizations/:organization/groups/*"],
	["/organizations/acme/roles/create", "/organizations/:organization/roles/*"],
	["/organizations/acme/idp-sync", "/organizations/:organization/idp-sync"],
	[
		"/organizations/acme/provisioner-keys",
		"/organizations/:organization/provisioner-keys",
	],
	["/templates/docker/prebuilds", "/templates/:template/prebuilds"],
	[
		"/templates/acme/docker/prebuilds",
		"/templates/:organization/:template/prebuilds",
	],
	[
		"/templates/docker/settings/permissions",
		"/templates/:template/settings/permissions",
	],
	[
		"/templates/acme/docker/settings/permissions",
		"/templates/:organization/:template/settings/permissions",
	],
	["/ai-gateway/sessions", "/ai-gateway/:communityPath/*"],
	["/aibridge/sessions/example", "/aibridge/*"],
	["/ai/settings/governance", "/ai/settings/governance"],
	["/ai/settings/gateway-keys", "/ai/settings/gateway-keys"],
	["/health/workspace-proxy", "/health/workspace-proxy"],
];

test.each(hiddenPaths)(
	"%s resolves to the community 404 route",
	(path, pattern) => {
		const matches = matchRoutes(router.routes, path);
		const leaf = matches?.at(-1);

		expect(communityUIHiddenRoutes).toContain(pattern);
		expect(leaf?.route.path).toBe(pattern);
	},
);

test("filters enterprise deployment options", () => {
	const communityOption: SerpentOption = {
		name: "Access URL",
		annotations: {},
	};
	const enterpriseOption: SerpentOption = {
		name: "Workspace Proxy",
		annotations: { enterprise: "true" },
	};

	expect(isCommunityDeploymentOption(communityOption)).toBe(true);
	expect(isCommunityDeploymentOption(enterpriseOption)).toBe(false);
});
