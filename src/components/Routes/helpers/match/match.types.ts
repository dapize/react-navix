import type { CompiledRoute } from "../compile";

export interface MatchEntry {
	route: CompiledRoute;
	params: Record<string, string>;
	consumed: string;
}
