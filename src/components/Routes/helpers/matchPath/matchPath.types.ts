/**
 * Result of matching a pathname against a route pattern.
 *
 * `consumed` is the portion of the pathname covered by the pattern.
 * `pathnameBase` is `consumed` with the trailing wildcard (`*`) capture
 * removed — useful for resolving relative paths inside splat routes.
 */
export interface MatchResult {
	params: Record<string, string>;
	consumed: string;
	pathnameBase: string;
}

export interface MatchPathOptions {
	exact?: boolean;
	end?: boolean;
}
