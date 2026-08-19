import { useCallback, useRef } from "react";

import { isContextAwareBlocker } from "./useResolvedBlocker.helpers";
import type { BlockerContext, BlockerFunction, ResolvedBlocker } from "./useResolvedBlocker.types";

export const useResolvedBlocker = <T = unknown>(shouldBlock: BlockerFunction<T>): ResolvedBlocker<T> => {
	const contextAware = isContextAwareBlocker(shouldBlock);
	const isFunction = typeof shouldBlock === "function";
	const isBlockingValue = contextAware ? true : isFunction ? (shouldBlock as () => boolean)() : shouldBlock;

	// `evaluate` is memoized once, so it reaches the latest `shouldBlock` through
	// these refs. They are synced during render (not in an effect) so handlers
	// always read the current value without depending on it — the same
	// "latest value" pattern used by useLocationSelector.
	const isContextAwareRef = useRef(contextAware);
	isContextAwareRef.current = contextAware;

	const isBlockingFn: (ctx?: BlockerContext<T>) => boolean = isFunction
		? (shouldBlock as (ctx?: BlockerContext<T>) => boolean)
		: () => shouldBlock;

	const isBlockingFnRef = useRef(isBlockingFn);
	isBlockingFnRef.current = isBlockingFn;

	const evaluate = useCallback((context?: BlockerContext<T>): boolean => {
		if (isContextAwareRef.current && context !== undefined) {
			return isBlockingFnRef.current(context);
		}
		return isBlockingFnRef.current();
	}, []);

	return { isBlockingValue, evaluate };
};
