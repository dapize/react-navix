import type { Location } from "@stores/location";
import type { NavigateOptions } from "@contexts/NavigatorContext";
import type { BlockerAction, BlockerRegistration } from "./blockers.types";

export const createBlockerRegistry = () => {
	const blockers: BlockerRegistration[] = [];

	return {
		register: (blocker: BlockerRegistration) => {
			blockers.push(blocker);
		},

		unregister: (blocker: BlockerRegistration) => {
			const index = blockers.indexOf(blocker);
			if (index !== -1) {
				blockers.splice(index, 1);
			}
		},

		check: (target: string, location: Location, options: NavigateOptions | undefined, action: BlockerAction): boolean => {
			let blocked = false;
			for (const blocker of blockers) {
				if (blocker.isBlocking(target, location, options, action)) {
					blocker.onBlock(location, options, action);
					blocked = true;
				}
			}
			return blocked;
		},
	};
};

export type BlockerRegistry = ReturnType<typeof createBlockerRegistry>;
