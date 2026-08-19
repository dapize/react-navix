import { createContext } from "react";

import type { RouteErrorContextValue } from "./RouteErrorContext.types";

export const RouteErrorContext = createContext<RouteErrorContextValue | null>(null);
