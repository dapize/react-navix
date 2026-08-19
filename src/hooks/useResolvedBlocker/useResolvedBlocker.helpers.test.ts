import { describe, expect, it } from "vitest";

import { isContextAwareBlocker } from "./useResolvedBlocker.helpers";
import type { BlockerContext } from "./useResolvedBlocker.types";

describe("isContextAwareBlocker", () => {
	it("Should return false for a boolean", () => {
		expect(isContextAwareBlocker(true)).toBe(false);
		expect(isContextAwareBlocker(false)).toBe(false);
	});

	it("Should return false for a zero-arg function", () => {
		expect(isContextAwareBlocker(() => true)).toBe(false);
	});

	it("Should return true for a function with a required context parameter", () => {
		expect(isContextAwareBlocker((ctx: BlockerContext) => ctx.action.type === "push")).toBe(true);
	});

	it("Should return true for a function with a defaulted context parameter", () => {
		expect(
			isContextAwareBlocker(
				(ctx: BlockerContext = { nextLocation: { pathname: "", search: "", hash: "" }, action: { type: "push" } }) =>
					ctx.action.type === "push",
			),
		).toBe(true);
	});

	it("Should return false for a function with a rest-only parameter", () => {
		expect(isContextAwareBlocker((...args: BlockerContext[]) => args.length > 0)).toBe(false);
	});
});
