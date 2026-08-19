import { createContext, type ReactNode } from "react";

import type { RoutesContextValue } from "./RoutesContext.types";

export const RoutesContext = createContext<RoutesContextValue>({
	params: {},
	routeBase: "",
});

export const OutletContext = createContext<ReactNode>(null);
