import { createContext } from "react";

import type { MatchRecord } from "./MatchesContext.types";

export const MatchesContext = createContext<MatchRecord[]>([]);
