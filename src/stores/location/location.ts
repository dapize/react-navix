import type { Location } from "./location.types";

export const createLocationStore = (initial: Location, prefix: string) => {
	let current = initial;
	const listeners = new Set<() => void>();

	return {
		prefix,
		getSnapshot: () => current,
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		setLocation: (next: Location) => {
			if (
				current.pathname === next.pathname &&
				current.search === next.search &&
				current.hash === next.hash &&
				current.state === next.state &&
				current.key === next.key
			) {
				return;
			}
			current = next;
			for (const listener of listeners) {
				listener();
			}
		},
	};
};

/** Store returned by {@link createLocationStore}. Its `prefix` is the href prefix
 *  prepended when building anchor hrefs — BrowserRouter uses the basename (e.g. "/app"),
 *  HashRouter includes the hash separator (e.g. "#/app"). */
export type LocationStore = ReturnType<typeof createLocationStore>;
