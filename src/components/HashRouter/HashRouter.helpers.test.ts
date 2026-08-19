import { beforeEach, describe, expect, it } from "vitest";

import { extractLocationFromHash } from "./HashRouter.helpers";

const mockLocation = {
	pathname: "/",
	search: "",
	hash: "",
};

describe("extractLocationFromHash", () => {
	beforeEach(() => {
		mockLocation.hash = "";

		Object.defineProperty(window, "location", {
			configurable: true,
			value: mockLocation,
		});

		Object.defineProperty(window.history, "state", {
			configurable: true,
			writable: true,
			value: null,
		});
	});

	it("Should return default location When hash is empty", () => {
		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "/", search: "", hash: "", key: undefined });
	});

	it("Should return default location When hash is only '#'", () => {
		mockLocation.hash = "#";

		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "/", search: "", hash: "", key: undefined });
	});

	it("Should parse plain pathname from hash", () => {
		mockLocation.hash = "#/users";

		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "/users", search: "", hash: "", key: undefined });
	});

	it("Should parse query string from hash", () => {
		mockLocation.hash = "#/users?q=1";

		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "/users", search: "?q=1", hash: "", key: undefined });
	});

	it("Should parse internal hash anchor from hash", () => {
		mockLocation.hash = "#/article#comments";

		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "/article", search: "", hash: "#comments", key: undefined });
	});

	it("Should parse query string and internal hash together", () => {
		mockLocation.hash = "#/article?id=1#comments";

		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "/article", search: "?id=1", hash: "#comments", key: undefined });
	});

	it("Should strip basename from hash pathname", () => {
		mockLocation.hash = "#/admin/users";

		const result = extractLocationFromHash("/admin");

		expect(result).toEqual({ pathname: "/users", search: "", hash: "", key: undefined });
	});

	it("Should return '/' When hash equals basename exactly", () => {
		mockLocation.hash = "#/admin";

		const result = extractLocationFromHash("/admin");

		expect(result).toEqual({ pathname: "/", search: "", hash: "", key: undefined });
	});

	it("Should strip basename with query string in hash", () => {
		mockLocation.hash = "#/admin/dashboard?q=1";

		const result = extractLocationFromHash("/admin");

		expect(result).toEqual({ pathname: "/dashboard", search: "?q=1", hash: "", key: undefined });
	});

	it("Should strip basename with internal hash in hash", () => {
		mockLocation.hash = "#/admin/dashboard#section";

		const result = extractLocationFromHash("/admin");

		expect(result).toEqual({ pathname: "/dashboard", search: "", hash: "#section", key: undefined });
	});

	it("Should handle basename with query string attached directly", () => {
		mockLocation.hash = "#/admin?q=1";

		const result = extractLocationFromHash("/admin");

		expect(result).toEqual({ pathname: "/", search: "?q=1", hash: "", key: undefined });
	});

	it("Should handle hash without leading slash after #", () => {
		mockLocation.hash = "#users";

		const result = extractLocationFromHash("");

		expect(result).toEqual({ pathname: "users", search: "", hash: "", key: undefined });
	});

	it("Should extract state from window.history.state.usr", () => {
		(window.history as unknown as Record<string, unknown>).state = { idx: 1, usr: { message: "hello" } };

		const result = extractLocationFromHash("");

		expect(result.state).toEqual({ message: "hello" });
	});

	it("Should return undefined for state When window.history.state has no usr", () => {
		(window.history as unknown as Record<string, unknown>).state = { idx: 0 };

		const result = extractLocationFromHash("");

		expect(result.state).toBeUndefined();
	});

	it("Should return undefined for state When window.history.state is null", () => {
		(window.history as unknown as Record<string, unknown>).state = null;

		const result = extractLocationFromHash("");

		expect(result.state).toBeUndefined();
	});

	it("Should decode percent-encoded Unicode in pathname from hash", () => {
		mockLocation.hash = "#/ni%C3%B1o";

		const result = extractLocationFromHash("");

		expect(result.pathname).toBe("/niño");
	});

	it("Should decode pathname but keep search and hash percent-encoded When hash has non-ASCII query and fragment", () => {
		mockLocation.hash = "#/search?q=caf%C3%A9#secci%C3%B3n";

		const result = extractLocationFromHash("");

		expect(result.pathname).toBe("/search");
		expect(result.search).toBe("?q=caf%C3%A9");
		expect(result.hash).toBe("#secci%C3%B3n");
	});

	it("Should not throw and keep the literal '%' When the hash pathname has a malformed percent sequence", () => {
		mockLocation.hash = "#/productos/50%";

		const result = extractLocationFromHash("");

		expect(result.pathname).toBe("/productos/50%");
	});
});
