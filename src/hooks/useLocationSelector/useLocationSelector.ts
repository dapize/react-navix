import { useCallback, useContext, useRef, useSyncExternalStore } from "react";

import type { Location } from "@stores/location";
import { LocationStoreContext } from "@contexts/LocationStoreContext";

export const useLocationSelector = <T>(selector: (location: Location) => T): T => {
	const store = useContext(LocationStoreContext);
	if (store === null) {
		throw new Error("useLocationSelector() must be used within a Router component.");
	}

	const selectorRef = useRef(selector);
	selectorRef.current = selector;

	const getSnapshot = useCallback(() => selectorRef.current(store.getSnapshot()), [store]);

	const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
