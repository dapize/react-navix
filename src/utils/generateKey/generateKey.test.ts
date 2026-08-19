import { describe, expect, it } from "vitest";

import { generateKey } from "./generateKey";

describe("generateKey", () => {
	it("Should return a non-empty string", () => {
		const ref = { current: 0 };
		const key = generateKey(ref);

		expect(key).toBeTypeOf("string");
		expect(key.length).toBeGreaterThan(0);
	});

	it("Should return unique values on consecutive calls", () => {
		const ref = { current: 0 };
		const keys = Array.from({ length: 100 }, () => generateKey(ref));
		const unique = new Set(keys);

		expect(unique.size).toBe(100);
	});
});
