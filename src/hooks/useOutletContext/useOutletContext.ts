import { useContext } from "react";

import { OUTLET_CONTEXT_SENTINEL, OutletDataContext } from "@contexts/OutletDataContext";

export const useOutletContext = <T>(): T => {
	const context = useContext(OutletDataContext);

	if (Object.is(context, OUTLET_CONTEXT_SENTINEL)) {
		throw new Error("useOutletContext() must be used inside a child route rendered by <Outlet context={...} />.");
	}

	return context as T;
};
