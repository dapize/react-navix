import type { Location } from "@stores/location";
import type { NavigateOptions } from "@contexts/NavigatorContext";

export type BlockerAction = { type: "push" } | { type: "replace" } | { type: "delta"; delta: number };

export interface BlockerRegistration {
	isBlocking: (target?: string, location?: Location, options?: NavigateOptions, action?: BlockerAction) => boolean;
	onBlock: (nextLocation: Location, options?: NavigateOptions, action?: BlockerAction) => void;
}
