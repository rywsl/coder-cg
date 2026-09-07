import { appearance } from "./appearance";
import { common } from "./common";
import generated from "./generated.json";

export const zhCN = {
	...generated,
	appearance,
	common,
} as const;
