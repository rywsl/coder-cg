import type { SerpentOption } from "#/api/typesGenerated";

export const communityUIHiddenRoutes = Object.freeze([
	"/audit",
	"/connectionlog",
	"/deployment/premium",
	"/deployment/licenses/*",
	"/deployment/workspace-proxies",
	"/deployment/groups/*",
	"/deployment/idp-org-sync",
	"/groups/:communityPath/*",
	"/organizations/new",
	"/organizations/:organization/groups/*",
	"/organizations/:organization/roles/*",
	"/organizations/:organization/idp-sync",
	"/organizations/:organization/provisioner-keys",
	"/templates/:template/prebuilds",
	"/templates/:organization/:template/prebuilds",
	"/templates/:template/settings/permissions",
	"/templates/:organization/:template/settings/permissions",
	"/ai-gateway/:communityPath/*",
	"/aibridge/*",
	"/ai/settings/governance",
	"/ai/settings/gateway-keys",
	"/health/workspace-proxy",
]);

export const isCommunityDeploymentOption = (option: SerpentOption): boolean =>
	option.annotations?.enterprise !== "true";
