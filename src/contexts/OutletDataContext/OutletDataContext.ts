import { createContext } from "react";

export const OUTLET_CONTEXT_SENTINEL = Object.freeze({});

export const OutletDataContext = createContext<unknown>(OUTLET_CONTEXT_SENTINEL);
