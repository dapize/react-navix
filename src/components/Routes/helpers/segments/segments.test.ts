import { describe, expect, it } from "vitest";

import { buildConsumed, parseSegments, tryMatchSegments } from "./segments";

describe("parseSegments", () => {
	it("Should parse a static segment", () => {
		expect(parseSegments("users")).toEqual([{ type: "static", value: "users" }]);
	});

	it("Should parse a dynamic segment", () => {
		expect(parseSegments(":id")).toEqual([{ type: "dynamic", value: "id" }]);
	});

	it("Should parse a wildcard segment", () => {
		expect(parseSegments("*")).toEqual([{ type: "wildcard", value: "*" }]);
	});

	it("Should parse mixed segment types", () => {
		expect(parseSegments("users/:id/posts/*")).toEqual([
			{ type: "static", value: "users" },
			{ type: "dynamic", value: "id" },
			{ type: "static", value: "posts" },
			{ type: "wildcard", value: "*" },
		]);
	});

	it("Should return an empty array When the path is empty", () => {
		expect(parseSegments("")).toEqual([]);
	});

	it("Should ignore empty segments from slashes", () => {
		expect(parseSegments("/users//123/")).toEqual([
			{ type: "static", value: "users" },
			{ type: "static", value: "123" },
		]);
	});
});

describe("buildConsumed", () => {
	it("Should build the root path When no segments are consumed", () => {
		expect(buildConsumed([], 0)).toBe("/");
	});

	it("Should build a prefix path from a segment count", () => {
		expect(buildConsumed(["users", "123", "settings"], 2)).toBe("/users/123");
	});

	it("Should build the full path When the count equals the segment length", () => {
		expect(buildConsumed(["users", "123"], 2)).toBe("/users/123");
	});
});

describe("tryMatchSegments", () => {
	it("Should match a static pattern", () => {
		expect(tryMatchSegments(parseSegments("users"), ["users"])).toEqual({ params: {}, consumedCount: 1 });
	});

	it("Should capture dynamic params", () => {
		expect(tryMatchSegments(parseSegments("users/:id"), ["users", "123"])).toEqual({
			params: { id: "123" },
			consumedCount: 2,
		});
	});

	it("Should match a prefix and report the consumed count", () => {
		expect(tryMatchSegments(parseSegments("users/:id"), ["users", "123", "settings"])).toEqual({
			params: { id: "123" },
			consumedCount: 2,
		});
	});

	it("Should capture the wildcard as the remaining segments", () => {
		expect(tryMatchSegments(parseSegments("*"), ["a", "b", "c"])).toEqual({
			params: { "*": "a/b/c" },
			consumedCount: 3,
		});
	});

	it("Should capture the wildcard after a prefix", () => {
		expect(tryMatchSegments(parseSegments("docs/*"), ["docs", "api", "v2"])).toEqual({
			params: { "*": "api/v2" },
			consumedCount: 3,
		});
	});

	it("Should capture an empty wildcard When the pathname ends at the prefix", () => {
		expect(tryMatchSegments(parseSegments("docs/*"), ["docs"])).toEqual({
			params: { "*": "" },
			consumedCount: 1,
		});
	});

	it("Should not match When a wildcard is not the last segment", () => {
		expect(tryMatchSegments(parseSegments("users/*/settings"), ["users", "123", "settings"])).toBeNull();
	});

	it("Should not match When the pattern is longer than the pathname", () => {
		expect(tryMatchSegments(parseSegments("users/123/settings"), ["users", "123"])).toBeNull();
	});

	it("Should not match When static segments differ", () => {
		expect(tryMatchSegments(parseSegments("about"), ["users"])).toBeNull();
	});

	it("Should match an empty pattern without consuming segments", () => {
		expect(tryMatchSegments([], [])).toEqual({ params: {}, consumedCount: 0 });
	});
});
