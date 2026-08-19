import { useCallback, useEffect, useRef } from "react";

import { generateKey } from "@utils/generateKey";
import { parseTo } from "@helpers/parseTo";
import { resolvePath } from "@helpers/resolvePath";
import { type BlockerRegistry, createBlockerRegistry } from "@stores/blockers";
import { createLocationStore, type LocationStore } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { type NavigateOptions, NavigatorContext } from "@contexts/NavigatorContext";
import { extractLocationFromHash } from "./HashRouter.helpers";
import type { HashRouterProps } from "./HashRouter.types";

export const HashRouter = ({ children, basename: rawBasename = "" }: HashRouterProps) => {
	const basename = rawBasename.replace(/\/$/, "") || "";

	const keyCounterRef = useRef(0);

	const locationStoreRef = useRef<LocationStore>(null!);
	if (!locationStoreRef.current) {
		const initialLocation = extractLocationFromHash(basename);
		initialLocation.key ??= generateKey(keyCounterRef);
		locationStoreRef.current = createLocationStore(initialLocation, `#${basename}`);
	}
	const locationStore = locationStoreRef.current;

	const blockerRegistryRef = useRef<BlockerRegistry>(null!);
	if (!blockerRegistryRef.current) {
		blockerRegistryRef.current = createBlockerRegistry();
	}
	const blockerRegistry = blockerRegistryRef.current;

	const idxRef = useRef(0);
	const revertingRef = useRef(false);
	const blockingPopStateRef = useRef(false);

	const navigate = useCallback(
		(to: string | number, options?: NavigateOptions) => {
			if (typeof to === "number") {
				if (to !== 0) {
					window.history.go(to);
				}
				return;
			}

			const resolvedTo = resolvePath(to, locationStore.getSnapshot().pathname);

			const blocked = blockerRegistry.check(resolvedTo, { ...parseTo(resolvedTo), state: options?.state }, options, {
				type: options?.replace ? "replace" : "push",
			});
			if (blocked) return;

			blockingPopStateRef.current = false;

			const normalizedTo = resolvedTo.startsWith("/") ? resolvedTo : `/${resolvedTo}`;
			const hash = `#${basename}${normalizedTo}`;

			if (options?.replace) {
				const historyState: Record<string, unknown> = {
					idx: idxRef.current,
					key: locationStore.getSnapshot().key ?? generateKey(keyCounterRef),
				};
				if (options.state !== undefined) {
					historyState.usr = options.state;
				}
				window.history.replaceState(historyState, "", hash);
			} else {
				const nextIdx = idxRef.current + 1;
				idxRef.current = nextIdx;
				const historyState: Record<string, unknown> = { idx: nextIdx, key: generateKey(keyCounterRef) };
				if (options?.state !== undefined) {
					historyState.usr = options.state;
				}
				window.history.pushState(historyState, "", hash);
			}
			locationStore.setLocation(extractLocationFromHash(basename));
		},
		[basename, locationStore, blockerRegistry.check],
	);

	useEffect(() => {
		const existingState = window.history.state ?? {};
		const key =
			((existingState as Record<string, unknown>).key as string | undefined) ??
			locationStore.getSnapshot().key ??
			generateKey(keyCounterRef);
		window.history.replaceState({ ...existingState, idx: 0, key }, "");
		idxRef.current = 0;

		// Both popstate and hashchange fire during browser back/forward, but only
		// hashchange fires for URL bar edits and hash-link clicks. Popstate is the
		// authoritative handler (it has event.state.idx for delta / blocker checks),
		// so hashchange defers its store update via a macrotask timer. Popstate clears
		// the timer if both events fire, preventing redundant or premature updates.
		// See docs/POPSTATE_HASHCHANGE_EVENT_ORDER.md for the full trace analysis.
		let hashChangeTimer: ReturnType<typeof setTimeout> | null = null;

		const handleHashChange = () => {
			if (blockingPopStateRef.current) return;

			const nextLocation = extractLocationFromHash(basename);
			if (hashChangeTimer) clearTimeout(hashChangeTimer);
			hashChangeTimer = setTimeout(() => {
				hashChangeTimer = null;
				locationStore.setLocation(nextLocation);
			}, 0);
		};

		const handlePopState = (event: PopStateEvent) => {
			if (hashChangeTimer) {
				clearTimeout(hashChangeTimer);
				hashChangeTimer = null;
			}

			if (revertingRef.current) {
				revertingRef.current = false;
				blockingPopStateRef.current = false;
				return;
			}

			const nextIdx: number | undefined = event.state?.idx;
			const currentIdx = idxRef.current;

			if (nextIdx === undefined) {
				const nextLocation = extractLocationFromHash(basename);
				idxRef.current = 0;
				locationStore.setLocation(nextLocation);
				return;
			}

			const nextLocation = extractLocationFromHash(basename);
			const delta = currentIdx - nextIdx;

			if (delta !== 0) {
				const nextTarget = nextLocation.pathname + nextLocation.search + nextLocation.hash;
				const blocked = blockerRegistry.check(nextTarget, nextLocation, { state: nextLocation.state }, { type: "delta", delta: -delta });
				if (blocked) {
					revertingRef.current = true;
					blockingPopStateRef.current = true;
					window.history.go(delta);
					return;
				}
			}

			blockingPopStateRef.current = false;
			idxRef.current = nextIdx;
			locationStore.setLocation(nextLocation);
		};

		window.addEventListener("popstate", handlePopState);
		window.addEventListener("hashchange", handleHashChange);
		return () => {
			if (hashChangeTimer) clearTimeout(hashChangeTimer);
			window.removeEventListener("popstate", handlePopState);
			window.removeEventListener("hashchange", handleHashChange);
		};
	}, [basename, locationStore, blockerRegistry.check]);

	return (
		<BlockerRegistryContext.Provider value={blockerRegistry}>
			<LocationStoreContext.Provider value={locationStore}>
				<NavigatorContext.Provider value={navigate}>{children}</NavigatorContext.Provider>
			</LocationStoreContext.Provider>
		</BlockerRegistryContext.Provider>
	);
};
