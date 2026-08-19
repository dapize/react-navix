import { getRouteResolutionBase } from "../getRouteResolutionBase";
import { buildConsumed, parseSegments, tryMatchSegments } from "../segments";
import type { MatchPathOptions, MatchResult } from "./matchPath.types";

export const matchPath = (pattern: string, pathname: string, options?: MatchPathOptions): MatchResult | null => {
	const pathnameSegments = pathname.split("/").filter(Boolean);

	const result = tryMatchSegments(parseSegments(pattern), pathnameSegments);
	if (!result) return null;

	const resolvedExact = options?.exact ?? options?.end ?? false;
	if (resolvedExact && result.consumedCount !== pathnameSegments.length) return null;

	const consumed = buildConsumed(pathnameSegments, result.consumedCount);

	return {
		params: result.params,
		consumed,
		pathnameBase: getRouteResolutionBase(consumed, result.params),
	};
};
