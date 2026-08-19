import { createContext } from "react";

import type { BlockerRegistry } from "@stores/blockers";

export const BlockerRegistryContext = createContext<BlockerRegistry | null>(null);
