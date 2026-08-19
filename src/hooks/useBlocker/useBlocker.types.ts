import type { BlockerAction } from "@stores/blockers";
import type { Location } from "@stores/location";
import type { NavigateOptions } from "@contexts/NavigatorContext";

export interface PendingNavigation<T = unknown> {
	to: string;
	options?: NavigateOptions<T>;
	action?: BlockerAction;
}

export interface Blocker<T = unknown> {
	isBlocking: boolean;
	proceed: () => void;
	reset: () => void;
	nextLocation: Location<T>;
}
