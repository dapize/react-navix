import { describe, expect, it } from "vitest";

import { resolvePath } from "./resolvePath";

describe("resolvePath", () => {
	it("Should return the absolute path unchanged When to starts with '/'", () => {
		expect(resolvePath("/users", "/dashboard/settings")).toBe("/users");
	});

	it("Should append search to the current pathname When to starts with '?'", () => {
		expect(resolvePath("?q=hello", "/users")).toBe("/users?q=hello");
	});

	it("Should append hash to the current pathname When to starts with '#'", () => {
		expect(resolvePath("#section", "/users")).toBe("/users#section");
	});

	it("Should resolve one level up When to is '..'", () => {
		expect(resolvePath("..", "/users/42")).toBe("/users");
	});

	it("Should stay at root When navigating '..' from '/'", () => {
		expect(resolvePath("..", "/")).toBe("/");
	});

	it("Should resolve two levels up When to is '../..'", () => {
		expect(resolvePath("../..", "/a/b/c")).toBe("/a");
	});

	it("Should resolve sibling route When to is '../sibling'", () => {
		expect(resolvePath("../settings", "/users/42")).toBe("/users/settings");
	});

	it("Should resolve child route relative to current path When to is a plain segment", () => {
		expect(resolvePath("edit", "/users/42")).toBe("/users/42/edit");
	});

	it("Should resolve child route When to starts with './'", () => {
		expect(resolvePath("./edit", "/users/42")).toBe("/users/42/edit");
	});

	it("Should stay at current path When to is empty string", () => {
		expect(resolvePath("", "/users/42")).toBe("/users/42");
	});

	it("Should preserve search and hash When resolving a relative path", () => {
		expect(resolvePath("../sibling?q=1#section", "/users/42")).toBe("/users/sibling?q=1#section");
	});

	it("Should resolve to root When navigating '..' from a single-segment path", () => {
		expect(resolvePath("..", "/users")).toBe("/");
	});

	it("Should handle fromPathname without leading slash", () => {
		expect(resolvePath("..", "users/42")).toBe("/users");
	});

	it("Should handle fromPathname as empty string", () => {
		expect(resolvePath("dashboard", "")).toBe("/dashboard");
	});

	it("Should stay at root When navigating multiple '..' from a shallow path", () => {
		expect(resolvePath("../../../..", "/users")).toBe("/");
	});

	it("Should stay at current path When to is '.'", () => {
		expect(resolvePath(".", "/users/42")).toBe("/users/42");
	});
});
