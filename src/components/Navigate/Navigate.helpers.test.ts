import { describe, expect, it } from "vitest";

import { deepEqual } from "./Navigate.helpers";

describe("deepEqual", () => {
	it("Should return true for equal primitives", () => {
		expect(deepEqual(1, 1)).toBe(true);
		expect(deepEqual("a", "a")).toBe(true);
		expect(deepEqual(null, null)).toBe(true);
		expect(deepEqual(undefined, undefined)).toBe(true);
	});

	it("Should return false for different primitives", () => {
		expect(deepEqual(1, 2)).toBe(false);
		expect(deepEqual("a", "b")).toBe(false);
		expect(deepEqual(null, undefined)).toBe(false);
	});

	it("Should return true for plain objects with the same content", () => {
		expect(deepEqual({ id: 1 }, { id: 1 })).toBe(true);
	});

	it("Should return false for plain objects with different content", () => {
		expect(deepEqual({ id: 1 }, { id: 2 })).toBe(false);
	});

	it("Should return true for nested objects with the same content", () => {
		expect(deepEqual({ user: { id: 1, name: "a" } }, { user: { id: 1, name: "a" } })).toBe(true);
	});

	it("Should return false for nested objects with different content", () => {
		expect(deepEqual({ user: { id: 1 } }, { user: { id: 2 } })).toBe(false);
	});

	it("Should return true for arrays with the same content", () => {
		expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
	});

	it("Should return false for arrays with different content or order", () => {
		expect(deepEqual([1, 2], [1, 3])).toBe(false);
		expect(deepEqual([1, 2], [2, 1])).toBe(false);
	});

	it("Should return false for arrays with different lengths", () => {
		expect(deepEqual([1], [1, 2])).toBe(false);
	});

	it("Should return false When one value is an array and the other is a plain object", () => {
		expect(deepEqual([], {})).toBe(false);
		expect(deepEqual({ 0: "a" }, ["a"])).toBe(false);
	});

	it("Should return false When keys differ", () => {
		expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
		expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
	});

	it("Should compare Date values by their timestamp", () => {
		expect(deepEqual(new Date(0), new Date(0))).toBe(true);
		expect(deepEqual(new Date(0), new Date(1))).toBe(false);
	});

	it("Should not hang on circular references", () => {
		const first: Record<string, unknown> = { name: "a" };
		first.self = first;
		const second: Record<string, unknown> = { name: "a" };
		second.self = second;

		expect(deepEqual(first, second)).toBe(true);
	});

	it("Should compare non-plain objects by reference", () => {
		const firstMap = new Map([["a", 1]]);
		const secondMap = new Map([["a", 1]]);

		expect(deepEqual(firstMap, secondMap)).toBe(false);
		expect(deepEqual(firstMap, firstMap)).toBe(true);
	});
});
