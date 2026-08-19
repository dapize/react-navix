/**
 * Represents the current URL location.
 *
 * `pathname` is percent-decoded so that route patterns with Unicode
 * characters (`ñ`, emoji, CJK) match correctly; malformed percent sequences
 * (a literal `%` not followed by two hex digits) are left as-is. `search`
 * and `hash` are kept percent-encoded — this matches the `window.location` API
 * and ensures {@link useSearchParams} can parse them with `URLSearchParams`.
 *
 * Example: navigating to `/niño?q=café#sección` produces:
 * ```
 * { pathname: "/niño", search: "?q=caf%C3%A9", hash: "#secci%C3%B3n" }
 * ```
 */
export interface Location<T = unknown> {
	pathname: string;
	search: string;
	hash: string;
	state?: T;
	key?: string;
}
