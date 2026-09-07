import { appearance } from "./appearance";
import { common } from "./common";
import generated from "./generated.json";

export const en = {
	...generated,
	appearance,
	common,
} as const;
