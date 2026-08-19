import { useEffect } from "react";

import { type BlockerContext, type BlockerFunction, useResolvedBlocker } from "../useResolvedBlocker";

const DEFAULT_CONTEXT: BlockerContext = Object.freeze({
	nextLocation: Object.freeze({ pathname: "", search: "", hash: "" }),
	action: Object.freeze({ type: "push" as const }),
});

export const useBeforeUnload = <T = unknown>(shouldBlock: BlockerFunction<T>): void => {
	const { isBlockingValue, evaluate } = useResolvedBlocker<T>(shouldBlock);

	useEffect(() => {
		if (!isBlockingValue) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			// `DEFAULT_CONTEXT` carries no state, so casting it to `BlockerContext<T>`
			// only asserts the caller's state type over an otherwise empty location.
			if (evaluate(DEFAULT_CONTEXT as BlockerContext<T>)) {
				event.preventDefault();
				event.returnValue = "true";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isBlockingValue, evaluate]);
};
