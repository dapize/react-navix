import type { ReactNode } from "react";

export interface MemoryRouterProps {
	children: ReactNode;
	initialEntries?: string[];
	initialIndex?: number;
	basename?: string;
}

export interface HistoryEntry {
	pathname: string;
	search: string;
	hash: string;
	state?: unknown;
	key: string;
}
