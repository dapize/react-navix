import { describe, expect, it } from "vitest";

import { areParamsEqual } from "./areParamsEqual";

describe("areParamsEqual", () => {
	it("Should return true When both objects are empty", () => {
		expect(areParamsEqual({}, {})).toBe(true);
	});

	it("Should return true When both objects have the same keys and values", () => {
		expect(areParamsEqual({ id: "42" }, { id: "42" })).toBe(true);
	});

	it("Should return true When both objects have multiple identical entries", () => {
		expect(areParamsEqual({ id: "42", slug: "hello" }, { id: "42", slug: "hello" })).toBe(true);
	});

	it("Should return false When values differ for the same key", () => {
		expect(areParamsEqual({ id: "42" }, { id: "99" })).toBe(false);
	});

	it("Should return false When lengths differ", () => {
		expect(areParamsEqual({ id: "42" }, { id: "42", slug: "hello" })).toBe(false);
	});

	it("Should return false When keys differ but length is the same", () => {
		expect(areParamsEqual({ id: "42", slug: "hello" }, { id: "42", name: "John" })).toBe(false);
	});

	it("Should return false When one object is a superset with extra keys", () => {
		expect(areParamsEqual({ id: "42", slug: "hello", extra: "x" }, { id: "42", slug: "hello" })).toBe(false);
	});

	it("Should return false When one object is empty and the other is not", () => {
		expect(areParamsEqual({}, { id: "42" })).toBe(false);
	});
});
