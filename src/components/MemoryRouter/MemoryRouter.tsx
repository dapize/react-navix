import { useCallback, useRef } from "react";

import { generateKey } from "@utils/generateKey";
import { parseTo } from "@helpers/parseTo";
import { resolvePath } from "@helpers/resolvePath";
import { type BlockerRegistry, createBlockerRegistry } from "@stores/blockers";
import { createLocationStore, type LocationStore } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { type NavigateOptions, NavigatorContext } from "@contexts/NavigatorContext";
import { clampIndex, createInitialEntries, extractLocationFromEntry } from "./MemoryRouter.helpers";
import type { HistoryEntry, MemoryRouterProps } from "./MemoryRouter.types";

export const MemoryRouter = ({
	children,
	initialEntries: rawEntries,
	initialIndex: rawIndex = 0,
	basename: rawBasename = "",
}: MemoryRouterProps) => {
	const basename = rawBasename.replace(/\/$/, "") || "";
	const keyCounterRef = useRef(0);

	const historyRef = useRef<{ entries: HistoryEntry[] }>(null!);
	if (!historyRef.current) {
		const entries =
			rawEntries && rawEntries.length > 0
				? createInitialEntries(rawEntries, basename, keyCounterRef)
				: createInitialEntries(["/"], basename, keyCounterRef);
		historyRef.current = { entries };
	}

	const idxRef = useRef(clampIndex(rawIndex, historyRef.current.entries.length));

	const locationStoreRef = useRef<LocationStore>(null!);
	if (!locationStoreRef.current) {
		const initialEntry = historyRef.current.entries[idxRef.current];
		initialEntry.key ??= generateKey(keyCounterRef);
		locationStoreRef.current = createLocationStore(extractLocationFromEntry(initialEntry), basename);
	}
	const locationStore = locationStoreRef.current;

	const blockerRegistryRef = useRef<BlockerRegistry>(null!);
	if (!blockerRegistryRef.current) {
		blockerRegistryRef.current = createBlockerRegistry();
	}
	const blockerRegistry = blockerRegistryRef.current;

	const navigate = useCallback(
		(to: string | number, options?: NavigateOptions) => {
			if (typeof to === "number") {
				const delta = to;
				if (delta === 0) return;

				const nextIdx = idxRef.current + delta;
				if (nextIdx < 0 || nextIdx >= historyRef.current.entries.length) return;

				const nextEntry = historyRef.current.entries[nextIdx];
				const nextTarget = nextEntry.pathname + nextEntry.search + nextEntry.hash;

				const blocked = blockerRegistry.check(
					nextTarget,
					extractLocationFromEntry(nextEntry),
					{ state: options?.state },
					{ type: "delta", delta },
				);
				if (blocked) return;

				idxRef.current = nextIdx;
				locationStore.setLocation(extractLocationFromEntry(historyRef.current.entries[nextIdx]));
				return;
			}

			const resolvedTo = resolvePath(to, locationStore.getSnapshot().pathname);

			const blocked = blockerRegistry.check(resolvedTo, { ...parseTo(resolvedTo), state: options?.state }, options, {
				type: options?.replace ? "replace" : "push",
			});
			if (blocked) return;

			const parsed = parseTo(resolvedTo);
			const key = generateKey(keyCounterRef);
			const entry: HistoryEntry = {
				pathname: parsed.pathname,
				search: parsed.search,
				hash: parsed.hash,
				state: options?.state,
				key,
			};

			if (options?.replace) {
				historyRef.current.entries[idxRef.current] = entry;
			} else {
				const nextIdx = idxRef.current + 1;
				historyRef.current.entries = historyRef.current.entries.slice(0, nextIdx);
				historyRef.current.entries.push(entry);
				idxRef.current = nextIdx;
			}

			locationStore.setLocation(extractLocationFromEntry(entry));
		},
		[locationStore, blockerRegistry.check],
	);

	return (
		<BlockerRegistryContext.Provider value={blockerRegistry}>
			<LocationStoreContext.Provider value={locationStore}>
				<NavigatorContext.Provider value={navigate}>{children}</NavigatorContext.Provider>
			</LocationStoreContext.Provider>
		</BlockerRegistryContext.Provider>
	);
};
