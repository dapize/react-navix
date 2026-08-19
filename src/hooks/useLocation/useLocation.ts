import { useContext, useSyncExternalStore } from "react";

import type { Location } from "@stores/location";
import { LocationStoreContext } from "@contexts/LocationStoreContext";

export const useLocation = <T = unknown>(): Location<T> => {
	const store = useContext(LocationStoreContext);
	if (store === null) {
		throw new Error("useLocation() must be used within a Router component.");
	}
	return useSyncExternalStore(store.subscribe, store.getSnapshot) as Location<T>;
};
