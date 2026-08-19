import type { BlockerAction } from "@stores/blockers";
import type { Location } from "@stores/location";
import type { NavigateOptions } from "@contexts/NavigatorContext";

export interface BlockerContext<T = unknown> {
	nextLocation: Location<T>;
	options?: NavigateOptions<T>;
	action: BlockerAction;
}

export type BlockerFunction<T = unknown> = boolean | (() => boolean) | ((ctx: BlockerContext<T>) => boolean);

export interface ResolvedBlocker<T = unknown> {
	isBlockingValue: boolean;
	evaluate: (context?: BlockerContext<T>) => boolean;
}
