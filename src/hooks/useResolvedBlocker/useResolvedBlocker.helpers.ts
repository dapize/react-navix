import type { BlockerContext, BlockerFunction } from "./useResolvedBlocker.types";

/**
 * Whether `shouldBlock` is a function that expects a `BlockerContext` argument.
 *
 * `Function.length` reports the number of parameters declared before the first
 * default/rest parameter, so it misses callbacks declared as `(ctx = {}) => ...`
 * (which report `0`). When `length` is `0` the function source is inspected and
 * any declared non-rest first parameter is treated as context-aware. A rest-only
 * parameter (`(...args) => ...`) stays context-agnostic, matching how it is typed
 * by `BlockerFunction` (assignable to `() => boolean`).
 */
export const isContextAwareBlocker = <T = unknown>(shouldBlock: BlockerFunction<T>): shouldBlock is (ctx: BlockerContext<T>) => boolean => {
	if (typeof shouldBlock !== "function") return false;
	if (shouldBlock.length > 0) return true;

	const source = Function.prototype.toString.call(shouldBlock);
	const match = source.match(/\(([^)]*)\)/);
	if (match === null) return false;

	const params = match[1].trim();
	return params !== "" && !params.startsWith("...");
};
