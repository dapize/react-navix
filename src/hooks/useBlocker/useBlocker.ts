import { useCallback, useContext, useEffect, useRef, useState } from "react";

import type { BlockerRegistration } from "@stores/blockers";
import type { Location } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { useNavigate } from "../useNavigate";
import { type BlockerContext, type BlockerFunction, useResolvedBlocker } from "../useResolvedBlocker";
import type { Blocker, PendingNavigation } from "./useBlocker.types";

const DEFAULT_LOCATION: Location = Object.freeze({
	pathname: "/",
	search: "",
	hash: "",
});

export const useBlocker = <T = unknown>(shouldBlock: BlockerFunction<T>): Blocker<T> => {
	const navigate = useNavigate();

	const blockerRegistry = useContext(BlockerRegistryContext);
	if (blockerRegistry === null) {
		throw new Error("useBlocker() must be used within a Router component.");
	}

	const { isBlockingValue, evaluate } = useResolvedBlocker<T>(shouldBlock);

	// The registration object is created once (its identity is what `unregister`
	// matches), so `evaluate` is reached through a ref to always read the latest
	// function regardless of whether `useResolvedBlocker` keeps it stable.
	const evaluateRef = useRef(evaluate);
	evaluateRef.current = evaluate;

	const pendingRef = useRef<PendingNavigation | null>(null);

	const bypassedTargetRef = useRef<string | null>(null);

	const prevIsBlockingRef = useRef(isBlockingValue);

	const [isBlocking, setIsBlocking] = useState(false);
	const [nextLocation, setNextLocation] = useState<Location>(DEFAULT_LOCATION);

	const registrationRef = useRef<BlockerRegistration>({
		isBlocking: (target, location, options, action) => {
			if (bypassedTargetRef.current !== null) {
				if (target !== undefined && bypassedTargetRef.current === target) {
					return false;
				}
				bypassedTargetRef.current = null;
			}
			// The store holds `Location` state as `unknown`; the cast propagates the
			// caller's asserted `T` into the context handed to the blocker callback.
			return evaluateRef.current(location && action ? ({ nextLocation: location, options, action } as BlockerContext<T>) : undefined);
		},
		onBlock: (location: Location, options, action) => {
			setIsBlocking(true);
			setNextLocation(location);
			pendingRef.current = {
				to: location.pathname + location.search + location.hash,
				options,
				action,
			};
		},
	});

	const clearBlock = useCallback(() => {
		setIsBlocking(false);
		setNextLocation(DEFAULT_LOCATION);
		pendingRef.current = null;
		bypassedTargetRef.current = null;
	}, []);

	const proceed = useCallback(() => {
		if (pendingRef.current) {
			const pending = pendingRef.current;
			clearBlock();
			bypassedTargetRef.current = pending.to;
			if (pending.action?.type === "delta") {
				navigate(pending.action.delta);
			} else {
				navigate(pending.to, pending.options);
			}
		}
	}, [clearBlock, navigate]);

	const reset = useCallback(() => {
		clearBlock();
	}, [clearBlock]);

	useEffect(() => {
		const registration = registrationRef.current;
		blockerRegistry.register(registration);
		return () => {
			blockerRegistry.unregister(registration);
		};
	}, [blockerRegistry]);

	useEffect(() => {
		if (prevIsBlockingRef.current && !isBlockingValue) {
			clearBlock();
		}
		prevIsBlockingRef.current = isBlockingValue;
	}, [isBlockingValue, clearBlock]);

	return { isBlocking, proceed, reset, nextLocation: nextLocation as Location<T> };
};
