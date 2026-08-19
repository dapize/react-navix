import { generateKey } from "@utils/generateKey";
import { parseTo } from "@helpers/parseTo";
import { stripBasename } from "@helpers/stripBasename";
import type { Location } from "@stores/location";
import type { HistoryEntry } from "./MemoryRouter.types";

export const createInitialEntries = (initialEntries: string[], basename: string, keyCounterRef: { current: number }): HistoryEntry[] => {
	return initialEntries.map((entryStr) => {
		const parsed = parseTo(entryStr);
		return {
			pathname: stripBasename(parsed.pathname, basename),
			search: parsed.search,
			hash: parsed.hash,
			state: undefined,
			key: generateKey(keyCounterRef),
		};
	});
};

export const clampIndex = (index: number, entriesLength: number): number => {
	return Math.max(0, Math.min(index, entriesLength - 1));
};

export const extractLocationFromEntry = (entry: HistoryEntry): Location => ({
	pathname: entry.pathname,
	search: entry.search,
	hash: entry.hash,
	state: entry.state,
	key: entry.key,
});
