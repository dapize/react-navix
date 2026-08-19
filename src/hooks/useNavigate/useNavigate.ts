import { useCallback, useContext } from "react";

import { resolvePath } from "@helpers/resolvePath";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { type NavigateFunction, type NavigateOptions, NavigatorContext } from "@contexts/NavigatorContext";
import { RoutesContext } from "@contexts/RoutesContext";

export const useNavigate = <T = unknown>(): NavigateFunction<T> => {
	const rawNavigate = useContext(NavigatorContext);
	const store = useContext(LocationStoreContext);
	const { routeBase } = useContext(RoutesContext);

	return useCallback(
		(to: string | number, options?: NavigateOptions<T>) => {
			if (store === null || rawNavigate === null) {
				throw new Error("useNavigate() must be used within a Router component.");
			}

			if (typeof to === "number") {
				rawNavigate(to, options);
				return;
			}

			const fromPathname = options?.relative === "path" ? store.getSnapshot().pathname : routeBase || store.getSnapshot().pathname;
			const resolvedTo = resolvePath(to, fromPathname);
			rawNavigate(resolvedTo, options);
		},
		[rawNavigate, store, routeBase],
	);
};
