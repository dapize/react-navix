import { createContext } from "react";

import type { NavigateFunction } from "./NavigatorContext.types";

export const NavigatorContext = createContext<NavigateFunction | null>(null);
