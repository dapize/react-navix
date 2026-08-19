import { describe, expect, it } from "vitest";

import { parseTo } from "./parseTo";

describe("parseTo", () => {
	it("Should parse a plain pathname", () => {
		expect(parseTo("/users")).toEqual({ pathname: "/users", search: "", hash: "" });
	});

	it("Should parse a pathname with search", () => {
		expect(parseTo("/users?q=1")).toEqual({ pathname: "/users", search: "?q=1", hash: "" });
	});

	it("Should parse a pathname with hash", () => {
		expect(parseTo("/users#section")).toEqual({ pathname: "/users", search: "", hash: "#section" });
	});

	it("Should parse a pathname with search and hash", () => {
		expect(parseTo("/users?q=1#section")).toEqual({ pathname: "/users", search: "?q=1", hash: "#section" });
	});

	it("Should normalize a path without leading slash", () => {
		expect(parseTo("users")).toEqual({ pathname: "/users", search: "", hash: "" });
	});

	it("Should parse a search-only string", () => {
		expect(parseTo("?q=1")).toEqual({ pathname: "/", search: "?q=1", hash: "" });
	});

	it("Should parse a hash-only string", () => {
		expect(parseTo("#section")).toEqual({ pathname: "/", search: "", hash: "#section" });
	});

	it("Should handle an empty string", () => {
		expect(parseTo("")).toEqual({ pathname: "/", search: "", hash: "" });
	});

	it("Should decode Unicode characters in pathname", () => {
		expect(parseTo("/niño")).toEqual({ pathname: "/niño", search: "", hash: "" });
	});

	it("Should decode emoji in pathname", () => {
		expect(parseTo("/rocket🚀")).toEqual({ pathname: "/rocket🚀", search: "", hash: "" });
	});

	it("Should decode CJK characters in pathname", () => {
		expect(parseTo("/中文")).toEqual({ pathname: "/中文", search: "", hash: "" });
	});

	it("Should keep search params percent-encoded When URL has non-ASCII query", () => {
		expect(parseTo("/search?q=café")).toEqual({ pathname: "/search", search: "?q=caf%C3%A9", hash: "" });
	});

	it("Should keep hash fragment percent-encoded When URL has non-ASCII fragment", () => {
		expect(parseTo("/page#sección")).toEqual({ pathname: "/page", search: "", hash: "#secci%C3%B3n" });
	});

	it("Should decode percent-encoded sequences back to their raw form", () => {
		expect(parseTo("/hello%20world")).toEqual({ pathname: "/hello world", search: "", hash: "" });
	});

	it("Should decode pathname while keeping search and hash percent-encoded When all three have Unicode", () => {
		expect(parseTo("/niño?q=café#sección")).toEqual({
			pathname: "/niño",
			search: "?q=caf%C3%A9",
			hash: "#secci%C3%B3n",
		});
	});

	it("Should not throw and keep the literal '%' When the pathname has a malformed percent sequence", () => {
		expect(parseTo("/products/50%")).toEqual({ pathname: "/products/50%", search: "", hash: "" });
	});

	it("Should not throw and keep the truncated sequence When the pathname has an incomplete percent encoding", () => {
		expect(parseTo("/caf%C3")).toEqual({ pathname: "/caf%C3", search: "", hash: "" });
	});

	it("Should not throw When the pathname contains non-hex characters after '%'", () => {
		expect(parseTo("/%ZZ")).toEqual({ pathname: "/%ZZ", search: "", hash: "" });
	});
});
