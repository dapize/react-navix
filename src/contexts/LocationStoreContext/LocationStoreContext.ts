import { createContext } from "react";

import type { LocationStore } from "@stores/location";

export const LocationStoreContext = createContext<LocationStore | null>(null);
