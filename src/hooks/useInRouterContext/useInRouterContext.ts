import { useContext } from "react";

import { LocationStoreContext } from "@contexts/LocationStoreContext";

export const useInRouterContext = (): boolean => {
	const store = useContext(LocationStoreContext);
	return store !== null;
};
